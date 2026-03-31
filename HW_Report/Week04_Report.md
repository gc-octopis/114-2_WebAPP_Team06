# Week 4

## 目標

* 由 JSON 讀取真正可用的連結
* 更新行事曆，使其可隨日期更新
* 顯示真實公告內容

## 使用上課技術

* 使用 JS 基本功能（含 變數、迴圈、function, Object）
* 使用 DOM 取得、生成、編輯元素 [^1]
* 使用 location 更新 URL
* 使用 Event
* 使用 Date, setTimeout [^1]
* 使用物件導向 [^1]

[^1]: 可能在使用 React 以後的 commit 看不到

## 使用額外技術

* 使用 fetch 取得檔案
* 使用 async, await
* 使用 Regular Expression
* 使用 Python 爬網頁資料
* 使用 Bun 管理 `node_modules`
* 使用 Vite 開發
* 使用 React 
* 使用 React Router 進行路由管理
* 使用 motion 動畫（與 CSS 並用）


## 組員分工

**請到歷史 commit 中檢視所有組員的貢獻以及本週程式的演進過程**

* 陳冠瑜： UI 佈局重構與連結資料建置 25%
    * 重新設計 index.html 骨架佈局，確立 topbar、sidebar 與 content 的層級關係
    * 優化 sidebar 收合互動，並加入與主頁獨立的專屬捲軸
    * 調整暗色佈景 (Dark Theme) 配色，提升視覺和諧度
    * 建立共用模板架構，並將新設計無縫套用至 about.html 與 calendar.html
    * 重構 CSS 檔案架構，拆分出 calendar.css 與 about.css 以利後續維護
    * 從網頁中拆分出 announcements.js 與 announcemen.css 以利後續維護
    * 爬取 myNTU 平台常用連結資料與真實 App 圖示，構建結構化 links.json
    * 實作動態分類側邊欄導覽系統，支援圖片圖示與跨頁面 URL 參數聯動
* 陳冠辰：轉換成使用 React Framework 25%
    * 新增 `.gitignore`
    * 採用 Bun 管理套件
    * 安裝並設定 React, React Router, Vite, Motion
    * 根據 React 設計邏輯將現有頁面重新拆分成多個 Component
    * 使用 React Router 將原本的三個 HTML 整合在一起
    * 更新 `README.md`
* 王凱弘：設計行事曆頁面 25%
    * 於台大教務處網站下載calendar.ics
    * 生成calendar.html
    * 生成calendar.js以解析ics檔案，並完成calender頁面的功能
    * 將calendar.html加入RWD
    * 修正calendar選取日期時，數字會消失的bug
* 孫怡臻：完善公告功能 25%
    * 爬取國立臺灣大學公告網頁資料
    * 將抓取資料存成 announcements.json
    * 修改 index.html 公告區，使其支援：
        * 類別篩選功能
        * 分頁顯示
        * 依類別顯示不同樣式標籤