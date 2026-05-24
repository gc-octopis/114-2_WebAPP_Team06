# Week 13

## 目標

串接youbike api->顯示站點車數功能
串接北市公車api(BusEvent) ->篩出台大附近公車站

## 使用上課技術

* 呼叫他人API

## 使用額外技術

* Hono 後端代理與資料正規化：避免前端直接綁死外部 API 欄位
* 前端 React component：即時顯示 YouBike 可借車數、可還空位與站點搜尋
* Leaflet + OpenStreetMap：在真實互動地圖上顯示 YouBike 站點位置

## 組員分工

* 陳冠瑜： 25%
  * YouBike 資料整理
  * 說明:
    1. YouBike 2.0 臺北市公共自行車即時資訊
        * JSON 格式，提供臺北市各 YouBike 站點的即時車況
        * 主要使用欄位: `sno` 站點代號、`sna` 場站名稱、`sarea` 行政區、`ar` 地址、`latitude` / `longitude` 經緯度
        * 車位相關欄位: `available_rent_bikes` 可借車數、`available_return_bikes` 可還空位、`Quantity` 總停車格
        * 時間與狀態欄位: `mday` 站點資料更新時間、`act` 站點啟用狀態
        * 資料來源: [臺北市資料大平臺 YouBike2.0臺北市公共自行車即時資訊](https://data.taipei/dataset/detail?id=c6bc8aed-557d-41d5-bfb1-8da24f78f2fb)
        * API 介接網址: [youbike_immediate.json](https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json)
* 陳冠辰： 25%
  * 公車 API 實作
* 王凱弘： 25%
  * YouBike API 實作
    * 新增後端 `/api/youbike/`，串接臺北市 YouBike 2.0 即時資訊資料集
    * 後端將原始欄位整理成前端容易使用的 `name`、`area`、`availableBikes`、`availableReturns`、`updatedAt`
    * 加入 60 秒快取，降低每次刷新首頁時對外部 API 的重複請求
    * 支援 `q` 關鍵字搜尋、`area` 行政區篩選、`near=ntu` 台大附近站點排序與 `limit` 筆數限制
    * 首頁新增 YouBike 即時車況區塊，預設以 Leaflet 地圖顯示台大附近站點，並可搜尋站名、行政區或地址
    * 使用 OpenStreetMap 圖磚當作真實地圖底圖，依照 YouBike API 回傳的經緯度放置站點 marker
    * 地圖縮放或拖曳後，前端會用目前地圖視野範圍重新查詢後端，動態增減顯示的 YouBike 站點
    * 每個站點卡片顯示可借車數、可還空位、行政區、地址與距離資訊
* 孫怡臻： 25%
  * 臺大周邊公車站點與路線對應資料整理
    * [整理試算表](https://docs.google.com/spreadsheets/d/1GlQzAWw3_Mfvn2-YZoYO65qCEscIqpyWHeZSLnfPO40/edit?usp=sharing)
  * 說明:
    1. 臺大周邊站點與路線對應表
        * 共11個臺大周圍的公車站，每個車站有數個站牌，每站有多條路線會途經
        * stopId:站牌代碼
        * routeId:路線編號
        * 資料來源: [GetStop](https://tcgbusfs.blob.core.windows.net/blobbus/GetStop.gz)
    2. (補充)路線ID與路線中文名稱對應表
        * 資料來源: [GetRoute](https://tcgbusfs.blob.core.windows.net/blobbus/GetRoute.gz)
    3. [臺北市 Data.Taipei 平台 API 說明文件](https://www-ws.gov.taipei/Download.ashx?u=LzAwMS9VcGxvYWQvNDU4L3JlbGZpbGUvMjI1NDUvNjU1NDM2MC81ZGFhMGEzNy04ZGU3LTQ0NTUtODU2Yi1kZTE0YTNiOGEzMjcucGRm&n=6Ie65YyX5biCRGF0YS5UYWlwZWnlubPlj7BBUEnoqqrmmI7mlofku7ZfVjYuM18wOS0xNS0yMDI1LnBkZg%3d%3d&icon=..pdf)
