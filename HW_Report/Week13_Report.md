# Week 13

## 目標

串接youbike api->顯示站點車數功能
串接北市公車api(BusEvent) ->篩出台大附近公車站

## 使用上課技術

* 呼叫他人API

## 使用額外技術

## 組員分工

* 陳冠瑜： 25%
  * YouBike 資料整理
* 陳冠辰： 25%
  * 公車 API 實作
* 王凱弘： 25%
  * YouBike API 實作
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