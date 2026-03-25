# MyNTU++

本組目標為設計一個介面更好看的 MyNTU，使其具備「美化、簡約、現代化」的特色，核心設計哲學將從現有的「公佈欄式條列（Directory）」轉變為「個人化儀表板（Personalized Dashboard）」。

---

## 進度

* [Week3](./HW_Report/Week03_Report.md)
* [Week4](./HW_Report/Week04_Report.md)
* [Week5](./HW_Report/Week05_Report.md)

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
Linux / MacOS:
```bash
bash ./setup.sh
```

Windows:
```ps1
powershell -File ./setup.ps1
```

### 雙語資料更新（中英切換用）

**新架構說明**: Calendar events 現已存放在後端資料庫，前端通過 REST API 動態獲取。其他資料（公告、快捷連結）仍使用靜態 JSON 檔案。

#### 後端伺服器啟動
開發時需要啟動 Django 後端伺服器：
```bash
cd Backend/
source .venv/bin/activate
python manage.py runserver 8000
```

#### 資料同步命令

在 `Backend` 目錄下執行：

```bash
source .venv/bin/activate

# 產生英文公告（輸出到 Frontend/public/announcements.en.json）
python scripts/announcement_scraper.py --lang en

# 產生英文快捷連結（輸出到 Frontend/public/links.en.json）
python scripts/links_en_builder.py

# 同步英文行事曆到資料庫（從 acaEN xls/xlsx 解析）
python scripts/calendar_en_builder.py

# 同步中文版行事曆到資料庫（從 OWA 下載）
python scripts/calendar_zh_builder.py
```

中文公告同步：
```bash
python scripts/announcement_scraper.py --lang zh
```

#### API 端點
前端在以下地址調用 Calendar API：
- **URL**: `http://localhost:8000/api/calendar/`
- **查詢參數**:
  - `lang`: 語言代碼 ('zh' 或 'en') - **必填**
  - `start_date`: 開始日期 (YYYY-MM-DD 格式) - 可選
  - `end_date`: 結束日期 (YYYY-MM-DD 格式) - 可選

**範例**:
```bash
# 獲取所有中文行事曆事件
curl "http://localhost:8000/api/calendar/?lang=zh"

# 獲取特定日期範圍的英文事件
curl "http://localhost:8000/api/calendar/?lang=en&start_date=2025-03-28&end_date=2025-04-30"
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
