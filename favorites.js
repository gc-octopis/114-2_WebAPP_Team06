// =========================================================
// favorites.js — 分類側邊欄 + 主區域連結顯示（真實圖示版）
// =========================================================

async function loadFavorites() {
    try {
        const res = await fetch("links.json");
        const categories = await res.json();

        const navContainer = document.getElementById("categoryNav");
        const linksGrid    = document.getElementById("favoritesGrid");
        const sectionTitle = document.getElementById("favoritesTitle");

        if (!navContainer) return;  // sidebar 不存在才真正放棄

        // ── 在 sidebar 產生分類按鈕 ──────────────────────────
        navContainer.innerHTML = "";
        categories.forEach((cat, index) => {
            const btn = document.createElement("button");
            btn.className = "cat-btn";
            btn.dataset.id = cat.id;
            btn.innerHTML = `<span class="cat-btn-icon">${cat.icon}</span><span class="cat-btn-label">${cat.label}</span>`;

            if (linksGrid) {
                // index.html：點擊切換主區域
                btn.addEventListener("click", () => selectCategory(cat, btn));
            } else {
                // about / calendar：點擊跳回首頁並帶入分類參數
                btn.addEventListener("click", () => {
                    window.location.href = `index.html?cat=${cat.id}`;
                });
            }

            navContainer.appendChild(btn);

            // 只有 index.html（有 favoritesGrid）才預設渲染第一個分類
            if (index === 0 && linksGrid) {
                btn.classList.add("active");
                renderLinks(cat, linksGrid, sectionTitle);
            }
        });

        // ── 若 URL 帶有 ?cat= 參數，自動選中對應分類 ──────────
        if (linksGrid) {
            const params = new URLSearchParams(window.location.search);
            const targetId = params.get("cat");
            if (targetId) {
                const targetCat = categories.find(c => c.id === targetId);
                const targetBtn = navContainer.querySelector(`[data-id="${targetId}"]`);
                if (targetCat && targetBtn) {
                    // 取消預設的第一個 active
                    navContainer.querySelector(".cat-btn.active")?.classList.remove("active");
                    targetBtn.classList.add("active");
                    renderLinks(targetCat, linksGrid, sectionTitle);
                }
            }
        }

    } catch (err) {
        console.error("常用連結讀取失敗：", err);
    }
}

// ── 切換分類 ──────────────────────────────────────────────
function selectCategory(cat, clickedBtn) {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    clickedBtn.classList.add("active");
    const linksGrid    = document.getElementById("favoritesGrid");
    const sectionTitle = document.getElementById("favoritesTitle");
    renderLinks(cat, linksGrid, sectionTitle);
}

// ── 渲染連結卡片 ──────────────────────────────────────────
function renderLinks(cat, grid, titleEl) {
    if (titleEl) titleEl.textContent = cat.icon + "  " + cat.label;

    // 淡出舊卡片
    grid.style.transition = "opacity 0.15s ease, transform 0.15s ease";
    grid.style.opacity = "0";
    grid.style.transform = "translateY(8px)";

    setTimeout(() => {
        grid.innerHTML = "";

        cat.links.forEach(item => {
            const card = document.createElement("a");
            card.href = item.url;
            card.className = "card-anchor-item";
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            card.title = item.label;

            // 如果有真實圖示 URL，用 <img>；否則 fallback 到 emoji
            const isImgUrl = item.icon && (item.icon.startsWith("http") || item.icon.startsWith("/"));
            const iconHtml = isImgUrl
                ? `<img src="${item.icon}" alt="${item.label}" class="card-icon-img" loading="lazy">`
                : `<span class="card-emoji">${item.icon || "🔗"}</span>`;

            card.innerHTML = `
                <div class="card-icon-box">${iconHtml}</div>
                <span class="card-label">${item.label}</span>
            `;
            grid.appendChild(card);
        });

        // 淡入新卡片
        grid.style.transition = "opacity 0.25s ease, transform 0.25s ease";
        grid.style.opacity = "1";
        grid.style.transform = "translateY(0)";
    }, 150);
}

loadFavorites();
