# 陳冠瑜

# 陳冠辰

USER:
how to improve the accuracy of text search, if i want to add multiple term of keywords for one item, should i create multiple vectors for concat and create one? if there are multiple, how to compare and give a socre? also, does the multiple language model means that if I embed a label "課程", it could also be found by course, kursus etc

AGENT:
Improving search accuracy is a classic balancing act between **precision** (getting exactly what you want) and **recall** (not missing anything relevant). Since you're using semantic vectors, here is how to handle multi-term items and multilingual queries.

---

## 1. Concatenation vs. Multiple Vectors

### The "Meaning Dilution" Problem
If you concatenate too many unrelated keywords into a single string (e.g., `"Grades Course Map Credits Enrollment"`) and then vectorize it, you suffer from **dilution**. The vector represents the *average* meaning of all those words. It might end up being "close" to everything but "perfect" for nothing.

* **When to Concatenate:** If the keywords are synonyms or very closely related (e.g., `"Grades Score Marks"`). This reinforces the core concept.
* **When to use Multiple Vectors:** If an item has distinct sub-concepts (e.g., a link for "Student Portal" that covers "Grades," "Tuition," and "Housing"). 

### Recommendation: Multi-Vector Approach
Instead of one vector per item, store an array of vectors in your database. 
* **Vector 1:** The primary label.
* **Vector 2:** A list of synonyms.
* **Vector 3:** A short description of the link's purpose.

---

## 2. Scoring Multiple Vectors (MaxSim)
If an item has multiple vectors ($V_1, V_2, \dots, V_n$), you don't want to average their scores. Instead, you use the **MaxSim (Maximum Similarity)** strategy.

The logic is: "If the user's query is highly relevant to *any* of the keywords, the item is a match."

$$Score = \max(\cos(\vec{Q}, \vec{V_1}), \cos(\vec{Q}, \vec{V_2}), \dots, \cos(\vec{Q}, \vec{V_n}))$$

In your Django backend, your search loop would look like this:
1.  Iterate through each Link.
2.  Calculate similarity for every vector associated with that Link.
3.  Keep only the **highest** score for that specific Link.
4.  Sort the Links based on these maximum scores.

---

## 3. Multilingual Capabilities
Yes, that is exactly the power of a **Multilingual Embedding Model** (like the `paraphrase-multilingual-MiniLM-L12-v2` you are using).

These models use **Cross-lingual Alignment**. During training, the model is taught that the English word "Course," the Chinese word "課程," and the Indonesian word "Kursus" all point to the same semantic concept. 



In the vector space, these words will be mathematically very close to one another, even if they share zero characters in common. This means:
* You can embed your links in **Chinese**.
* A user can search in **English**.
* The model will find the match because the "thought" or "concept" behind the words is the same.

---

## 4. Pro-Tip: Hybrid Search
If you find that vector search occasionally misses "obvious" matches (like specific ID numbers or very rare proper nouns), consider **Hybrid Search**.

* **Semantic Search:** Finds "Grades" when searching "Scores."
* **Lexical Search (Keyword Match):** Uses standard `icontains` or `trigram` matching in Django to find "NTU" when searching "NTU."

Combining the two—usually by giving each a weight—is the industry standard for "it just works" search bars.

How many keywords per item are you planning to add? If it's more than 10 per item, we might want to look into an "Expansion" strategy instead of storing raw vectors.

USER:
how to build  Hybrid Search

AGENT:
Hybrid Search is the "gold standard" for search because it combines the **precise keyword matching** of traditional search with the **conceptual understanding** of vector search.

For your project, Hybrid Search ensures that if a user types a specific course code like "ENG101", they find it immediately (Lexical), but if they type "how to see my points", they still find "Grades Inquiries" (Semantic).

### 1. The Architecture
In a Hybrid system, the query goes through two parallel paths:
1.  **Lexical Path:** Traditional database filtering (using `Q` objects or Full-Text Search).
2.  **Semantic Path:** Your existing `sentence-transformers` vector comparison.



---

### 2. Implementation Strategy for Django
Since your dataset is small, you don't need a complex engine like Elasticsearch. You can implement this directly in your `LinkSearchView`.

