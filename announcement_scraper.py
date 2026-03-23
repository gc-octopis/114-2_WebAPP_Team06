import requests
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin, parse_qs, urlparse
import time

base_url = 'https://ann.cc.ntu.edu.tw/index.asp?Page={}&catalog='
headers = {
    "User-Agent": "Mozilla/5.0",
}

# =========================
# 1️⃣ 找最後一頁
# =========================
resp = requests.get(base_url.format(1), headers=headers, timeout=10)
resp.encoding = 'utf-8'
soup = BeautifulSoup(resp.text, 'html.parser')

last_page_num = 1
for a in soup.find_all('a', href=True):
    if a.text.strip() == '最後一頁':
        query = urlparse(a['href']).query
        params = parse_qs(query)
        last_page_num = int(params.get('Page', [1])[0])
        break

print(f"總頁數: {last_page_num}")

# =========================
# 2️⃣ 開始爬
# =========================
all_data = []

for page in range(1, last_page_num + 1):
    print(f"抓取第 {page} 頁")
    
    resp = requests.get(base_url.format(page), headers=headers, timeout=10)
    resp.encoding = 'utf-8'
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    table = soup.find('table', {'width': '780'})
    if not table:
        continue
    
    rows = table.find_all('tr', {'class': 'text'})
    
    for row in rows:
        cells = row.find_all('td')
        
        # 過濾表頭
        if len(cells) < 4:
            continue
        
        # ⭐ 直接用固定欄位（最穩）
        category = cells[0].get_text(strip=True)   # 類別（緊急/一般/徵才）
        unit     = cells[1].get_text(strip=True)   # 單位名稱
        
        a_tag = cells[2].find('a', href=True)
        if not a_tag:
            continue
        
        title = ' '.join(a_tag.get_text().split())  # 公告主旨
        link  = urljoin('https://ann.cc.ntu.edu.tw/', a_tag['href'])
        
        date = cells[3].get_text(strip=True)  # 公告日期
        
        if not title:
            continue
        
        all_data.append({
            'category': category,
            'unit': unit,
            'title': title,
            'date': date,
            'link': link
        })
    
    time.sleep(0.3)

# =========================
# 3️⃣ DataFrame
# =========================
df = pd.DataFrame(all_data)

if len(df) > 0:
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df.sort_values(by='date', ascending=False)
    df['date'] = df['date'].dt.strftime('%Y-%m-%d')

# =========================
# 4️⃣ 輸出
# =========================
df.to_json('announcements.json', orient='records', force_ascii=False, indent=2)

print(f"\n✅ 完成抓取 {len(df)} 筆公告")
print(df.head())