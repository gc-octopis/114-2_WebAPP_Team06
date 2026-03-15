// 漢堡選單切換側邊欄
const hamburgerBtn = document.querySelector('.hamburger-btn');
const sidebar = document.querySelector('.sidebar');
const foldBtn = document.querySelector('.fold-btn');
const themeBtn = document.querySelector('.theme-btn');

hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar-open');
});

// 點擊側邊欄外部關閉
document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        sidebar.classList.remove('sidebar-open');
    }
});

// 點擊 fold-btn 關閉
foldBtn.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar-open');
});

// 點擊 theme-btn 切換亮暗
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
})