async function loadAnnouncements() {
    try {
        const res = await fetch("announcements.json"); // 你的 JSON
        const rawData = await res.json();
        const data = rawData.sort((a, b) => new Date(b.date) - new Date(a.date));
        const ITEMS_PER_PAGE = 10;
        let currentPage = 1;
        let filteredData = [...data];

        const container = document.getElementById("announcementList");

        // === 生成篩選下拉選單 ===
        const filterDiv = document.createElement("div");
        filterDiv.className = "announcement-toolbar";

        // 分類篩選
        const categorySelect = document.createElement("select");
        categorySelect.className = "announcement-select";
        categorySelect.innerHTML = `<option value="">全部類別</option>`;
        const categories = [...new Set(data.map(item => item.category))];
        categories.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            categorySelect.appendChild(opt);
        });

        filterDiv.appendChild(categorySelect);
        container.parentNode.insertBefore(filterDiv, container);

        // === 分頁控制列 ===
        const paginationDiv = document.createElement("div");
        paginationDiv.className = "announcement-pagination";

        const prevPageBtn = document.createElement("button");
        prevPageBtn.type = "button";
        prevPageBtn.className = "announcement-page-btn";
        prevPageBtn.textContent = "上一頁";

        const pageStatus = document.createElement("div");
        pageStatus.className = "announcement-page-status";

        const pageInput = document.createElement("input");
        pageInput.type = "text";
        pageInput.className = "announcement-page-input";
        pageInput.inputMode = "numeric";
        pageInput.pattern = "[0-9]*";
        pageInput.maxLength = 3;
        pageInput.value = "1";

        const pageTotal = document.createElement("span");
        pageTotal.className = "announcement-page-total";
        pageTotal.textContent = "/0";

        pageStatus.append(pageInput, pageTotal);

        const nextPageBtn = document.createElement("button");
        nextPageBtn.type = "button";
        nextPageBtn.className = "announcement-page-btn";
        nextPageBtn.textContent = "下一頁";

        paginationDiv.append(prevPageBtn, pageStatus, nextPageBtn);
        filterDiv.appendChild(paginationDiv);

        // === 顯示公告函數 ===
        function formatDate(dateString) {
            if (!dateString) return "日期未提供";
            return dateString.replaceAll("-", "/");
        }

        function getCategoryBadgeClass(category) {
            const categoryMap = {
                "緊急": "category-badge--urgent",
                "一般": "category-badge--general",
                "徵才": "category-badge--recruit",
                "標案": "category-badge--tender"
            };
            return categoryMap[category] || "category-badge--default";
        }

        function renderAnnouncements() {
            container.innerHTML = "";

            const totalItems = filteredData.length;
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            if (totalPages > 0 && currentPage > totalPages) {
                currentPage = totalPages;
            }
            if (totalPages === 0) {
                currentPage = 1;
            }

            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const pagedData = filteredData.slice(startIndex, endIndex);

            pageInput.value = String(totalPages === 0 ? 0 : currentPage);
            pageInput.disabled = totalPages === 0;
            pageTotal.textContent = `/${totalPages}`;
            prevPageBtn.disabled = totalPages === 0 || currentPage <= 1;
            nextPageBtn.disabled = totalPages === 0 || currentPage >= totalPages;

            if (!pagedData.length) {
                const emptyState = document.createElement("p");
                emptyState.className = "announcement-empty";
                emptyState.textContent = "找不到符合條件的公告";
                container.appendChild(emptyState);
                return;
            }

            pagedData.forEach(item => {
                const announcementItem = document.createElement("article");
                announcementItem.className = "announcement-item";

                const categoryBadge = document.createElement("span");
                categoryBadge.className = "category-badge";
                categoryBadge.classList.add(getCategoryBadgeClass(item.category));
                categoryBadge.textContent = item.category || "一般";

                const link = document.createElement("a");
                link.href = item.link;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.className = "announcement-link";
                link.textContent = item.title || "未命名公告";

                const timeText = document.createElement("time");
                timeText.className = "announcement-time";
                timeText.dateTime = item.date || "";
                timeText.textContent = formatDate(item.date);

                announcementItem.append(categoryBadge, link, timeText);
                container.appendChild(announcementItem);
            });
        }

        // 初始顯示
        renderAnnouncements();

        // === 監聽篩選變化 ===
        function updateDisplay() {
            filteredData = [...data];

            // 篩選類別
            const cat = categorySelect.value;
            if (cat) {
                filteredData = filteredData.filter(item => item.category === cat);
            }

            currentPage = 1;
            renderAnnouncements();
        }

        categorySelect.addEventListener("change", updateDisplay);

        function goToPage(inputValue) {
            const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
            if (totalPages === 0) {
                currentPage = 1;
                renderAnnouncements();
                return;
            }

            const sanitized = String(inputValue).replace(/\D/g, "").slice(0, 3);
            let nextPage = Number.parseInt(sanitized, 10);
            if (Number.isNaN(nextPage)) {
                nextPage = currentPage;
            }

            if (nextPage < 1) nextPage = 1;
            if (nextPage > totalPages) nextPage = totalPages;

            currentPage = nextPage;
            renderAnnouncements();
        }

        pageInput.addEventListener("input", () => {
            pageInput.value = pageInput.value.replace(/\D/g, "").slice(0, 3);
        });

        pageInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                goToPage(pageInput.value);
            }
        });

        pageInput.addEventListener("blur", () => {
            goToPage(pageInput.value);
        });

        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage -= 1;
                renderAnnouncements();
            }
        });

        nextPageBtn.addEventListener("click", () => {
            const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage += 1;
                renderAnnouncements();
            }
        });

    } catch (err) {
        console.log("公告讀取失敗", err);
    }
}

loadAnnouncements();