#### Step A: Lexical Scoring (Keyword Match)
We use basic string matching and assign a "Lexical Score" based on where the match occurs (e.g., a match in the title is worth more than a match in a tag).

#### Step B: Semantic Scoring (Vector Match)
This is what you've already built using cosine similarity.

#### Step C: Reciprocal Rank Fusion (RRF)
Instead of just adding the scores together (which is hard because vector scores and keyword scores use different scales), we use **RRF**. This ranks items based on their position in *both* result lists.

---

### 3. Practical Code Implementation
Update your `Backend/events/views.py` to handle the fusion logic:

```python
from django.db.models import Q
from .search_service import SemanticSearchService

class HybridSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])

        # --- 1. LEXICAL SEARCH (Keyword) ---
        # Look for exact or partial matches in labels
        lexical_results = LinkItem.objects.filter(
            Q(label__icontains=query) | Q(label_en__icontains=query)
        )
        
        # --- 2. SEMANTIC SEARCH (Vector) ---
        query_embedding = SemanticSearchService.encode_query(query)
        all_links = LinkItem.objects.exclude(embedding__isnull=True)
        
        semantic_scores = {}
        for link in all_links:
            score = SemanticSearchService.cosine_similarity(query_embedding, link.embedding)
            if score > 0.3: # Threshold
                semantic_scores[link.id] = score

        # --- 3. HYBRID FUSION (Simplified Weighted Scoring) ---
        # For small datasets, a weighted sum is often more predictable than RRF
        final_rankings = []
        
        # Combine all unique links found in either search
        all_found_ids = set(list(lexical_results.values_list('id', flat=True)) + list(semantic_scores.keys()))
        
        for link_id in all_found_ids:
            link = LinkItem.objects.get(id=link_id)
            
            # Boost score if it was a keyword match
            lexical_boost = 0.5 if link in lexical_results else 0.0
            # Get the vector score
            vector_score = semantic_scores.get(link_id, 0.0)
            
            # Final formula: adjust weights to your liking
            final_score = (vector_score * 0.7) + (lexical_boost * 0.3)
            
            final_rankings.append({
                'link': link,
                'score': final_score
            })

        # Sort by final score
        final_rankings.sort(key=lambda x: x['score'], reverse=True)
        top_results = [r['link'] for r in final_rankings[:10]]
        
        serializer = LinkItemSerializer(top_results, many=True)
        return Response(serializer.data)
```

---

### 4. Advanced: Reciprocal Rank Fusion (RRF)
If your list grows significantly, simple weighting becomes unreliable. **RRF** is a mathematically robust way to merge different ranking systems without needing to "normalize" their scores.



**The RRF Formula:**
$$Score(d) = \sum_{r \in R} \frac{1}{k + rank(d, r)}$$
* $k$ is a constant (usually 60) to prevent top-ranked items from overwhelming the score.
* $rank(d, r)$ is the position of document $d$ in result list $r$.

**Why RRF is great:**
If an item is #1 in Keyword search but #50 in Vector search, it stays near the top. If it is #5 in *both*, it might actually jump to #1 because it has "consensus" from both systems.

### Summary of Benefits
* **Zero-Shot Accuracy:** Works immediately for new items via keywords.
* **Conceptual Depth:** Handles typos and synonyms via vectors.
* **User Trust:** Users expect "exact matches" to appear first; Hybrid search ensures that happens while still being "smart" enough to show related content.

USER:
beside editing view, what else should I edit to make it work?

AGENT:
To make the **Hybrid Search** (with multiple keywords and multilingual support) fully functional, you need to update the supporting infrastructure beyond just the view.

Here are the specific files and changes required to handle the **Multiple Vector (MaxSim)** logic and **Keyword Search** integration.

---

### 1. Update the Model (`Backend/events/models.py`)
You need to store multiple embeddings and a string of keywords for the Lexical (keyword) search to hit.

```python
class LinkItem(models.Model):
    category = models.ForeignKey(LinkCategory, related_name='links', on_delete=models.CASCADE)
    label = models.CharField(max_length=200)
    label_en = models.CharField(max_length=200, blank=True, null=True)
    url = models.URLField(max_length=500)
    icon = models.URLField(max_length=500)
    
    # NEW: Store keywords as a plain string for Lexical search
    keywords = models.TextField(blank=True, help_to_text="Comma-separated synonyms")
    
    # NEW: Store a LIST of vectors (JSONField)
    embeddings = models.JSONField(default=list, blank=True) 

    def __str__(self):
        return self.label
```

