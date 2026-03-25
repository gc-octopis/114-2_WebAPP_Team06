# MyNTU++

本組目標為設計一個介面更好看的 MyNTU，使其具備「美化、簡約、現代化」的特色，核心設計哲學將從現有的「公佈欄式條列（Directory）」轉變為「個人化儀表板（Personalized Dashboard）」。

---

## 進度

* [Week3](./HW_Report/Week03_Report.md)
* [Week4](./HW_Report/Week04_Report.md)
* [Week5](./HW_Report/Week05_Report.md)

---

## 開發指南

目前已經分出前後端，分別在 `Frontend` 和 `Backend` 目錄下。

### 前端初始設定

由於已經引入 React，因此不能「直接打開 html 檔」來預覽了。請按照以下步驟設定開發環境：

1. 安裝 bun  
Linux / MacOS: 
```bash
curl -fsSL https://bun.sh/install | bash
```
Windows:
```ps1
powershell -c "irm bun.sh/install.ps1 | iex"
```

2. 安裝套件
```bash
cd Frontend/
bun install
```
這個指令會自動安裝目前已安裝的套件。如果未來有人安裝新套件並推上來，請在同步（`pull`）後在自己的電腦再跑一次來取得新套件。

3. 啟動開發伺服器
```bash
bun run dev
```
這個指令會建立一個 localhost 的開發伺服器。請依照終端機提供的網址打開網頁。理論上每次儲存新進度時就會自動更新，不需要手動重新整理。

### 後端初始設定

**請確認系統已安裝 Python**

1. 進入後端目錄
```bash
cd Backend/
```

2. 執行初始化 script  
Linux / MacOS:
```bash
bash ./setup.sh
```

Windows:
```ps1
powershell -File ./setup.ps1
```

---

## Report 文件生成

在 `HW_Report` 目錄下有 `generate.sh`，可以使用它來生成每週報告文件。請按照以下步驟操作：  
（恕無法在 Windows 系統執行）  

1. 進入 Report 目錄
```bash
cd HW_Report/
```

2. 執行生成
```bash
./generate.sh <week_number>
```


---
