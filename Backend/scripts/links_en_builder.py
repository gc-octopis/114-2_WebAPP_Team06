import json
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

SOURCE_URL = "https://my.ntu.edu.tw/Default.aspx?lang=eng"
HEADERS = {"User-Agent": "Mozilla/5.0"}

CATEGORY_LABEL_EN = {
    "teaching": "Teaching",
    "library": "Library & Research",
    "finance": "Accounts",
    "venue": "Facilities",
    "campus": "Resources",
    "news": "Bulletin",
    "feedback": "Opinions",
}


def normalize_url(url: str) -> str:
    parsed = urlparse(url.strip())
    path = parsed.path.rstrip("/")
    return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}{path}"


def collect_english_labels() -> dict[str, str]:
    response = requests.get(SOURCE_URL, headers=HEADERS, timeout=15)
    response.raise_for_status()
    response.encoding = "utf-8"

    soup = BeautifulSoup(response.text, "html.parser")

    labels = {}
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        text = " ".join(anchor.get_text().split())

        if not href or not text:
            continue
        if href.startswith("#"):
            continue
        if href.lower().startswith("javascript:"):
            continue

        labels[href] = text
        labels[normalize_url(href)] = text

    return labels


def main():
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent.parent
    links_path = project_root / "Frontend" / "public" / "links.json"
    output_path = project_root / "Frontend" / "public" / "links.en.json"

    with links_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    english_labels = collect_english_labels()

    for category in data:
        if category.get("id") in CATEGORY_LABEL_EN:
            category["label_en"] = CATEGORY_LABEL_EN[category["id"]]

        for item in category.get("links", []):
            url = item.get("url", "")
            en_label = (
                english_labels.get(url)
                or english_labels.get(normalize_url(url))
            )

            if en_label:
                item["label_en"] = en_label
            else:
                item.pop("label_en", None)

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

    print(f"Done. English links saved to: {output_path}")


if __name__ == "__main__":
    main()