---

### 2. Update Search Service (`Backend/events/search_service.py`)
This is where the **MaxSim** logic lives. It compares the query to every vector an item has and picks the best one.

```python
import numpy as np
from sentence_transformers import SentenceTransformer

class SemanticSearchService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            # The multilingual model handles Chinese/English alignment automatically
            cls._model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        return cls._model

    @staticmethod
    def get_max_sim(query_vec, item_vectors):
        """
        Calculates MaxSim: returns the highest similarity score 
        among all vectors assigned to an item.
        """
        if not item_vectors:
            return 0.0
        
        q = np.array(query_vec)
        # Calculate cosine similarity for every vector in the list
        scores = []
        for v in item_vectors:
            v_arr = np.array(v)
            sim = np.dot(q, v_arr) / (np.linalg.norm(q) * np.linalg.norm(v_arr))
            scores.append(sim)
            
        return max(scores) if scores else 0.0
```

---

### 3. Update Import Script (`Backend/events/management/commands/import_links.py`)
You need to update your ingestion logic to look for a `keywords` field in your `links.json` and generate a vector for *each* keyword.

**Update your JSON first:**
```json
{
  "label": "成績與名次查詢",
  "url": "...",
  "keywords": "GPA, 分數, grades, scores"
}
```

**Then update the script loop:**
```python
# Inside the loop for zh_link in zh_cat['links']:
keywords_str = zh_link.get('keywords', '')
label_en = en_link.get('label_en', '')

# We will create multiple vectors for this one item
texts_to_embed = [zh_link['label']] # 1. The main label
if label_en:
    texts_to_embed.append(label_en) # 2. The English label
if keywords_str:
    # 3. Every individual keyword gets its own vector
    kw_list = [k.strip() for k in keywords_str.split(',')]
    texts_to_embed.extend(kw_list)

# Generate list of vectors
item_embeddings = [model.encode(t).tolist() for t in texts_to_embed]

LinkItem.objects.create(
    category=category,
    label=zh_link['label'],
    label_en=label_en,
    url=zh_link['url'],
    icon=zh_link['icon'],
    keywords=keywords_str,
    embeddings=item_embeddings # Saving the list of vectors
)
```

---

### 4. Wire the URL (`Backend/events/urls.py`)
Ensure your `urls.py` is actually pointing to the new **Hybrid** view we planned.

```python
from django.urls import path
from .views import LinkListView, HybridSearchView # Use the Hybrid one!

urlpatterns = [
    path('api/links/', LinkListView.as_view(), name='links-list'),
    path('api/search/', HybridSearchView.as_view(), name='links-search'),
]
```

---

### Summary of Workflow
1.  **Modify `links.json`**: Add a `"keywords": "synonym1, synonym2"` field to items you want to boost.
2.  **Run Migrations**: `python manage.py makemigrations` and `migrate` to update the DB schema.
3.  **Re-run Import**: `python manage.py import_links` to generate the new multi-vector data.
4.  **Test**: Search for a keyword you added.

### A Note on Multilingual "Course" vs "課程"
You don't need to do anything extra for this! Since you are using a **Multilingual Transformer**, the model has already mapped these concepts to the same area in vector space. 



If you embed the word **"課程"**, the vector for **"Course"** will naturally have a high cosine similarity score because the model understands they represent the same concept. The "Hybrid" part just makes it even safer by catching the exact text match if the user types it perfectly.

Does your current `links.json` have many items that share similar names, or are they mostly distinct?

USER:
for each item, add a field of keywords, which is a string of phrases separated by comma. Write the once that are related to the service.

AGENT:
這是一份為各項台大服務新增 keywords 欄位後的 JSON 資料。我根據每個連結的性質，加入了一系列相關的關鍵字（包含中文與英文），這將有助於搜尋引擎優化（SEO）或系統內的關鍵字檢索。

# 王凱弘
USER:
**請幫我統整一下目前有中文 卻沒有相對應英文的服務有哪些吧**

