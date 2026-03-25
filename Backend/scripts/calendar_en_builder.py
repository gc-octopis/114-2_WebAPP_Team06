import argparse
import calendar
import hashlib
import re
import os
import sys
import django
from datetime import date, timedelta
from io import BytesIO
from pathlib import Path

import pandas as pd
import requests
from bs4 import BeautifulSoup

# Django setup
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from events.models import CalendarEvent

CALENDAR_PAGE_URL = "https://www.aca.ntu.edu.tw/w/acaEN/Calendar"


def parse_args():
    parser = argparse.ArgumentParser(description="Build English NTU calendar from acaEN xls/xlsx and sync to database")
    parser.add_argument("--page-url", default=CALENDAR_PAGE_URL, help="acaEN calendar page URL")
    parser.add_argument("--source-url", default=None, help="direct xls/xlsx URL")
    return parser.parse_args()


def fetch_text(url: str) -> str:
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
    except requests.exceptions.SSLError:
        response = requests.get(url, timeout=30, verify=False)
        response.raise_for_status()

    response.encoding = "utf-8"
    return response.text


def resolve_url(base_url: str, href: str) -> str:
    return requests.compat.urljoin(base_url, href)


def fetch_calendar_links(page_url: str) -> list[tuple[str, str]]:
    html = fetch_text(page_url)
    soup = BeautifulSoup(html, "html.parser")

    links: list[tuple[str, str]] = []
    for anchor in soup.find_all("a", href=True):
        href = anchor.get("href", "").strip()
        if not href:
            continue

        href_lower = href.lower()
        if not (href_lower.endswith(".xls") or href_lower.endswith(".xlsx")):
            continue

        heading = anchor.find_parent(["h1", "h2", "h3", "h4", "h5", "h6"])
        if heading:
            text = " ".join(heading.get_text().split())
        else:
            text = " ".join(anchor.get_text().split())

        links.append((text, resolve_url(page_url, href)))

    return links


def pick_preferred_link(links: list[tuple[str, str]]) -> tuple[str, str]:
    if not links:
        raise ValueError("No xls/xlsx links found on acaEN calendar page")

    today = date.today()
    academic_start_year = today.year if today.month >= 8 else today.year - 1
    target = f"{academic_start_year}-{academic_start_year + 1}"

    for label, url in links:
        if target in label or target in url:
            return label, url

    return links[0]


def fetch_binary(url: str) -> bytes:
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.content
    except requests.exceptions.SSLError:
        # Fallback for environments lacking some CA chain entries.
        response = requests.get(url, timeout=30, verify=False)
        response.raise_for_status()
        return response.content


def parse_year_hint_from_text(text: str) -> int | None:
    match = re.search(r"(20\d{2})[-_](20\d{2})", text)
    if not match:
        return None
    return int(match.group(1))


def parse_events_from_sheet(data: bytes, year_hint: int | None = None) -> list[tuple[date, str]]:
    df = pd.read_excel(BytesIO(data), sheet_name=0, header=None)

    month_map = {month.lower(): idx for idx, month in enumerate(calendar.month_name) if month}
    pattern = re.compile(r"^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d{1,2})\s+(.*)$")

    events: list[tuple[date, str]] = []
    current_year = year_hint

    for _, row in df.iterrows():
        year_cell = row.iloc[0]
        if pd.notna(year_cell):
            year_text = str(year_cell).strip()
            if re.fullmatch(r"\d{4}", year_text):
                current_year = int(year_text)
            else:
                numeric_match = re.search(r"\b(20\d{2})\b", year_text)
                if numeric_match:
                    current_year = int(numeric_match.group(1))

        event_cell = row.iloc[10] if len(row) > 10 else None
        if pd.isna(event_cell):
            continue

        raw_text = " ".join(str(event_cell).split())
        match = pattern.match(raw_text)
        if not match:
            continue

        month_name = match.group(1).strip().lower()
        day = int(match.group(2))
        summary = match.group(3).strip()

        if not summary or month_name not in month_map:
            continue
        if current_year is None:
            continue

        month = month_map[month_name]

        try:
            event_date = date(current_year, month, day)
        except ValueError:
            continue

        events.append((event_date, summary))

    deduped: list[tuple[date, str]] = []
    seen = set()
    for event_date, summary in events:
        key = (event_date.isoformat(), summary)
        if key in seen:
            continue
        seen.add(key)
        deduped.append((event_date, summary))

    deduped.sort(key=lambda item: (item[0], item[1]))
    return deduped


def sync_events_to_db(events: list[tuple[date, str]], language: str = 'en'):
    """Sync events to database"""
    created_count = 0
    updated_count = 0
    
    for event_date, summary in events:
        # Generate a consistent UID
        uid_seed = f"{event_date.isoformat()}::{summary}"
        uid = hashlib.sha1(uid_seed.encode("utf-8")).hexdigest()[:20]
        uid = f"{uid}@myntu-plus-plus"
        
        try:
            _, created = CalendarEvent.objects.update_or_create(
                uid=uid,
                defaults={
                    'language': language,
                    'summary': summary,
                    'date_start': event_date,
                    'date_end': event_date + timedelta(days=1),
                    'location': '',
                    'description': '',
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        except Exception as e:
            print(f"Error syncing event {summary}: {e}")
    
    return created_count, updated_count


def main():
    args = parse_args()

    if args.source_url:
        source_label = "manual-url"
        source_url = args.source_url
    else:
        links = fetch_calendar_links(args.page_url)
        source_label, source_url = pick_preferred_link(links)

    print(f"Using source: {source_label}")
    print(f"Source URL: {source_url}")

    binary = fetch_binary(source_url)
    year_hint = parse_year_hint_from_text(source_label) or parse_year_hint_from_text(source_url)
    events = parse_events_from_sheet(binary, year_hint=year_hint)

    print(f"Parsed {len(events)} events")
    
    # Sync to database
    created, updated = sync_events_to_db(events, language='en')
    print(f"Synced to database: {created} created, {updated} updated")
    
    # Verify
    total = CalendarEvent.objects.filter(language='en').count()
    print(f"Total English events in database: {total}")


if __name__ == "__main__":
    main()
