import json
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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

LINK_LABEL_EN = {
    "通識課程地圖": "General Education Course Map",
    "成績與名次查詢": "Grades and Rank Inquiry",
    "領域專長查詢": "Specialization Search",
    "臺大新課程網": "NTU Course Website",
    "網路選課系統": "Online Course Registration System",
    "學生在學狀態查詢": "Student Enrollment Status Inquiry",
    "臺大慕課 Coursera": "NTU MOOCs Coursera",
    "學生請假簽核": "Student Leave Approval",
    "修課人數查詢": "Course Enrollment Count Inquiry",
    "遠距教學課程": "Distance Learning Courses",
    "JADE 期刊文獻傳遞": "JADE Journal Document Delivery",
    "Turnitin 原創性檢查": "Turnitin Originality Check",
    "臺大學術典藏 NTUR": "NTU Scholarly Repository (NTUR)",
    "學術成果資訊維護": "Research Output Management",
    "雲端圖書館 SLIM": "SLIM Cloud Library",
    "個人圖書借閱查詢": "Personal Library Borrowing Inquiry",
    "館際合作借閱": "Interlibrary Loan",
    "計畫摘要上傳": "Project Abstract Upload",
    "臺大計畫查詢": "NTU Project Search",
    "保費證明": "Insurance Certificate",
    "出國旅費E化結報": "Online Travel Expense Reimbursement",
    "薪資入帳變更申請": "Salary Deposit Account Change Request",
    "支付查詢暨付款通知": "Payment Inquiry and Remittance Notice",
    "報帳/請購/臨時薪資": "Reimbursement / Purchase Request / Temporary Salary",
    "教職員薪資查詢": "Faculty and Staff Salary Inquiry",
    "財物編號標籤申請": "Property Tag Application",
    "職務宿舍繳費證明": "Official Dormitory Payment Certificate",
    "財產物品管理": "Property and Asset Management",
    "教職員所得稅查詢": "Faculty and Staff Income Tax Inquiry",
    "修繕申請": "Maintenance Request",
    "總務處會議室": "General Affairs Office Meeting Rooms",
    "門禁管理": "Access Control Management",
    "停車證申請": "Parking Permit Application",
    "停車場多元支付": "Parking Payment Options",
    "地圖與交通資訊": "Map and Transportation Information",
    "教室會議室借用": "Classroom and Meeting Room Reservation",
    "體育場地預約": "Sports Facility Reservation",
    "NTU Mail 服務": "NTU Mail Service",
    "網路問題回報": "Network Issue Report",
    "保健中心預約": "Health Center Appointment",
    "校園軟體下載": "Campus Software Download",
    "VPN 虛擬私有網路": "VPN Virtual Private Network",
    "Wi-Fi 無線網路": "Wi-Fi Wireless Network",
    "NTU WebMaker": "NTU WebMaker",
    "校園公佈欄": "Campus Bulletin Board",
    "活動報名": "Event Registration",
    "臺大行事曆": "NTU Academic Calendar",
    "臺大電子報": "NTU ePaper",
    "校內徵才公告": "Campus Job Listings",
    "滿意度問卷調查": "Satisfaction Survey",
    "教職員投票": "Faculty and Staff Voting",
    "校務建言": "Campus Suggestions",
    "行政興革意見信箱": "Administrative Improvement Mailbox",
    "校務會議提案討論區": "University Affairs Proposal Forum",
}


def normalize_url(url: str) -> str:
    parsed = urlparse(url.strip())
    path = parsed.path.rstrip("/")
    return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}{path}"


def collect_english_labels() -> dict[str, str]:
    labels = {}
    try:
        response = requests.get(SOURCE_URL, headers=HEADERS, timeout=15, verify=False)
        response.raise_for_status()
        response.encoding = "utf-8"

        soup = BeautifulSoup(response.text, "html.parser")

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
    except Exception:
        pass

    return labels


def translate_label(item: dict, english_labels: dict[str, str]) -> str:
    url = item.get("url", "")
    original_label = str(item.get("label", "")).strip()

    return (
        LINK_LABEL_EN.get(original_label)
        or english_labels.get(url)
        or english_labels.get(normalize_url(url))
        or item.get("label_en")
        or original_label
    )


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
            item["label_en"] = translate_label(item, english_labels)

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

    print(f"Done. English links saved to: {output_path}")


if __name__ == "__main__":
    main()
