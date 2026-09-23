"""
Resets demo database to clean seed state for re-running the demo.
Tasks 269–270 implementation.
"""
import sys
from pathlib import Path

_scripts_dir = Path(__file__).resolve().parent
_repo_root = _scripts_dir.parent
_backend_dir = _repo_root / "backend"
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))
if str(_scripts_dir) not in sys.path:
    sys.path.insert(0, str(_scripts_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.database import SessionLocal, engine, Base
from seed_reference_data import seed_all_reference_data
from seed_demo_scenarios import seed_all_demo_scenarios



def reset_to_clean_state():
    """
    Task 269:
    Clears all application tables in proper dependency order,
    then re-seeds reference data and demo scenarios.
    Works seamlessly on both PostgreSQL and SQLite.
    """
    print("=" * 60)
    print("ASTITVA — RESETTING DEMO DATABASE")
    print("=" * 60)

    # Tables to clear in reverse-dependency order
    table_names = [
        "vendor_quotes",
        "cargo_requests",
        "audit_logs",
        "regret_scores",
        "decision_records",
        "recommendations",
        "risk_results",
        "landed_costs",
        "feasibility_results",
        "forecast_results",
        "stockout_alerts",
        "enrichment_cache",
        "context_objects",
        "disruption_alerts",
        "analyses",
        "users",
    ]

    with engine.begin() as conn:
        dialect_name = engine.dialect.name
        if dialect_name == "postgresql":
            # PostgreSQL TRUNCATE CASCADE
            try:
                tables_str = ", ".join(table_names)
                conn.execute(f"TRUNCATE TABLE {tables_str} RESTART IDENTITY CASCADE;")
                print("  [x] Truncated tables with CASCADE (PostgreSQL)")
            except Exception as e:
                print(f"  [!] Fallback to individual deletes: {e}")
                for tbl in table_names:
                    try:
                        conn.execute(f"DELETE FROM {tbl};")
                    except Exception:
                        pass
        else:
            # SQLite / Generic delete
            for tbl in table_names:
                try:
                    conn.exec_driver_sql(f"DELETE FROM {tbl};")
                except Exception:
                    pass
            print("  [x] Cleared application tables (SQLite/Local)")

    # Re-run all reference data seeds (Tasks 86-90)
    seed_all_reference_data()

    # Re-run all demo scenario seeds (Tasks 256-267, 357, 402)
    seed_all_demo_scenarios()

    # Task 270: Confirmation message
    print("=" * 60)
    print("Demo database reset complete. Ready for fresh demo.")
    print("=" * 60)


if __name__ == "__main__":
    reset_to_clean_state()