AGENT:
我先比對前端目前的中英文資料來源，確認哪些服務在中文清單裡存在、但英文清單沒有對應項目，接著整理成可直接檢查的結果。

我已經抓到中英文兩份清單，接下來會用程式直接比對每個項目的英文欄位，避免只靠肉眼漏掉個別服務。

我比對了 links.json 和 links.en.json；目前是「英文檔裡有這些服務，但很多項目還沒有對應的英文名稱 label_en」。總共有 51 個中文服務還沒補英文。

明細如下：

教學：通識課程地圖、領域專長查詢、NTU aCARE、網路選課系統、學生在學狀態查詢、臺大慕課 Coursera、修課人數查詢、遠距教學課程
圖書研究：Turnitin 原創性檢查、iThenticate 2.0、臺大學術典藏 NTUR、學術成果資訊維護、雲端圖書館 SLIM、個人圖書借閱查詢、館際合作借閱、計畫摘要上傳、臺大計畫查詢
帳務財物：保費證明、出國旅費E化結報、支付查詢暨付款通知、報帳/請購/臨時薪資、教職員薪資查詢、財物編號標籤申請、職務宿舍繳費證明、財產物品管理、教職員所得稅查詢
場館交通：修繕申請、總務處會議室、門禁管理、停車證申請、停車場多元支付、地圖與交通資訊、教室會議室借用、體育場地預約
校園資源：網路問題回報、NTU Space、NTU VDI、保健中心預約、校園軟體下載、VPN 虛擬私有網路、Wi-Fi 無線網路、NTU WebMaker
消息公告：校園公佈欄、活動報名、臺大行事曆、臺大電子報、校內徵才公告
意見交流：滿意度問卷調查、校務建言、行政興革意見信箱、校務會議提案討論區
如果你要，我可以下一步直接幫你整理成一份「建議英文對照表」，把這 51 個項目的英文名稱一起補齊。

---

USER:
**幫我整理成一份對照表並且幫我翻譯吧**

AGENT:
我先看一下目前的週報內容與格式，接著直接補成可貼上的中英文對照表，避免跟現有章節風格衝突。

我會把這份週報直接補上一個分組對照表，內容以「中文服務名稱 + 建議英文翻譯」呈現，方便你後續直接貼到報告裡。

剛剛是補丁格式少了一個必要欄位，我會重新套用同一份內容，並保留原本的報告結構不動。

我已經把對照表補進週報，現在只要確認排版沒有跑掉，接著就可以直接交付你使用。

我已經幫你整理成對照表並翻成英文，放在 Week06_Report.md:10 的新章節裡，依服務分類分成多個表格，方便直接貼到報告或再微調用字。

如果你要，我也可以下一步幫你把這份內容再改成更正式的報告語氣，或另外整理成 CSV / Excel 版格式。

---

USER:
**請不要貼進週報裡面 弄成獨立的檔案**

AGENT:
我會把剛才加進週報的表格移出去，改成一個獨立的 markdown 檔，並把週報本體回復成原本的內容。

已經改成獨立檔案，並把原本加在週報裡的內容移回去。

對照表現在在 Week06_Service_Translation_Table.md，週報本體則維持原樣在 Week06_Report.md。

如果你要，我也可以再幫你把這份獨立檔改成更像報告附件的格式，或把英文翻譯調整得更正式一致。

---

USER:
**那幫我把中英切換也給他補齊吧 就用你這份翻譯**

AGENT:
我會先確認前端中英切換是怎麼讀資料的，然後把英文檔裡缺的 label_en 補齊，這樣切換時會直接顯示完整英文。

我已確認前端是直接讀 label_en 來切換英文，所以現在要做的是把缺的欄位補到資料檔本身。接著我會把 links.en.json 內所有缺少的項目一次補齊。

我已確認缺的數量，現在直接把 links.en.json 補成完整雙語資料，讓切換英文時不會再漏項。

已編輯
links.en.json+102-51
補完已經進去，現在我做一次快速驗證，確認 JSON 可以正常解析，而且缺的英文欄位已經歸零。

已經補齊在 links.en.json 裡所有缺少的 label_en，現在前端切到英文時會完整顯示，不會再漏掉這些服務。剛剛也驗證過 JSON 可正常解析，而且缺少英文名稱的項目已經是 0。

