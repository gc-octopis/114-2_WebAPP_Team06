# Week 4

## 目標


## 使用上課技術


## 使用額外技術


## 組員分工
* 陳冠瑜： 25%
    * 重新設計 index.html 骨架佈局，確立 topbar、sidebar 與 content 的層級關係
    * 優化 sidebar 收合互動，並加入與主頁獨立的專屬捲軸
    * 調整暗色佈景 (Dark Theme) 配色，提升視覺和諧度
    * 建立共用模板架構，並將新設計無縫套用至 about.html 與 calendar.html
    * 重構 CSS 檔案架構，拆分出 calendar.css 與 about.css 以利後續維護
    * 從網頁中拆分出 announcements.js 與 announcemen.css 以利後續維護
    * 爬取 myNTU 平台常用連結資料與真實 App 圖示，構建結構化 links.json
    * 實作動態分類側邊欄導覽系統，支援圖片圖示與跨頁面 URL 參數聯動
* 陳冠辰： 25%
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