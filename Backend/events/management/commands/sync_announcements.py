import sys
from pathlib import Path
from datetime import datetime

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from events.models import Announcement


def _parse_announcement_date(value: str):
    raw = (value or '').strip()
    if not raw:
        return None

    for fmt in ('%Y-%m-%d', '%Y/%m/%d', '%Y/%m/%d %H:%M', '%Y-%m-%d %H:%M'):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None


class Command(BaseCommand):
    help = "Scrape announcements and sync them into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--lang",
            choices=["zh", "en"],
            required=True,
            help="Source language to scrape and sync.",
        )
        parser.add_argument(
            "--max-pages",
            type=int,
            default=None,
            help="Limit scraped pages (optional).",
        )

    def handle(self, *args, **options):
        lang = options["lang"]
        max_pages = options["max_pages"]

        backend_root = Path(__file__).resolve().parents[3]
        scripts_dir = backend_root / "scripts"
        if not scripts_dir.exists():
            raise CommandError(f"Scripts directory not found: {scripts_dir}")

        sys.path.insert(0, str(scripts_dir))
        try:
            import announcement_scraper  # type: ignore
        except Exception as exc:
            raise CommandError(f"Failed to import announcement_scraper.py: {exc}")

        self.stdout.write(f"Scraping announcements: lang={lang}")
        raw_items = announcement_scraper.scrape_announcements(lang, max_pages)

        records = []
        for item in raw_items:
            date_value = _parse_announcement_date(str(item.get("date", "")))
            title = str(item.get("title", "")).strip()
            link = str(item.get("link", "")).strip()

            if not date_value or not title or not link:
                continue

            records.append(
                Announcement(
                    language=lang,
                    category=str(item.get("category", "")).strip(),
                    unit=str(item.get("unit", "")).strip(),
                    title=title,
                    date=date_value,
                    link=link,
                )
            )

        with transaction.atomic():
            Announcement.objects.filter(language=lang).delete()
            if records:
                Announcement.objects.bulk_create(records, batch_size=500)

        self.stdout.write(self.style.SUCCESS(f"Synced {len(records)} announcements into DB for lang={lang}."))
