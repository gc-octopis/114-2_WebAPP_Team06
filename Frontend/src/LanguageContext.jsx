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
        allCategories: "全部類別",
        prevPage: "上一頁",
        nextPage: "下一頁",
        noAnnouncement: "找不到符合條件的公告",
        missingDate: "日期未提供",
        untitledAnnouncement: "未命名公告",
        genericCategory: "一般",
        categories: {
            urgent: "緊急",
            general: "一般",
            recruitment: "徵才",
            tender: "標案",
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
        allCategories: "All Categories",
        prevPage: "Previous",
        nextPage: "Next",
        noAnnouncement: "No matching announcements",
        missingDate: "Date unavailable",
        untitledAnnouncement: "Untitled",
        genericCategory: "General",
        categories: {
            urgent: "Urgent",
            general: "General",
            recruitment: "Recruitment",
            tender: "Tender",
        },
    },
};

const categoryLabelById = {
    teaching: { "zh-TW": "教學", en: "Teaching" },
    library: { "zh-TW": "圖書研究", en: "Library & Research" },
    finance: { "zh-TW": "帳務財物", en: "Finance" },
    venue: { "zh-TW": "場館交通", en: "Facilities & Transport" },
    campus: { "zh-TW": "校園資源", en: "Campus Resources" },
    news: { "zh-TW": "消息公告", en: "News" },
    feedback: { "zh-TW": "意見交流", en: "Feedback" },
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
