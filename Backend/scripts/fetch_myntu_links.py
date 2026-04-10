#!/usr/bin/env python3
"""
fetch_myntu_links.py
--------------------
從 myNTU 官方 API (mainHandler.ashx) 抓取所有分類連結（中英文）。
輸出格式替換 Frontend/public/links.json，同時供 import_links 匯入 DB。

使用方式（從 Backend 目錄執行）:
    python scripts/fetch_myntu_links.py
或透過 sync_data.sh:
    ./sync_data.sh links
"""

import json
import sys
import time
from pathlib import Path

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_URL = "https://my.ntu.edu.tw/mainHandler.ashx"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# 所有分類（中文名稱 → 英文名稱），順序即前端顯示順序
CATEGORIES = [
    {"id": "students",  "zh": "學生專區",  "en": "Students",   "icon": "🎓"},
    {"id": "courses",   "zh": "課程學習",  "en": "Courses",    "icon": "📚"},
    {"id": "faculty",   "zh": "教職申辦",  "en": "Faculty & Staff", "icon": "👔"},
    {"id": "teaching",  "zh": "教學",      "en": "Teaching",   "icon": "🏫"},
    {"id": "library",   "zh": "圖書研究",  "en": "Research",   "icon": "🔬"},
    {"id": "finance",   "zh": "帳務財物",  "en": "Accounts",   "icon": "💰"},
    {"id": "venue",     "zh": "場館交通",  "en": "Facilities", "icon": "🏟️"},
    {"id": "campus",    "zh": "校園資源",  "en": "Resources",  "icon": "🏫"},
    {"id": "news",      "zh": "消息公告",  "en": "Bulletin",   "icon": "📢"},
    {"id": "feedback",  "zh": "意見交流",  "en": "Opinions",   "icon": "💬"},
]

DEFAULT_ICON_URL = "https://my.ntu.edu.tw/nasattach/0.png"

def check_image_exists(url: str, session: requests.Session) -> bool:
    try:
        response = session.head(url, verify=False, timeout=3)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


def create_session(lang_param: str) -> requests.Session:
    """建立帶語言 cookie 的 Session。"""
    session = requests.Session()
    session.headers.update(HEADERS)
    init_url = f"https://my.ntu.edu.tw/Default.aspx?lang={lang_param}"
    try:
        session.get(init_url, verify=False, timeout=15)
    except Exception as e:
        print(f"  ⚠ 初始化 session 失敗 ({lang_param}): {e}", file=sys.stderr)
    return session


def fetch_category(session: requests.Session, search_name: str) -> list[dict]:
    """呼叫 API 取得單一分類的所有連結。"""
    try:
        resp = session.post(
            API_URL,
            data={"type": "more", "searchName": search_name},
            verify=False,
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  ⚠ 取得 '{search_name}' 失敗: {e}", file=sys.stderr)
        return []


def build_icon_url(sys_id: str | int) -> str:
    return f"https://my.ntu.edu.tw/nasattach/{sys_id}.png"


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent.parent
    output_path = project_root / "Frontend" / "public" / "links.json"

    print("=" * 60)
    print("myNTU Links Scraper")
    print("=" * 60)

    # ── 階段一：抓中文資料 ──────────────────────────────────
    print("\n[1/2] 抓取中文資料...")
    session_zh = create_session("cht")
    raw: dict[str, dict] = {}  # sys_id → record

    for cat in CATEGORIES:
        items = fetch_category(session_zh, cat["zh"])
        for item in items:
            sys_id = str(item.get("sys_id", ""))
            if not sys_id or sys_id in raw:
                continue

            guessed_icon_url = build_icon_url(sys_id)
            if check_image_exists(guessed_icon_url, session_zh):
                final_icon_url = guessed_icon_url
            else:
                final_icon_url = DEFAULT_ICON_URL

            raw[sys_id] = {
                "sys_id":      sys_id,
                "category_id": cat["id"],
                "name_zh":     (item.get("sys_cname") or "").strip(),
                "name_en":     "",
                "link_zh":     (item.get("href") or "").strip(),
                "link_en":     "",
                "icon_url":    final_icon_url,
            }
        print(f"  {cat['zh']}: {len(items)} 筆")
        time.sleep(0.15)

    print(f"  → 共 {len(raw)} 筆唯一連結")

    # ── 階段二：抓英文資料並合併 ────────────────────────────
    print("\n[2/2] 抓取英文資料並合併...")
    session_en = create_session("eng")

    for cat in CATEGORIES:
        items = fetch_category(session_en, cat["en"])
        for item in items:
            sys_id = str(item.get("sys_id", ""))
            if sys_id in raw:
                raw[sys_id]["name_en"] = (item.get("sys_cname") or "").strip()
                raw[sys_id]["link_en"] = (item.get("href") or "").strip()
        print(f"  {cat['en']}: {len(items)} 筆")
        time.sleep(0.15)

    # ── 組裝輸出格式 ────────────────────────────────────────
    # 依分類分組
    grouped: dict[str, list[dict]] = {cat["id"]: [] for cat in CATEGORIES}
    for record in raw.values():
        cat_id = record["category_id"]
        if cat_id not in grouped:
            continue
        grouped[cat_id].append({
            "label":    record["name_zh"],
            "label_en": record["name_en"],   # 空字串代表英文版不顯示
            "url":      record["link_zh"],
            "url_en":   record["link_en"],   # 英文版專屬連結（可與中文相同）
            "icon":     record["icon_url"],
        })

    output = []
    for cat in CATEGORIES:
        output.append({
            "id":       cat["id"],
            "icon":     cat["icon"],
            "label":    cat["zh"],
            "label_en": cat["en"],
            "links":    grouped[cat["id"]],
        })

    # ── 寫出 JSON ───────────────────────────────────────────
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    total_links = sum(len(cat["links"]) for cat in output)
    print(f"\n✅ 完成！共 {total_links} 筆連結寫入 {output_path}")
    print("\n分類統計：")
    for cat in output:
        n = len(cat["links"])
        en_count = sum(1 for l in cat["links"] if l["label_en"])
        print(f"  {cat['icon']} {cat['label']} ({cat['id']}): {n} 筆，英文名稱 {en_count}/{n}")


if __name__ == "__main__":
    main()
