"""
Deterministic series generation for global metrics (spec §4.2).

Seeded mulberry32-style PRNG (pure stdlib), walked BACKWARDS from the
current headline so series[-1] == endpoint exactly. Day-stable seed key
keeps responses cacheable and testable within a day.
"""
from datetime import date


def _mulberry32(seed: int):
    state = seed & 0xFFFFFFFF

    def rand() -> float:
        nonlocal state
        state = (state + 0x6D2B79F5) & 0xFFFFFFFF
        t = state
        t = (t ^ (t >> 15)) * (t | 1) & 0xFFFFFFFF
        t = (t ^ (t + ((t ^ (t >> 7)) * (t | 61) & 0xFFFFFFFF))) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 0x100000000

    return rand


def generate_series(seed_key: str, endpoint: float, n: int = 30, vol: float = 0.02) -> list[float]:
    """Random walk ending exactly at `endpoint`. `vol` = max per-step swing."""
    seed = abs(hash(f"{seed_key}-{date.today().isoformat()}")) & 0xFFFFFFFF
    rand = _mulberry32(seed)
    values = [endpoint]
    current = endpoint
    for _ in range(n - 1):
        current = max(endpoint * 0.0001, current / (1 + (rand() - 0.5) * 2 * vol))
        values.append(current)
    values.reverse()
    return [round(v, 4) for v in values]
