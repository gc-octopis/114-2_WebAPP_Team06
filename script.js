const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.querySelector('.sidebar-wrapper');

// 監聽漢堡按鈕的點擊事件
hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.toggle('toggled');
});

// 點擊畫面的其他地方時關閉側邊欄
document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('toggled');
        }
    }
});

// --- 主題切換功能 ---
const themeBtn = document.getElementById('theme-btn');

themeBtn.addEventListener('click', (e) => {
    // 阻止 <a> 標籤預設會跳轉回頁面最上方的行為
    e.preventDefault();
    
    // classList.toggle() 的功能是：
    // 如果 body 沒有 'dark' 這個 class 就加上去；如果已經有了就拿掉！
    document.body.classList.toggle('dark');
});
