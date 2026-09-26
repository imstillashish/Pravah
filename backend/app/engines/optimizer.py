"""Vessel allocation MIP (PRD 6.2) via OR-Tools.

Normal mode:  min SUM n_v * (rate_v + demurrage_v) * alloc_v
  s.t.        SUM capacity_v * n_v >= Q                      (demand)
              n_v = 0 unless class feasible at dest          (draft/LOA/beam)
              transit_v <= T_stockout_limit for used classes (deadline)
              n_v integer, n_v <= n_max_v

Emergency mode (PRD 4.2.2): Score = w1*ETA + w2*Feasibility + w3*Cost.
Always emits ranked A/B/C options: fast/premium, balanced, cheap/slow.
"""
import time
from datetime import date

from ortools.linear_solver import pywraplp
from sqlalchemy.orm import Session

from app import geo
from app.connectors.bdry import corridor_rescale
from app.connectors.market import congestion_days
from app.engines.feasibility import evaluate_port
from app.models import Port, VesselClass

ECONOMY = {"HANDYSIZE": 1.35, "SUPRAMAX": 1.15, "PANAMAX": 1.0, "CAPESIZE": 0.85}


def _transit_days(vc: VesselClass, dist_nm: float, dest_locode: str) -> float:
    cong = congestion_days(dest_locode)["waiting_days"]
    return dist_nm / (vc.avg_speed_knots * 24) + cong


def _rate_usd_mt(latest_index_close: float, vc_name: str) -> float:
    return round(latest_index_close * corridor_rescale(vc_name) * ECONOMY.get(vc_name, 1.0), 2)


def _demurrage_usd_mt(dest: Port, vc: VesselClass, quantity_mt: float) -> float:
    cong = congestion_days(dest.locode)["waiting_days"]
    excess = max(0.0, cong - 1.0)
    return excess * 18000.0 / max(1.0, quantity_mt)


def optimize(db: Session, origin: Port, dest: Port, quantity_mt: float,
             latest_index_close: float, emergency_mode: bool = False,
             deadline_days: float | None = None,
             emergency_w: tuple[float, float, float] = (0.5, 0.2, 0.3)) -> dict:
    t0 = time.perf_counter()
    dist = geo.sea_distance_nm(origin.lat, origin.lon, dest.lat, dest.lon)
    feas = {f["vessel_class"]: f for f in evaluate_port(db, dest, quantity_mt)}

    candidates = []
    for vc in db.query(VesselClass).all():
        f = feas.get(vc.name)
        if not f or f["status"] == "RED":
            continue
        n_max = max(1, int(quantity_mt // vc.dwt_min) + 1)
        transit = _transit_days(vc, dist, dest.locode)
        candidates.append({
            "vc": vc, "name": vc.name, "cap": vc.dwt_max, "n_max": n_max,
            "transit": transit, "rate": _rate_usd_mt(latest_index_close, vc.name),
            "demurrage": _demurrage_usd_mt(dest, vc, quantity_mt),
            "feas_penalty": 0.0 if f["status"] == "GREEN" else 0.5,
        })
    if not candidates:
        return {"status": "INFEASIBLE", "diagnostics": {
            "reason": "No vessel class passes draft/LOA/beam checks at destination",
            "feasibility_matrix": feas}, "solve_ms": 0}

    solver = pywraplp.Solver.CreateSolver("SCIP")
    n, use = {}, {}
    for c in candidates:
        n[c["name"]] = solver.IntVar(0, c["n_max"], f"n_{c['name']}")
        use[c["name"]] = solver.BoolVar(f"u_{c['name']}")
        solver.Add(n[c["name"]] <= c["n_max"] * use[c["name"]])
        if deadline_days is not None and c["transit"] > deadline_days:
            solver.Add(use[c["name"]] == 0)  # deadline constraint (PRD 6.2 #4)
    solver.Add(sum(c["cap"] * n[c["name"]] for c in candidates) >= quantity_mt)

    if emergency_mode:
        w_eta, w_feas, w_cost = emergency_w
        eta_max = max(c["transit"] for c in candidates)
        cost_max = max(c["rate"] + c["demurrage"] for c in candidates)
        obj = sum(n[c["name"]] * c["cap"] * (
            w_eta * (c["transit"] / eta_max)
            + w_feas * c["feas_penalty"]
            + w_cost * ((c["rate"] + c["demurrage"]) / cost_max)) for c in candidates)
    else:
        obj = sum(n[c["name"]] * c["cap"] * (c["rate"] + c["demurrage"]) for c in candidates)
    solver.Minimize(obj)

    status = solver.Solve()
    solve_ms = int((time.perf_counter() - t0) * 1000)
    if status not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        return {"status": "INFEASIBLE", "diagnostics": {
            "reason": "Demand cannot be met within deadline by feasible classes",
            "deadline_days": deadline_days, "feasibility_matrix": feas}, "solve_ms": solve_ms}

    def _combo(c):
        k = int(n[c["name"]].solution_value())
        return {"vessel_class": c["name"], "vessels": k, "capacity_mt": k * c["cap"],
                "transit_days": round(c["transit"], 1),
                "rate_usd_mt": c["rate"], "demurrage_usd_mt": round(c["demurrage"], 2),
                "freight_usd": round(k * c["cap"] * (c["rate"] + c["demurrage"]), 0)} if k else None

    chosen = [x for x in (_combo(c) for c in candidates) if x]
    ranked = _rank_options(candidates, quantity_mt, deadline_days)
    return {
        "status": "OPTIMAL",
        "emergency_mode": emergency_mode,
        "distance_nm": dist,
        "recommended": chosen,
        "ranked_options": ranked,
        "solve_ms": solve_ms,
        "feasibility_matrix": feas,
    }


def _rank_options(candidates: list[dict], quantity_mt: float, deadline_days: float | None) -> list[dict]:
    """Emergency Fixture Matrix: A fast/premium, B balanced, C cheap/slow (flagged)."""
    def fill(c):
        k = max(1, -(-int(quantity_mt) // int(c["cap"])))
        return {"vessel_class": c["name"], "vessels": k, "capacity_mt": k * c["cap"],
                "transit_days": round(c["transit"], 1),
                "rate_usd_mt": c["rate"],
                "freight_usd": round(k * c["cap"] * c["rate"], 0)}

    by_eta = sorted(candidates, key=lambda c: c["transit"])
    by_cost = sorted(candidates, key=lambda c: c["rate"] + c["demurrage"])
    balanced = sorted(candidates, key=lambda c: c["transit"] / max(c["rate"] + c["demurrage"], 1e-9))
    out = []
    for label, c, note in [
        ("A", by_eta[0], "Fast ETA, premium freight, port-fit"),
        ("B", balanced[0], "Medium ETA, balanced cost"),
        ("C", by_cost[0], "Lowest cost — flagged STOCK_OUT_RISK if late"
         if deadline_days is not None and by_cost[0]["transit"] > deadline_days
         else "Lowest cost"),
    ]:
        o = fill(c)
        o.update({"option": label, "note": note,
                  "stockout_risk": deadline_days is not None and c["transit"] > deadline_days})
        out.append(o)
    return out
