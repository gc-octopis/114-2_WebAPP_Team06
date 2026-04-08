# MyNTU++

本組目標為設計一個介面更好看的 MyNTU，使其具備「美化、簡約、現代化」的特色，核心設計哲學將從現有的「公佈欄式條列（Directory）」轉變為「個人化儀表板（Personalized Dashboard）」。

---

## 進度

* [Week3](./HW_Report/Week03_Report.md)
* [Week4](./HW_Report/Week04_Report.md)
* [Week5](./HW_Report/Week05_Report.md)
* [Week6](./HW_Report/Week06_Report.md)
* [Week7](./HW_Report/Week07_Report.md)

---

## 開發指南

目前已經分出前後端，分別在 `Frontend` 和 `Backend` 目錄下。

### 前端初始設定

由於已經引入 React，因此不能「直接打開 html 檔」來預覽了。請按照以下步驟設定開發環境：

1. 安裝 bun  
Linux / MacOS: 
```bash
curl -fsSL https://bun.sh/install | bash
```
Windows:
```ps1
powershell -c "irm bun.sh/install.ps1 | iex"
```

2. 安裝套件
```bash
cd Frontend/
bun install
```
這個指令會自動安裝目前已安裝的套件。如果未來有人安裝新套件並推上來，請在同步（`pull`）後在自己的電腦再跑一次來取得新套件。

3. 啟動開發伺服器
```bash
bun run dev
```
這個指令會建立一個 localhost 的開發伺服器。請依照終端機提供的網址打開網頁。理論上每次儲存新進度時就會自動更新，不需要手動重新整理。

### 後端初始設定

**請確認系統已安裝 Python**

1. 進入後端目錄
```bash
cd Backend/
```

2. 執行初始化 script  
Linux:
```bash
bash ./setup.sh
```

macOS:
```bash
bash ./setup_macos.sh
```

Windows:
```ps1
powershell -File ./setup.ps1
```

### 雙語資料更新（中英切換用）

**新架構說明**: Calendar events 與 Announcements 現已由後端 API 提供，前端按需動態獲取。快捷連結仍使用靜態 JSON 檔案。

#### 後端伺服器啟動
開發時需要啟動 Django 後端伺服器：
```bash
cd Backend/
source .venv/bin/activate
python manage.py runserver 8000
```

#### 資料同步命令

建議改用統一腳本（在專案根目錄執行）：

```bash
chmod +x Backend/sync_data.sh

# 全部同步（公告 + 行事曆 + links）
./Backend/sync_data.sh all

# 只同步公告（zh + en）
./Backend/sync_data.sh announcements

# 只同步行事曆（zh + en）
./Backend/sync_data.sh calendar

# 只處理 links（先產生 links.en.json，再匯入 DB）
./Backend/sync_data.sh links

# 可選：限制公告爬取頁數（測試時好用）
SYNC_MAX_PAGES=3 ./Backend/sync_data.sh announcements

# 可選：強制指定 Python（例如 conda/venv）
PYTHON_BIN=/Users/yourname/miniforge3/envs/114Web/bin/python ./Backend/sync_data.sh all
```

`sync_data.sh` 目前行為：

- 會自動選擇可用的 Python（優先順序：`PYTHON_BIN` > `Backend/.venv` > 目前啟用的 conda > 常見 miniforge/anaconda env > `python/python3`）。
- 會先執行 `manage.py migrate --noinput`，避免缺 table（例如 `events_announcement`）導致同步失敗。
- 執行 `links` 流程時，會先檢查 `Frontend/public/links.en.json` 是否所有連結都有 `label_en`；若有缺漏會直接中止，避免不完整資料被匯入 DB。

若要手動逐條執行，請在 `Backend` 目錄下使用：

```bash
source .venv/bin/activate

# 同步英文公告到 SQLite
python manage.py sync_announcements --lang en

# 同步中文公告到 SQLite
python manage.py sync_announcements --lang zh

# 建立 links （含向量）到 SQLite
python manage.py import_links

# 產生英文快捷連結（輸出到 Frontend/public/links.en.json）
python scripts/links_en_builder.py

# 同步英文行事曆到資料庫（從 acaEN xls/xlsx 解析）
python scripts/calendar_en_builder.py

# 同步中文版行事曆到資料庫（從 OWA 下載）
python scripts/calendar_zh_builder.py
```

#### 公告定時同步（後端排程）

可使用 Django management command 在後端定時執行公告爬蟲：

```bash
cd Backend/
source .venv/bin/activate

# 每 60 分鐘同步一次（zh + en）
python manage.py run_announcement_scheduler --interval-minutes 60

# 只執行一次（測試用）
python manage.py run_announcement_scheduler --once
```

Windows 可搭配工作排程器（Task Scheduler）定時啟動一次性同步：

```ps1
powershell -NoProfile -Command "Set-Location 'D:\NTU\Web\114-2_WebAPP_Team06\Backend'; .\.venv\Scripts\python.exe manage.py run_announcement_scheduler --once"
```

#### API 端點
前端在以下地址調用 API：

- **Calendar URL**: `http://localhost:8000/api/calendar/`
- **Calendar 查詢參數**:
  - `lang`: 語言代碼 ('zh' 或 'en') - **必填**
  - `start_date`: 開始日期 (YYYY-MM-DD 格式) - 可選
  - `end_date`: 結束日期 (YYYY-MM-DD 格式) - 可選

- **Announcements URL**: `http://localhost:8000/api/announcements/`
- **Announcements 查詢參數**:
  - `lang`: 語言代碼 ('zh' 或 'en') - 可選，預設 `zh`
  - `category`: 公告分類精準比對（可選）
  - `page`: 頁碼（可選，預設 1）
  - `page_size`: 每頁筆數（可選，預設 10，最大 100）

**範例**:
```bash
# 獲取所有中文行事曆事件
curl "http://localhost:8000/api/calendar/?lang=zh"

# 獲取特定日期範圍的英文事件
curl "http://localhost:8000/api/calendar/?lang=en&start_date=2025-03-28&end_date=2025-04-30"

# 獲取英文公告
curl "http://localhost:8000/api/announcements/?lang=en"

# 獲取中文「活動」公告第 2 頁，每頁 10 筆
curl "http://localhost:8000/api/announcements/?lang=zh&category=活動&page=2&page_size=10"
```

---

## Report 文件生成

在 `HW_Report` 目錄下有 `generate.sh`，可以使用它來生成每週報告文件。請按照以下步驟操作：  
（恕無法在 Windows 系統執行）  

1. 進入 Report 目錄
```bash
cd HW_Report/
```

2. 執行生成
```bash
./generate.sh <week_number>
```


---
