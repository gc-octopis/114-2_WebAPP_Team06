import { main as syncCalendarEn } from "./calendar_en_builder";
import { main as syncCalendarZh } from "./calendar_zh_builder";
import { main as syncAnnouncements } from "./announcement_scraper";
import { main as syncLinks } from "./fetch_myntu_links";

export async function main() {
  await syncCalendarEn();
  await syncCalendarZh();
  await syncAnnouncements();
  await syncLinks();
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