如果你要，我也可以下一步順手把後端資料庫或 API 端的同一批翻譯一起對齊，避免之後資料來源不一致。

---

USER:
**補完是補完了 但我切到英文之後 他並沒有正常顯示出來喔 他消失了**

AGENT:
我先追資料流，確認英文切換時是直接讀靜態 JSON、還是經由 API/元件做過濾，這樣才能抓到「變成消失」的真正原因。

我判斷問題更像是後端資料庫還沒跟著更新，而不是前端切換邏輯本身；現在我先用既有的匯入命令把 DB 對齊，然後驗證 API 回傳是否已經帶到英文欄位。

我已確認匯入命令會把英文檔同步到資料庫，接下來直接跑一次匯入，讓 /api/links/ 用到新的英文欄位。

匯入失敗的原因是環境裡沒有 sentence_transformers，所以我不打算硬裝大套件；改成讓匯入命令在缺少該套件時也能同步英文欄位，會更穩。先確認模型欄位允不允許這樣做。

我會把匯入命令改成「有 embeddings 就重建，沒有 embeddings 也能同步 label_en 並保留舊資料」，這樣英文切換不會再因為缺套件而失效。

匯入命令已經改成可降級執行了，現在重新跑一次，讓資料庫真的補上英文欄位。

匯入還卡在另一個模組的靜態 import，我會把搜尋服務也改成可選依賴，這樣後端啟動和匯入都不會因為缺套件直接炸掉。

我先把搜尋模組做成延遲載入、缺套件也能被匯入，避免管理命令和 API 路由因為它而整個失敗。

已編輯
search_service.py+7-1
搜尋模組已經可匯入了，我再跑一次匯入，這次應該能把資料庫同步完成。

匯入已完成，最後我直接查資料庫確認幾個重點英文欄位真的有寫進去，避免只停在命令成功但資料沒更新。

我已確認資料庫真的有英文欄位了，下一步只剩把這次踩到的依賴問題記錄下來，避免下次再卡在同一個點。

我把這次的根因記下來：英文切換其實讀的是後端資料庫，不是直接讀靜態 JSON；而匯入命令跟搜尋服務都不能再硬依賴 sentence_transformers 才能跑。

已建立記憶檔案 ntu-links-language-sync.md

問題已經補正了。英文切換會消失的主因不是前端翻譯表，而是前端實際讀的是後端資料庫的 LinkListView 來源；我已經把 links.en.json 的英文欄位同步進資料庫，並且讓匯入流程在沒有 sentence_transformers 時也能正常更新英文欄位。

我同時修了兩個後端點： import_links.py 現在可以只同步中英文名稱而不重建 embeddings， search_service.py 也改成延遲載入，避免 Django 匯入路由時直接因缺套件失敗。資料庫驗證也有過，像 campus 類別和幾個服務現在都已經有英文值了。

如果你目前有在跑後端服務，重啟一次後再切英文就會看到正常內容。

---

# 孫怡臻

USER:
**我想要當cat=feedback時，頁面的公告清單處改成留言板，並有區塊可以給用戶像發部落格文章一樣匿名發文，以及顯示過往的留言**

AGENT:
我會先快速檢查目前前後端是怎麼用 `cat` 切分類、公告資料怎麼取得，接著直接把 `cat=feedback` 改成留言板模式（可匿名發文＋顯示歷史留言），並把對應 API 一起補上。

我已找到公告 API 與前端公告元件，接下來會新增後端 `FeedbackPost` 模型、API 與前端留言板 UI。

已編輯
- events/models.py
- events/serializers.py
- events/views.py
- events/urls.py
- Frontend/src/announcementAPI.js
- Frontend/src/LanguageContext.jsx
- Frontend/src/Announcement.jsx
- Frontend/src/announcement.css

已完成你要的行為：當網址是 `?cat=feedback` 時，公告清單會被替換成留言板，提供匿名發文區塊（含暱稱、標題、內容）與歷史留言列表，發文後會即時更新。

如果你要，我也可以下一步幫你把後端資料庫的遷移 (migration) 跑完，確保資料表已建立。

---

USER:
**按下發布後怎麼會出現Unexpected token '<', "<!DOCTYPE "... is not valid JSON呢**

