from __future__ import annotations


def matches_area_filter(entry_area: str, entry_subarea: str, area_filter: str) -> bool:
    normalized_filter = area_filter.strip().lower()
    if not normalized_filter:
        return True

    area = (entry_area or "").strip().lower()
    subarea = (entry_subarea or "").strip().lower()

    if area == normalized_filter:
        return True

    # Preserve usability for imported calculus entries that now live under analysis.
    if normalized_filter in subarea:
        return True

    if normalized_filter == "calculus" and area == "analysis" and "calculus" in subarea:
        return True

    return False
