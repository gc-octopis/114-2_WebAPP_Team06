import React, { useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = React.createContext({});

const STORAGE_KEY = "myntu_lang";

const messages = {
    "zh-TW": {
        home: "首頁",
        about: "關於我們",
        calendar: "行事曆",
        searchPlaceholder: "搜尋",
        quickLinks: "快捷連結",
        quickServices: "快捷服務",
        quickCourseSelect: "快速選課",
        mailInbox: "收發信件",
        login: "登入系統",
        switchLanguage: "切換中英",
        switchTheme: "切換主題",
        systemSettings: "系統設定",
        aboutUs: "關於我們",
        prevMonth: "前月",
        nextMonth: "後月",
        eventList: "活動清單",
        selectDateHint: "選擇日期查看活動",
        noEventsOnDate: "沒有活動",
        location: "地點",
        description: "說明",
        announcements: "公告清單",
        feedbackBoard: "留言板",
        feedbackIntro: "匿名發文，和大家交流想法。",
        feedbackFormTitle: "撰寫留言",
        feedbackNicknameLabel: "匿名暱稱（選填）",
        feedbackNicknamePlaceholder: "例如：熱心同學",
        feedbackContentLabel: "內容",
        feedbackContentPlaceholder: "寫下你的建議、回饋或心得...",
        feedbackSubmit: "發布",
        feedbackSubmitting: "發布中...",
        feedbackListTitle: "歷史留言",
        feedbackEmpty: "目前還沒有留言，來發第一篇吧！",
        feedbackPostSuccess: "留言發布成功",
        feedbackPostFailed: "發布失敗，請稍後再試",
        anonymousUser: "匿名使用者",
        allCategories: "全部類別",
        prevPage: "上一頁",
        nextPage: "下一頁",
        noAnnouncement: "找不到符合條件的公告",
        missingDate: "日期未提供",
        untitledAnnouncement: "未命名公告",
        genericCategory: "一般",
        contactFormTitle: "提交建議",
        contactName: "姓名（選填）",
        contactNamePlaceholder: "請輸入姓名",
        contactEmail: "電子郵件（選填）",
        contactEmailPlaceholder: "請輸入電子郵件",
        contactMessage: "訊息內容",
        contactMessagePlaceholder: "寫下您的建議或問題...",
        contactSubmit: "送出",
        contactSubmitting: "送出中...",
        contactSuccess: "感謝您的留言！我們將盡速處理。",
        contactError: "送出失敗，請稍後再試。",
        categories: {
            urgent: "緊急",
            general: "一般",
            recruitment: "徵才",
            tender: "標案",
            activities: "活動",
            speech: "演講",
        },
    },
    en: {
        home: "Home",
        about: "About",
        calendar: "Calendar",
        searchPlaceholder: "Search",
        quickLinks: "Quick Links",
        quickServices: "Quick Services",
        quickCourseSelect: "Quick Course Selection",
        mailInbox: "Mail Inbox",
        login: "Log in",
        switchLanguage: "Switch Language",
        switchTheme: "Toggle Theme",
        systemSettings: "System Settings",
        aboutUs: "About",
        prevMonth: "Prev",
        nextMonth: "Next",
        eventList: "Events",
        selectDateHint: "Select a date to view events",
        noEventsOnDate: "No events",
        location: "Location",
        description: "Description",
        announcements: "Announcements",
        feedbackBoard: "Feedback Board",
        feedbackIntro: "Post anonymously and share your thoughts.",
        feedbackFormTitle: "Create a Post",
        feedbackNicknameLabel: "Nickname (optional)",
        feedbackNicknamePlaceholder: "e.g. Helpful Student",
        feedbackContentLabel: "Content",
        feedbackContentPlaceholder: "Share your suggestion, feedback, or story...",
        feedbackSubmit: "Post",
        feedbackSubmitting: "Posting...",
        feedbackListTitle: "Previous Posts",
        feedbackEmpty: "No posts yet. Be the first one!",
        feedbackPostSuccess: "Post submitted successfully",
        feedbackPostFailed: "Failed to submit post. Please try again.",
        anonymousUser: "Anonymous",
        allCategories: "All Categories",
        prevPage: "Previous",
        nextPage: "Next",
        noAnnouncement: "No matching announcements",
        missingDate: "Date unavailable",
        untitledAnnouncement: "Untitled",
        genericCategory: "General",
        contactFormTitle: "Submit Feedback",
        contactName: "Name (optional)",
        contactNamePlaceholder: "Enter your name",
        contactEmail: "Email (optional)",
        contactEmailPlaceholder: "Enter your email",
        contactMessage: "Message",
        contactMessagePlaceholder: "Write your suggestion or question...",
        contactSubmit: "Send",
        contactSubmitting: "Sending...",
        contactSuccess: "Thank you! We'll get back to you shortly.",
        contactError: "Submission failed. Please try again.",
        categories: {
            urgent: "Urgent",
            general: "General",
            recruitment: "Recruitment",
            tender: "Tender",
            activities: "Activities",
            speech: "Speech",
        },
    },
};

const categoryLabelById = {
    students: { "zh-TW": "學生專區", en: "Students" },
    courses:  { "zh-TW": "課程學習", en: "Courses" },
    faculty:  { "zh-TW": "教職申辦", en: "Faculty & Staff" },
    teaching: { "zh-TW": "教學",     en: "Teaching" },
    library:  { "zh-TW": "圖書研究", en: "Research" },
    finance:  { "zh-TW": "帳務財物", en: "Accounts" },
    venue:    { "zh-TW": "場館交通", en: "Facilities" },
    campus:   { "zh-TW": "校園資源", en: "Resources" },
    news:     { "zh-TW": "消息公告", en: "Bulletin" },
    feedback: { "zh-TW": "意見交流", en: "Opinions" },
};

export function useLanguage() {
    return useContext(LanguageContext);
}

export function useText() {
    const { lang } = useLanguage();
    return messages[lang] || messages["zh-TW"];
}

export function getLocalizedValue(item, lang, key, fallback = "") {
    if (!item || !key) return fallback;

    if (lang === "en") {
        return item[`${key}_en`] || item[key] || fallback;
    }

    return item[`${key}_zh`] || item[key] || fallback;
}

export function getLocalizedCategoryLabel(item, lang) {
    if (!item) return "";

    const fromFields = getLocalizedValue(item, lang, "label", "");
    if (fromFields) return fromFields;

    const fromId = categoryLabelById[item.id];
    if (!fromId) return "";

    return fromId[lang] || fromId["zh-TW"] || "";
}

export default function LanguageProvider({ children }) {
    const [lang, setLang] = useState("zh-TW");

    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "zh-TW" || stored === "en") {
            setLang(stored);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const toggleLanguage = () => {
        setLang((prev) => (prev === "zh-TW" ? "en" : "zh-TW"));
    };

    const value = useMemo(() => ({ lang, setLang, toggleLanguage }), [lang]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
