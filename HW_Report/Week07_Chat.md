# 陳冠瑜

# 陳冠辰

# 王凱弘
USER:
**請幫我把後端會常常用到的那些資料同步的指令整理成shell script 並同步更新readme**

AGENT:
我會先快速盤點目前後端「資料同步」相關的既有指令與 README 現況，接著新增一支可重複使用的 shell script，最後把 README 的操作方式同步補上。先從讀取現有命令與文件開始。

我已確認 README 目前已有零散的同步指令。下一步我會讀取這些 command/script 的參數與行為，整理成一支統一入口的 shell script，避免大家每次手打多行命令。

我已確認目前常用同步流程主要有 6 個：中英公告、中英行事曆、英文 links json、links 匯入 DB。接下來我會做兩件事：

在 Backend 新增一支統一腳本（含子命令），支援一次全跑與分項執行。
更新 README，把原本多行手動指令改成「主推用腳本」，並保留對應的手動指令備查。
完成後我會再快速檢查腳本語法與可執行權限。
已編輯
sync_data.sh+110-1
我先把統一同步腳本加好了，接著會更新 README 的「資料同步命令」段落改成以這支腳本為主，並補上子命令說明。更新完我會順手把腳本設成可執行並做一次 help 驗證。

我再做一個小修正：移除未使用變數並補上檔案結尾換行，讓腳本更乾淨、lint 友善。

rg -n "建議改用統一腳本|資料同步命令" README.md
我這邊發現環境沒有 rg，所以改用 grep 取行號；另外剛剛一個搜尋字串被 shell 的歷史展開影響，我會用安全寫法重跑一次。

已完成，幫你把後端常用資料同步流程整理成一支 shell script，並同步更新 README。

新增統一同步腳本
sync_data.sh:1
支援這些子命令：

all：一次跑完公告 + 行事曆 + links
announcements：只跑中英文公告同步
calendar：只跑中英文行事曆同步
links：先產生英文 links json，再匯入 DB
另外支援環境變數：

SYNC_MAX_PAGES（可限制公告爬取頁數）
更新 README 使用方式
README.md:84
我把「資料同步命令」段落改成主推用腳本，並保留原本手動逐條執行方式作為備用。

驗證結果
腳本已設為可執行。
已驗證 help 可正常輸出。
兩個檔案都沒有檢查到錯誤。
你現在可以直接在專案根目錄跑：

sync_data.sh all
sync_data.sh announcements
sync_data.sh calendar
sync_data.sh links
如果你要，我也可以再幫你加一個 quick 模式（例如只跑公告且預設 SYNC_MAX_PAGES=1）給開發測試用。

--- 

# 孫怡臻
