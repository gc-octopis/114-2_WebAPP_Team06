import argparse
import time
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

import pandas as pd
import requests
from bs4 import BeautifulSoup

URLS = {
    "zh": "https://ann.cc.ntu.edu.tw/index.asp?Page={}&catalog=",
    "en": "https://ann.cc.ntu.edu.tw/eng/index.asp?Page={}&catalog=",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0",
}


def parse_args():
    parser = argparse.ArgumentParser(description="Scrape NTU announcement board.")
    parser.add_argument("--lang", choices=["zh", "en"], default="zh", help="source language")
    parser.add_argument("--max-pages", type=int, default=None, help="limit scraped pages")
    parser.add_argument("--output", type=str, default=None, help="output json path")
    return parser.parse_args()


def get_last_page(base_url: str, lang: str) -> int:
    response = requests.get(base_url.format(1), headers=HEADERS, timeout=10)
    response.encoding = "utf-8"
    soup = BeautifulSoup(response.text, "html.parser")

    page_candidates = []

    # Prefer parsing all pagination links. This is robust against label differences
    # like "Last", "Last Page", and localized variants.
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if "Page=" not in href:
            continue

        query = urlparse(href).query
        params = parse_qs(query)
        page = params.get("Page", [None])[0]
        if page is None:
            continue

        try:
            page_candidates.append(int(page))
        except ValueError:
            continue

    if page_candidates:
        return max(page_candidates)

    # Fallback when query parsing fails unexpectedly.
    markers = {"zh": ["最後一頁"], "en": ["Last", "Last Page"]}
    for anchor in soup.find_all("a", href=True):
        if anchor.text.strip() in markers[lang]:
            query = urlparse(anchor["href"]).query
            params = parse_qs(query)
            return int(params.get("Page", [1])[0])

    return 1


def scrape_announcements(lang: str, max_pages: int | None = None):
    base_url = URLS[lang]
    last_page = get_last_page(base_url, lang)

    if max_pages is not None:
        last_page = min(last_page, max_pages)

    print(f"Language: {lang} | Total pages: {last_page}")

    all_data = []

    for page in range(1, last_page + 1):
        print(f"Scraping page {page}")

        response = requests.get(base_url.format(page), headers=HEADERS, timeout=10)
        response.encoding = "utf-8"
        soup = BeautifulSoup(response.text, "html.parser")

        table = soup.find("table", {"width": "780"})
        if not table:
            continue

        rows = table.find_all("tr", class_=["text", "texten"])

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 4:
                continue

            category = cells[0].get_text(strip=True)
            unit = cells[1].get_text(strip=True)

            a_tag = cells[2].find("a", href=True)
            if not a_tag:
                continue

            title = " ".join(a_tag.get_text().split())
            link = urljoin("https://ann.cc.ntu.edu.tw/", a_tag["href"])
            date = cells[3].get_text(strip=True)

            if not title:
                continue

            all_data.append(
                {
                    "category": category,
                    "unit": unit,
                    "title": title,
                    "date": date,
                    "link": link,
                }
            )

        time.sleep(0.3)

    return all_data


def resolve_output_path(args_lang: str, output: str | None) -> Path:
    if output:
        return Path(output).resolve()

    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent.parent
    frontend_public = project_root / "Frontend" / "public"

    file_name = "announcements.en.json" if args_lang == "en" else "announcements.json"
    return frontend_public / file_name


def main():
    args = parse_args()
    data = scrape_announcements(args.lang, args.max_pages)

    df = pd.DataFrame(data)
    if len(df) > 0:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.sort_values(by="date", ascending=False)
        df["date"] = df["date"].dt.strftime("%Y-%m-%d")

    output_path = resolve_output_path(args.lang, args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_json(output_path, orient="records", force_ascii=False, indent=2)

    print(f"\nDone. {len(df)} announcements saved to: {output_path}")


if __name__ == "__main__":
    main()