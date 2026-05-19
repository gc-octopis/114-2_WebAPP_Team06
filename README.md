# MyNTU++

本組目標為設計一個介面更好看的 MyNTU，使其具備「美化、簡約、現代化」的特色，核心設計哲學將從現有的「公佈欄式條列（Directory）」轉變為「個人化儀表板（Personalized Dashboard）」。

---

## 進度

* [Week3](./HW_Report/Week03_Report.md)
* [Week4](./HW_Report/Week04_Report.md)
* [Week5](./HW_Report/Week05_Report.md)
* [Week6](./HW_Report/Week06_Report.md)
* [Week7](./HW_Report/Week07_Report.md)
* [Week11](./HW_Report/Week11_Report.md)
* [Week12](./HW_Report/Week12_Report.md)

---

## 安裝指南

### 使用 Docker Compose

本專案的 Docker 架構包含三個服務：

- `frontend`: React/Vite build 後由 Nginx 提供靜態檔案，並將 `/api/*` 反向代理到後端
- `backend`: Bun + Hono API server，使用 SQLite
- `redis`: 提供登入 session 與開發用使用者資料儲存

### 1. 準備環境變數

```bash
cp Backend/.env.example Backend/.env
```

若只測試首頁、公告、行事曆等基本功能，可先保留空值。若要測試寄信或搜尋功能，請填入 `.env` 中的 `EMAIL_HOST_USER`、`EMAIL_HOST_PASSWORD`、`ADMIN_EMAIL`、`OPENROUTER_API_KEY`。

### 2. 建置並啟動

```bash
docker compose up --build -d
```

若你的 Docker 只支援舊版指令，將上方命令改成：

```bash
docker-compose up --build -d
```

啟動後可開啟：

- 前端：<http://localhost:8080>
- 後端健康檢查：<http://localhost:8000>
- Redis：`localhost:6379`

### 3. 查看狀態與 log

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

### 4. API 測試

```bash
curl "http://localhost:8000/"
curl "http://localhost:8000/api/calendar/?lang=zh"
curl "http://localhost:8000/api/announcements/?lang=zh&page=1&page_size=5"
curl "http://localhost:8080/api/calendar/?lang=en"
```

最後一個指令會經過前端 Nginx 反向代理，可用來確認 compose 內部網路與 API proxy 正常。

### 5. 停止服務

```bash
docker compose down
```

若要連 Redis volume 一起清掉：

```bash
docker compose down -v
```

---

## 開發指南

### 1. 安裝 bun（若尚未安裝）  
Linux / MacOS: 
```bash
curl -fsSL https://bun.sh/install | bash
```
Windows:
```ps1
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 2. 下載 git repo

```bash
git clone https://github.com/gc-octopis/114-2_WebAPP_Team06.git && cd 114-2_WebAPP_Team06
```

### 3. 安裝套件
```bash
bun install
cp Backend/.env.example Backend/.env
bun run sync:all
```
* **請填入 `.env` 中的必填欄位** （詳見 [下方章節](#env-設定)）
* 如果其他開發者安裝了新套件，請在 `git pull` 後再次執行 `bun install`

### 4. 啟動開發伺服器
```bash
bun run dev
```
這個指令會一次啟動前、後端的開發伺服器

### API 端點
前端在以下地址呼叫 API：

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

### .env 設定

**重要：請勿直接將 EMAIL 帳號密碼以及 API KEY 存於程式中，務必存於環境變數中，以避免被公開於 GitHub**

若要使寄信功能正常運作，需在 `Backend/.env` 中新增三個環境變數：
```bash
# 這裡請輸入你的 NTU Webmail 帳號（不包含 @ntu.edu.tw）
# 請注意，不是 CSIE Mail
# 例如 b13999987
EMAIL_HOST_USER=

# 這裡請輸入能登入該信箱的密碼
EMAIL_HOST_PASSWORD=

# （選填）請輸入管理員收信信箱地址
# 不限 Mail Provider，需包含 @ 後面的域名。
# 可與寄件信箱相同
ADMIN_EMAIL=
```

若要使用搜尋功能，請連接 OpenRouter API 使用免費模型  
請先至 <https://openrouter.ai/keys> 註冊帳號並申請 API KEY
```bash
# 貼上複製好的 API KEY
OPENROUTER_API_KEY=
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
