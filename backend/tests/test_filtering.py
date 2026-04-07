from __future__ import annotations

import unittest

from backend.app.services.filtering import matches_area_filter


class FilteringTests(unittest.TestCase):
    def test_calculus_filter_matches_analysis_subarea(self) -> None:
        self.assertTrue(matches_area_filter("analysis", "differential calculus", "calculus"))

    def test_unrelated_area_does_not_match(self) -> None:
        self.assertFalse(matches_area_filter("analysis", "functional analysis", "geometry"))


if __name__ == "__main__":
    unittest.main()
