# Week 11

## 目標

本週目標將大部分後端架構改用 Hono 伺服器，簡化開發同步流程。（僅保留 LLM 部分使用 Python）。  
另加入「帳號」概念，將過去的各項功能與帳號連結。

## 使用上課技術

* Session / Cookie
* Account Registration

## 使用額外技術

* Hono

## 組員分工

* 陳冠瑜： 註冊/登入頁面 25%
    * 新增登入與註冊前端畫面，並接入 `/login` 路由與上方帳號選單入口。
    * 依照目前 MyNTU++ 的儀表板風格調整版面、色彩與字樣，讓畫面與首頁視覺一致。
    * 簡化表單欄位為信箱登入/註冊，並調整品牌區與版面細節。

* 陳冠辰： 25%
    * 後端改用 Hono
        * GET  /api/calendar/
        * GET  /api/announcements/
        * GET  /api/links/
        * GET  /api/preferences/
        * POST /api/preferences/
        * GET  /api/feedback/
        * POST /api/feedback/
        * POST /api/contact/
    * 尚未完成部分
        * Search API
        * 各項原始資料匯入資料庫的 script

* 王凱弘： 後端帳號資料庫 25%
    * 後端帳號資料庫與 Redis session 整合
        - 新增 `User` model（欄位：email、password、name、is_active、created_at、updated_at）及 `UserSerializer`。
        - 實作 session-based 的 `RegisterView`、`LoginView`、`LogoutView`、`CurrentUserView` API。
        - 使用 `make_password` / `check_password` 進行密碼雜湊與驗證；開發階段使用 `@csrf_exempt`（生產需移除）。
        - 新增路由：`POST /api/auth/register/`、`POST /api/auth/login/`、`POST /api/auth/logout/`、`GET /api/auth/me/`
        - 執行 makemigrations 並在本機套用 migration，`events_user` 表已建立於 SQLite。
    * 導入 Redis session 支援跨服務共用
        - 新增 `Backend/events/redis_sessions.py`（建立、查詢、刪除 session token）。
        - 後端改為使用 Redis 存 session，透過 HttpOnly cookie `myntupp_session` 傳遞。
        - 在 Hono 加入 `Backend-hono/src/routes/auth.ts` 示範路由，讀取同一個 Redis session。
        - 安裝 Python Redis 客戶端 `redis` 與 Node.js `ioredis`。
        - 啟動 Docker Redis 容器（`redis:7`）並驗證連線正常。
    * 完成 Django+Hono Redis session flow
        - 修正 Hono middleware 與 header 讀法（使用 `c.req.header(...)`）。
        - 將 Redis 儲存內容改為完整使用者 payload（不只 user_id），讓 Hono 直接回傳 name/email。
        - 移除 Django `request.session` fallback，全部切換到 Redis session。
        - 在 Hono 新增 `POST /api/auth/logout` 進行 session revoke（刪除 Redis key + 清除 cookie）。
        - 啟用 CORS `credentials: true`，使 cookie 正常在跨端點傳遞。
    * 前端與後端整合驗證完成
        - 前端 `AuthContext` / `TopBar` 已改為直接呼叫 `http://localhost:8002/api/auth/me`（Hono endpoint）。
        - TopBar 登出改呼叫 Hono `POST /api/auth/logout`。
        - 整體登入/登出流程與使用者狀態顯示已驗證正常。

* 孫怡臻： 將常用連結、搜尋紀錄、留言板 ID 與帳號連結 25%
    * 
