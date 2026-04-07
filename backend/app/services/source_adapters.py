from __future__ import annotations

from dataclasses import dataclass, field
import json
from typing import List
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen



WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php"
WIKIPEDIA_LICENSE = "CC BY-SA 4.0"


@dataclass
class ImportedPage:
    page_id: str
    title: str
    canonical_url: str
    extract: str
    links: List[str] = field(default_factory=list)


class WikipediaSourceAdapter:
    def __init__(self) -> None:
        self._headers = {
            "User-Agent": "MapOfMathImporter/0.1 (local development dataset builder)",
            "Accept": "application/json",
        }

    def fetch_page(self, title: str) -> ImportedPage:
        query_string = urlencode(
            {
                "action": "query",
                "format": "json",
                "formatversion": "2",
                "prop": "extracts|info|links",
                "titles": title,
                "redirects": 1,
                "inprop": "url",
                "explaintext": 1,
                "exsectionformat": "plain",
                "exchars": 3200,
                "pllimit": "max",
            }
        )
        request = Request("{0}?{1}".format(WIKIPEDIA_API_URL, query_string), headers=self._headers)
        with urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
        pages = payload.get("query", {}).get("pages", [])
        if not pages or "missing" in pages[0]:
            raise ValueError("Wikipedia page not found: {0}".format(title))

        page = pages[0]
        links = [link["title"] for link in page.get("links", []) if "title" in link]
        extract = (page.get("extract") or "").strip()
        canonical_url = page.get("fullurl") or "https://en.wikipedia.org/wiki/{0}".format(
            quote(page["title"].replace(" ", "_"))
        )
        return ImportedPage(
            page_id=str(page["pageid"]),
            title=page["title"],
            canonical_url=canonical_url,
            extract=extract,
            links=links,
        )

    def close(self) -> None:
        return None
