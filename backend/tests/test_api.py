from __future__ import annotations

import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.config import Settings
from backend.app.main import create_app


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        settings = Settings(
            content_dir=PROJECT_ROOT / "content",
            neo4j_uri="",
            neo4j_username="neo4j",
            neo4j_password="mapofmath",
            data_backend="memory",
        )
        cls._client_context = TestClient(create_app(settings=settings))
        cls.client = cls._client_context.__enter__()

    @classmethod
    def tearDownClass(cls) -> None:
        cls._client_context.__exit__(None, None, None)

    def test_search_endpoint_filters_concepts(self) -> None:
        response = self.client.get("/api/search", params={"q": "change", "type": "concept"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(any(item["slug"] == "derivative" for item in payload))
        self.assertTrue(all(item["type"] == "concept" for item in payload))

    def test_wiki_detail_returns_connections(self) -> None:
        response = self.client.get("/api/wiki/derivative")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["slug"], "derivative")
        self.assertGreaterEqual(len(payload["connections"]), 2)

    def test_graph_endpoint_includes_area_cluster_nodes(self) -> None:
        response = self.client.get("/api/graph", params={"center": "wiki:derivative", "depth": 1})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(any(node["type"] == "area" for node in payload["nodes"]))
        self.assertTrue(any(edge["relation_type"] == "belongs_to_area" for edge in payload["edges"]))

    def test_search_limit_is_applied(self) -> None:
        response = self.client.get("/api/search", params={"limit": 2})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 2)

    def test_graph_limit_caps_non_area_nodes(self) -> None:
        response = self.client.get("/api/graph", params={"depth": 2, "limit": 3})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        non_area_nodes = [node for node in payload["nodes"] if node["type"] != "area"]
        self.assertLessEqual(len(non_area_nodes), 3)

    def test_timeline_orders_entries_chronologically(self) -> None:
        response = self.client.get("/api/timeline", params={"area": "calculus"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        years = [group["year"] for group in payload]
        self.assertEqual(years, sorted(years))
        self.assertTrue(
            all(
                item["historical_start_year"] == group["year"]
                for group in payload
                for item in group["items"]
            )
        )

    def test_cors_header_present_for_frontend_origin(self) -> None:
        response = self.client.get(
            "/api/search",
            headers={"Origin": "http://127.0.0.1:3000"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "http://127.0.0.1:3000",
        )


if __name__ == "__main__":
    unittest.main()
