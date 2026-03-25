import argparse
import os
import sys
import django
from pathlib import Path
import hashlib

import requests

# Django setup
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from events.models import CalendarEvent

DEFAULT_PAGE_URL = (
    "https://mail.ntu.edu.tw/owa/calendar/"
    "231111d435d54d41908fa9c59d0812a3@ntu.edu.tw/"
    "4576890d12e040bab4ab864c413aa2be12994112486015644960/calendar.html"
)


def parse_args():
    parser = argparse.ArgumentParser(description="Download NTU Chinese published calendar and sync to database")
    parser.add_argument("--page-url", default=DEFAULT_PAGE_URL, help="published calendar html URL")
    parser.add_argument("--source-url", default=None, help="direct calendar .ics URL")
    return parser.parse_args()


def to_ics_url(url: str) -> str:
    normalized = url.strip()

    if normalized.lower().endswith(".ics"):
        return normalized
    if normalized.lower().endswith(".html"):
        return normalized[:-5] + ".ics"

    if normalized.endswith("/"):
        return normalized + "calendar.ics"

    return normalized + "/calendar.ics"


def fetch_ics(url: str) -> str:
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
    except requests.exceptions.SSLError:
        response = requests.get(url, timeout=30, verify=False)
        response.raise_for_status()

    text = response.text
    if "BEGIN:VCALENDAR" not in text:
        raise ValueError("Downloaded content is not a valid ICS file")

    return text


def parse_ics_events(ics_content: str) -> list:
    """Parse ICS content and extract events"""
    events = []
    event_blocks = ics_content.split('BEGIN:VEVENT')
    
    for i in range(1, len(event_blocks)):
        block_content = 'BEGIN:VEVENT' + event_blocks[i]
        event = parse_event(block_content)
        if event and event.get('summary'):
            events.append(event)
    
    return events


def parse_event(block_content: str) -> dict:
    """Parse a single VEVENT block"""
    event = {}
    unfolded = remove_ics_folding(block_content)
    
    # Extract summary
    summary_match = extract_ics_field(unfolded, 'SUMMARY')
    if summary_match:
        event['summary'] = summary_match
    else:
        return None
    
    # Extract dates
    dtstart_match = extract_ics_date(unfolded, 'DTSTART')
    if dtstart_match:
        event['date_start'] = dtstart_match
    else:
        return None
    
    dtend_match = extract_ics_date(unfolded, 'DTEND')
    if dtend_match:
        event['date_end'] = dtend_match
    
    # Extract optional fields
    location_match = extract_ics_field(unfolded, 'LOCATION')
    event['location'] = location_match or ''
    
    description_match = extract_ics_field(unfolded, 'DESCRIPTION')
    event['description'] = description_match or ''
    
    # Generate UID from content
    uid_match = extract_ics_field(unfolded, 'UID')
    if uid_match:
        event['uid'] = uid_match
    else:
        # Fallback: generate from summary + date
        uid_content = f"{event['summary']}{event['date_start']}"
        event['uid'] = hashlib.sha256(uid_content.encode()).hexdigest()[:64]
    
    return event


def remove_ics_folding(text: str) -> str:
    """Remove ICS line folding"""
    return text.replace('\r\n ', '').replace('\r\n\t', '')


def extract_ics_field(text: str, field_name: str) -> str | None:
    """Extract a simple text field from ICS"""
    import re
    pattern = rf'{field_name}(?:;[^:]*)?:([^\r\n]+)'
    match = re.search(pattern, text)
    return match.group(1).strip() if match else None


def extract_ics_date(text: str, field_name: str) -> str | None:
    """Extract date from ICS DTSTART/DTEND field"""
    import re
    pattern = rf'{field_name}[^:]*:(\d{{8}})'
    match = re.search(pattern, text)
    if not match:
        return None
    
    datestr = match.group(1)
    year = datestr[0:4]
    month = datestr[4:6]
    day = datestr[6:8]
    return f"{year}-{month}-{day}"


def sync_events_to_db(events: list, language: str = 'zh'):
    """Sync events to database"""
    created_count = 0
    updated_count = 0
    
    for event_data in events:
        uid = event_data.get('uid', '')
        
        # Try to update or create
        try:
            _, created = CalendarEvent.objects.update_or_create(
                uid=uid,
                defaults={
                    'language': language,
                    'summary': event_data['summary'],
                    'date_start': event_data['date_start'],
                    'date_end': event_data.get('date_end'),
                    'location': event_data.get('location', ''),
                    'description': event_data.get('description', ''),
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        except Exception as e:
            print(f"Error syncing event {event_data.get('summary', 'Unknown')}: {e}")
    
    return created_count, updated_count


def main():
    args = parse_args()

    source_url = args.source_url if args.source_url else to_ics_url(args.page_url)
    print(f"Source URL: {source_url}")

    # Fetch ICS content
    ics_text = fetch_ics(source_url)
    print(f"Downloaded ICS content ({len(ics_text)} bytes)")

    # Parse events
    events = parse_ics_events(ics_text)
    print(f"Parsed {len(events)} events")

    # Sync to database
    created, updated = sync_events_to_db(events, language='zh')
    print(f"Synced to database: {created} created, {updated} updated")
    
    # Verify
    total = CalendarEvent.objects.filter(language='zh').count()
    print(f"Total Chinese events in database: {total}")


if __name__ == "__main__":
    main()
