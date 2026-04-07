# Week 6

## 目標

* 在 About 頁面實作聯絡我們表單，讓使用者可提交意見
* 訊息存入後端資料庫，開發者透過 Django Admin 查看
* 完善留言板功能，新增匿名發文與歷史留言瀏覽
* 補齊英文翻譯並同步至資料庫
* 完善搜尋功能，使搜尋結果更符合預期

## 使用上課技術

* Django Model 定義與欄位設計（ContactMessage、FeedbackPost）
* Django Migration（makemigrations / migrate）
* Django URL Routing（新增 `/api/contact/` 端點）
* Django Form / POST 請求處理

## 使用額外技術

* Django REST Framework（APIView、Serializer、Response）
* Django Admin 自訂（ModelAdmin、list_display、search_fields、date_filter）
* React 表單（controlled components、useState、async fetch POST）
* i18n 雙語支援（zh-TW / en）

## 組員分工

* 陳冠瑜： 25% About/聯絡我們
  * 新增 ContactMessage Model 並整合至 Django Admin 供開發者查看訊息
  * 新增 POST-only `/api/contact/` 端點接收表單資料
  * 將 About 頁聯絡我們區塊的靜態連結改為可互動的聯絡表單
  * 新增中英雙語 i18n 字串與表單 CSS 樣式

* 陳冠辰： 25% fix 搜尋
  * 使搜尋結果可以直接當超連結點擊
  * 優化搜尋結果
    * 加入 `keywords` 欄位使搜尋更有依據
    * 加入 Lexical Search 直接尋找詞彙
    * 合併兩搜尋途徑並根據分數排序結果

* 王凱弘： 25% 完善英文
  * 補齊英文翻譯
  * 將英文翻譯同步至資料庫
  
* 孫怡臻： 25% 意見交流的留言板
  * 新增意見交流頁面的留言板，取代原來的公告清單
  * 增加匿名留言功能與查看歷史留言
  * 留言區 UI 調整
  * 設定後端儲存留言筆數上限(超過 40 則時刪除後端最舊留言)