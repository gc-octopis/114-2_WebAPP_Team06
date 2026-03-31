# Week 5

## 目標

* 架設 Django 後端，建立前後端分離的開發架構
* 將公告、行事曆等資料改由後端抓取並儲存，前端透過 API 動態取得
* 實作我的最愛釘選功能，將使用者偏好儲存至後端

## 使用上課技術

* Django 專案建置與應用程式 (app) 結構
* Django Model 定義
* Django Migration（makemigrations / migrate）
* URL Routing

## 使用額外技術

* Django REST Framework（APIView、Serializer、Response）
* Python 爬蟲（requests / BeautifulSoup）抓取公告與行事曆資料
* Python 解析 ICS 檔案
* Python sentence transformers 向量化文字

## 組員分工

* 陳冠瑜： 釘選我的最愛 25%
    * 實作我的最愛釘選功能，可將主頁連結拖曳至右上角九宮格區域加入清單
    * 支援釘選清單內拖曳排序與移除，釘選資料儲存至後端，重新整理後仍保留
    * 拖曳時自動展開釘選選單，並顯示插入位置提示與重複釘選提醒
    * 後端新增使用者偏好設定 API，以裝置唯一識別碼追蹤匿名使用者，無需帳號即可保留個人釘選資料

* 陳冠辰： 25%
    * 設定 monorepo 配置
    * 新增 `generate.sh` 方便生成 Report
    * 合併中英文 `links.json` 並納入後端資料庫
    * 使用 sentence transformers 將 links 的資料向量化
    * 新增 `/api/links` 取代 `links.json` 和 `links.en.json`
    * 新增 `/api/search` 回傳透過 sentence transformers 搜尋到的結果
    * 新增前端搜尋結果顯示列表，並使之相容於拖曳釘選選單

* 王凱弘： 中英文版切換 25%
    * 製作英文版網站，並且能流暢在中英文之間切換
    * 將行事曆及About頁面換成英文版
    * 製作行事曆的中英文資料抓取python scripts
    * 製作公告的英文資料抓取python script
    * 將Calendar的資料從前端移到後端，需要時再從後端撈取資料到前端進行渲染
    * **官方版的myNTU並沒有完整的英文版資料，若官方那邊沒有，切換成英文頁面時就不會顯示該功能**

* 孫怡臻： 公告 25%
    * 將公告資料改為由後端SQLite提供，前端改成透過 API 動態取得
    * 實作公告分頁與分類篩選，讓前端可以按需要分次載入資料
    * 實作公告定時同步機制，支援每 60 分鐘自動更新與一次性手動同步
    * 修正英文公告python script抓取錯誤問題（連結與 category），並補齊前端分類badge對應樣式