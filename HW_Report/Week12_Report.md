# Week 12

## 目標

建立 docker 
* build 前端用 Nginx -> image
* 完成後端 Search -> 全部採用 Hono
* 改 README
* 製作後端 image ✅
* 撰寫完整 docker compose file
    * 需考量 redis image
> You would have two separate repositories on a registry (like Docker Hub, GitHub Container Registry, or GitLab):  
> your-username/my-app-backend (Bun + Hono server)  
> your-username/my-app-frontend (Nginx + static assets)

## 使用上課技術

* Docker
* Docker Compose

## 使用額外技術

* 呼叫LLM API

## 組員分工

* 陳冠瑜： 25%
    * 建立完整 `docker-compose.yml`，整合 `frontend`、`backend`、`redis` 三個服務。
    * 設定容器內部網路，讓後端以 `redis://redis:6379/0` 連線 Redis，前端 Nginx 以 `backend:8000` 代理 `/api`。
    * 處理環境變數與資料保存：使用 `env_file` 載入後端 `.env`，並掛載 SQLite 資料與 Redis volume。
    * 加入 Redis 與後端 healthcheck，讓服務依序啟動，降低前端代理到尚未 ready 後端的問題。
    * 補充 README 中 Docker Compose 的啟動、查看 log、API 測試與停止指令。
* 陳冠辰： 25%
    * 修改 `embed.ts` 和 `fetch_myntu_links.ts` 以使用 OpenRouter API
        * 改為使用 `NVIDIA: Llama Nemotron Embed VL 1B V2 (free)` 免費模型
        * 更新爬蟲方式，使能正確抓到英文資料
    * 更新 `upsertLinks()` 以直接傳入有 embedding 的資料
    * 移除舊 Backend 並將 `Backend-hono` 重新命名為 Backend
    * 建立 root 的 `package.json` 方便一次安裝前後端
    * 更新 README 開發指南，使之符合現狀
* 王凱弘： 25%
  * 建立 Backend-hono Dockerfile
    - 採用 Bun 1.3.6 官方 image 為 base
    - 安裝依賴使用 `--frozen-lockfile` 確保版本穩定
    - 設定 PORT=8000 預設啟動埠
    - 啟動指令：`bun run src/index.ts`
  * 建立 .dockerignore
    - 排除 node_modules、db.sqlite3、環境檔等不必要的檔案
    - 減小 image size
  * 驗證 Docker image 建置與執行
    - `docker build` 成功完成
    - `docker run` 容器啟動正常，根端點 `/` 回傳 API 路由清單
    - Redis 連線失敗已符合預期（有 fallback 不會掛掉）
  * 更新 README
    - 補充 Docker build/run 指令
    - 說明所有支援的環境變數及其預設值
    - 提供含 Redis 及 email 設定的完整範例命令
* 孫怡臻： 25%
    * 將前端以 Nginx 提供的 production image 建置完成，並確保在 Docker Compose 環境下能正確代理 `/api` 給後端。
      * 修改:
        - `Frontend/Dockerfile`：multi-stage build（Node build -> Nginx serve）。
        - `Frontend/nginx.conf`：加入 SPA fallback（`try_files $uri /index.html`）與 `/api` 反向代理到 `backend:8000`（在 Compose network 中使用）。
        - `Frontend/.dockerignore`：排除 `node_modules`、`db.sqlite3`、環境檔等以減小映像。
        - 調整前端程式：將硬編碼的後端 URL 改為使用 `import.meta.env.VITE_API_BASE`（或相對路徑 `/api`），範例在 `src/SideBar.jsx`。
  * 修正前端資源載入與 API 路徑設定（Vite build 與 Nginx 代理協同工作）。
  * 針對 SPA 路由，設定 Nginx 做 fallback，避免直接輸入子路徑發生 404。
