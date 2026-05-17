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

## 組員分工

* 陳冠瑜： 25%
    * docker compose
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
    * 前端 + image
