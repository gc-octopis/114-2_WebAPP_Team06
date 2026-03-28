import time

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Run announcement scraper on schedule."

    def add_arguments(self, parser):
        parser.add_argument(
            "--interval-minutes",
            type=int,
            default=60,
            help="Run interval in minutes (default: 60).",
        )
        parser.add_argument(
            "--langs",
            nargs="+",
            default=["zh", "en"],
            help="Languages to scrape. Allowed: zh en (default: zh en).",
        )
        parser.add_argument(
            "--once",
            action="store_true",
            help="Run a single sync and exit.",
        )

    def handle(self, *args, **options):
        interval_minutes = options["interval_minutes"]
        langs = [str(lang).lower() for lang in options["langs"]]
        run_once = options["once"]

        if interval_minutes < 1:
            raise CommandError("--interval-minutes must be >= 1")

        invalid_langs = [lang for lang in langs if lang not in {"zh", "en"}]
        if invalid_langs:
            raise CommandError(f"Invalid langs: {', '.join(invalid_langs)}")

        if not langs:
            raise CommandError("At least one language is required.")

        self.stdout.write(self.style.SUCCESS("Announcement scheduler started."))
        self.stdout.write(f"Languages: {', '.join(langs)}")
        self.stdout.write(f"Interval: {interval_minutes} minute(s)")

        try:
            while True:
                start_ts = time.strftime("%Y-%m-%d %H:%M:%S")
                self.stdout.write(f"[{start_ts}] Running announcement sync...")

                all_ok = True
                for lang in langs:
                    self.stdout.write(f"Running sync_announcements --lang {lang}")
                    try:
                        call_command("sync_announcements", lang=lang)
                    except Exception as exc:
                        all_ok = False
                        self.stderr.write(f"Sync failed for lang={lang}: {exc}")

                end_ts = time.strftime("%Y-%m-%d %H:%M:%S")
                if all_ok:
                    self.stdout.write(self.style.SUCCESS(f"[{end_ts}] Announcement sync completed."))
                else:
                    self.stderr.write(f"[{end_ts}] Announcement sync finished with errors.")

                if run_once:
                    return

                sleep_seconds = interval_minutes * 60
                self.stdout.write(f"Sleeping {sleep_seconds} seconds...")
                time.sleep(sleep_seconds)

        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Scheduler stopped by user."))