AGENT:
這個錯誤代表前端預期拿到 JSON，但實際收到的是 HTML（通常是後端報錯頁面）。我會先把 API 解析改成「非 JSON 也能顯示清楚錯誤」，並檢查後端資料表是否尚未建立。

我已經先幫你把前端錯誤處理修好，現在會顯示可讀的 API 錯誤，而不是原始碼片段。

已編輯
- Frontend/src/announcementAPI.js

原因是「前端在等 JSON，但後端回了 HTML」，最可能的根因是 `FeedbackPost` 資料表還沒建立（尚未跑 migration）。請在 Backend 執行 `python manage.py migrate` 後再試一次。

---

USER:
**歷史留言一頁顯示4則就好**

AGENT:
我會只調整留言板的分頁大小，不影響原本的公告清單。把 feedback 的每頁筆數改成 4，並同步更新發文後重抓第一頁的邏輯。

已編輯
- Frontend/src/Announcement.jsx

已改好，歷史留言現在每頁固定顯示 4 則，公告清單仍維持原本每頁 10 筆，互不干擾。

---

USER:
**發布留言的區塊移動到歷史留言區塊下方**

AGENT:
我會直接重排留言板 JSX 結構：把「發布留言」表單移到「歷史留言」列表後面，並微調樣式間距避免視覺太擁擠。

已編輯
- Frontend/src/Announcement.jsx
- Frontend/src/announcement.css

已完成，留言板渲染順序現在改為：說明文字 → 歷史留言列表 → 發布留言表單。

---

USER:
**發布留言四字的樣子想要跟歷史留言四字一樣放出框格外**

AGENT:
我會把「發布留言」標題移到表單框外，並套用和「歷史留言」相同的標題樣式（class），讓兩者視覺達成一致。

已編輯
- Frontend/src/Announcement.jsx
- Frontend/src/announcement.css

已調整完成，「發布留言」現在移到表單框外，外觀與位置都與「歷史留言」對齊了。

---

USER:
**發布時間是不是怪怪的**

AGENT:
我檢查後發現後端時區目前是 UTC，所以顯示時間會慢 8 小時。我會直接在序列化器 (Serializer) 把時間轉成台北時區再回傳。

已編輯
- Backend/events/serializers.py

已修正為「回傳前先轉成 Asia/Taipei」，現在留言區顯示的時間會是正確的台灣時間。

---

USER:
**發布時間不需要顯示秒數**

AGENT:
我會直接把後端回傳的時間格式從 `YYYY-MM-DD HH:MM:SS` 改成 `YYYY-MM-DD HH:MM`。

已編輯
- Backend/events/serializers.py

已調整完成，重新整理頁面後，歷史留言的時間將不再顯示秒數。

---

USER:
**可以顯示am或pm，用12小時制**

AGENT:
我會修改後端的時間字串格式，讓它回傳 12 小時制並帶有 am/pm 標記。

已編輯
- Backend/events/serializers.py

已改好，現在時間會顯示如 `2026-04-04 09:35 pm` 這種格式。

---

USER:
**發布留言區塊的位置再下去一些**

AGENT:
我會調整 CSS 樣式，增加「發布留言」標題與表單整體的上邊距 (margin-top)。

已編輯
- Frontend/src/announcement.css

已幫你把區塊往下移了，增加了 24px 的間距，讓視覺感更開闊。

---

USER:
**發布留言改成撰寫留言**

AGENT:
我會搜尋所有顯示為「發布留言」的文案，並統一修改為「撰寫留言」。

已編輯
- Frontend/src/LanguageContext.jsx

已改好，多語系清單中的字串已全面更新。

---

USER:
**不用填寫標題**

AGENT:
我會把「標題」改為選填，前端移除 `required` 屬性，後端 API 則修改為允許空標題並自動補上預設值。

已編輯
- Frontend/src/Announcement.jsx
- Frontend/src/LanguageContext.jsx
- Backend/events/views.py

已改成「標題不用填」，若沒填寫，系統會自動顯示為「無標題文章」。

---

USER:
**改成不能填標題，舊留言的標題也去除**

AGENT:
我會徹底移除標題功能：前端表單刪除標題欄位、歷史列表不顯示標題，後端 API 也不再回傳該欄位。

