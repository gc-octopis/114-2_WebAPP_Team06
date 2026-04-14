# Week 7

## 目標

* 提升遠端協作的同步難度
* 補全網頁中的連結與 icon
* 新增留言回覆功能
* 新增電子郵件功能

## 使用上課技術
* Django ORM
* ForeignKey
* 發送 Mail

## 使用額外技術
* Shell Script
* Django tasks

## 組員分工

* 陳冠瑜： 補icon 25%
  * 改用官方 API 直接抓取 10 大分類的中英文連結與標題，確保資料來源同步與完整性。
  * 在爬取過程中導入圖片存活檢查（HTTP HEAD），自動將失效的網址導向預設圖示，解決前端破圖問題。
  * 重構 sync_data.sh 同步流程，移除過時的舊版腳本與冗餘的 JSON 檔案

* 陳冠辰： mail 25%
  * 增加在收到建議表單後，寄信給用戶以及管理員
    * 使用 dotenv 儲存發信 email 帳密以及管理員收信信箱
    * 使用 Django 內建 mail 發送功能寄信
      * 使用 SMTP 將信件透過 NTU Webmail 寄出
  * 增加 `sync_data.sh` 中的 `ensure_dependencies` 確保新增的 requirements 都有被安裝

* 王凱弘： 25%
  * 將資料同步的相關指令整合成一份Shell Script 
  * 修正重新sync data之後會導致英文翻譯缺失的問題

* 孫怡臻： 回覆留言 25%
  * 新增留言回覆功能
  * 完成回覆後即時刷新列表。
  * 調整回覆區互動方式與css。