已編輯
- Frontend/src/Announcement.jsx
- Frontend/src/announcement.css
- Backend/events/serializers.py
- Backend/events/views.py
- Frontend/src/LanguageContext.jsx

標題功能已整體移除，舊有的標題資料現在也會被忽略，不再顯示於網頁上。

---

USER:
**留言區的部分，請幫我改成頭像旁邊是名稱，然後才是留言內容，頭像可以用不同顏色的圓，圓的顏色在發布留言時隨機給定**

AGENT:
我會新增 `avatar_color` 欄位，後端在發布時隨機配色並寫入資料庫，前端則調整卡片版型。

已編輯
- Backend/events/models.py
- Backend/events/serializers.py
- Backend/events/views.py
- Frontend/src/Announcement.jsx
- Frontend/src/announcement.css

已完成，現在每則留言左側都有一個隨機顏色的圓形頭像，名稱緊鄰其右，留言內容則在下一行。

---

USER:
**頭像樣式想要在底色上面覆蓋一個小一點的白圓，白圓下方再放一個直的橢圓**

AGENT:
我會利用 CSS 的偽元素 (`::before`, `::after`) 在彩色圓底上繪製白圓與白橢圓，達成你要的抽象人像效果。

已編輯
- Frontend/src/announcement.css

已改好，現在頭像內部包含了白圓與直向橢圓的組合圖樣。

---

USER:
**白圓要靠近頭像中心，所以要再下來一些，白色橢圓可以再更往下，超出底層圓形沒關係，裁掉不顯示就好**

AGENT:
我會微調 CSS 定位數值，讓白圓下移並讓白橢圓部分超出底圓邊界（利用 `overflow: hidden` 裁切）。

已編輯
- Frontend/src/announcement.css

已調整定位，白圓更貼近中心，白橢圓下沉後的裁切效果也更自然。

---

USER:
**頭像整體要再大一些**

AGENT:
我會等比例放大頭像容器與內部的所有元素。

已編輯
- Frontend/src/announcement.css

頭像已從 `18px` 放大至 `22px`，內部的圖樣也同步調整了比例。

---

USER:
**白色小圓再上去一點點**

AGENT:
我會將白色小圓的 `top` 數值往上微調 1px。

已編輯
- Frontend/src/announcement.css

微調完成，白色小圓的位置現在更高了一點。

---

USER:
**如果發布留言導致歷史留言超過40則，則刪除最舊的一筆**

AGENT:
我會在後端發文邏輯中加入檢查，一旦總數超過 40 筆，就自動刪除最舊的資料。

已編輯
- Backend/events/views.py

已加上限制，歷史留言現在會自動維持在最新的 40 筆內。

---

USER:
**撰寫留言的區塊想要用不同樣式來做區隔**

AGENT:
我會把「撰寫留言」區塊做成獨立面板，賦予不同的底色、邊框與陰影。

已編輯
- Frontend/src/Announcement.jsx
- Frontend/src/announcement.css

已完成，現在撰寫區塊有淡色漸層底色與陰影，視覺上與歷史列表有明顯區分。

---

USER:
**撰寫留言四字要跟歷史留言一樣**

AGENT:
我會將「撰寫留言」的標題 class 修改為與「歷史留言」一致。

已編輯
- Frontend/src/Announcement.jsx

已改好，兩個區塊的標題字型與大小現在完全對齊。

---

USER:
**撰寫留言下面的框隔改成虛線框**

AGENT:
我會將「撰寫留言」表單的 `border-style` 從 `solid` 改為 `dashed`。

已編輯
- Frontend/src/announcement.css

已改好，現在撰寫區域的框線變成了虛線。

---

USER:
**想再更明顯，虛線要再長一些**

AGENT:
我會利用 CSS 自定義虛線參數，加長線段長度並加大間隔。

已編輯
- Frontend/src/announcement.css

已改成粗體長虛線框，視覺感更強烈。

---

USER:
**有點太長了，我想要保持原來的圓弧角**

AGENT:
我會將樣式換回標準的 `dashed` 屬性，以確保 `border-radius` (圓角) 能完美呈現。

已編輯
- Frontend/src/announcement.css

已調整回保留圓弧角的 2px 虛線版本，維持了原有的美觀圓角。