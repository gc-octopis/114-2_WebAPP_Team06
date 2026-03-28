import { useEffect, useState, useRef } from 'react';
import './announcement.css';
import { useLanguage, useText, getLocalizedValue } from './LanguageContext';
import { AnnouncementAPI } from './announcementAPI';

function Announcement()
{
    const { lang } = useLanguage();
    const t = useText();
    const [data, setData] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [category, setCategory] = useState("");
    const [inputVal, setInputVal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const totalItems = useRef(0);
    const totalPages = useRef(0);

    useEffect(() => {
        setCategory("");
        setCurrentPage(1);
    }, [lang]);

    useEffect(() => {
        (async function () {
        setIsLoading(true);
        try {
            const result = await AnnouncementAPI.getAnnouncements(lang, {
                category,
                page: currentPage,
                page_size: ITEMS_PER_PAGE,
            });

            setData(result.announcements);
            setCategoryOptions(result.categories);
            totalItems.current = result.count;
            totalPages.current = result.total_pages;

            if (result.page !== currentPage) {
                setCurrentPage(result.page);
            }

            setInputVal(String(result.total_pages === 0 ? 0 : result.page));
        } catch (error) {
            setData([]);
            setCategoryOptions([]);
            totalItems.current = 0;
            totalPages.current = 0;
            setInputVal("0");
        } finally {
            setIsLoading(false);
        }
        })();
    }, [lang, category, currentPage]);

    function formatDate(dateString) {
        if (!dateString) return t.missingDate;
        return dateString.replaceAll("-", "/");
    }

    function normalizeCategoryType(category) {
        const categoryText = String(category || "").trim();
        const lower = categoryText.toLowerCase();

        const exactMap = {
            "緊急": "urgent",
            "一般": "general",
            "徵才": "recruit",
            "標案": "tender",
            "活動": "activities",
            "演講": "speech",
            "urgent": "urgent",
            "general": "general",
            "recruitment": "recruit",
            "job openings": "recruit",
            "tender": "tender",
            "activities": "activities",
            "speech": "speech",
        };

        if (exactMap[lower]) {
            return exactMap[lower];
        }

        if (lower.includes("urgent")) return "urgent";
        if (lower.includes("job") || lower.includes("recruit")) return "recruit";
        if (lower.includes("tender") || lower.includes("bid") || lower.includes("procurement")) return "tender";

        return "general";
    }

    function localizeCategory(category) {
        const normalized = normalizeCategoryType(category);
        const map = {
            urgent: t.categories.urgent,
            general: t.categories.general,
            recruit: t.categories.recruitment,
            tender: t.categories.tender,
            activities: t.categories.activities,
            speech: t.categories.speech,
        };

        return map[normalized] || category || t.genericCategory;
    }

    function getCategoryBadgeClass(category) {
        const type = normalizeCategoryType(category);
        const classMap = {
            urgent: "category-badge--urgent",
            general: "category-badge--general",
            recruit: "category-badge--recruit",
            tender: "category-badge--tender",
            activities: "category-badge--activities",
            speech: "category-badge--speech",
        };
        return classMap[type] || "category-badge--default";
    }

    function goToPage(inputValue) {
        if (totalPages.current === 0) {
            setCurrentPage(1);
            return;
        }

        const sanitized = String(inputValue).replace(/\D/g, "").slice(0, 3);
        let nextPage = Number.parseInt(sanitized, 10);
        if (Number.isNaN(nextPage)) {
            nextPage = currentPage;
        }

        if (nextPage < 1) nextPage = 1;
        if (nextPage > totalPages.current) nextPage = totalPages.current;

        setCurrentPage(nextPage);
    }


    return (
    <>
    {/*announcements section*/}
    <section className="general-section">
        <h2 className="section-title">{t.announcements}</h2>
        { data && <>
        <div className="announcement-toolbar">
            <select className="announcement-select" value={category}
                    onChange={(e) => {
                        setCategory(e.target.value);
                        setCurrentPage(1);
                    }}>
                <option value="">{t.allCategories}</option>
                {categoryOptions
                    .map((itemCategory) => <option value={itemCategory} key={itemCategory}>{localizeCategory(itemCategory)}</option>)}
            </select>
            <div className="announcement-pagination">
                <button type="button" className="announcement-page-btn"
                        disabled={totalPages.current === 0 || currentPage <= 1}
                        onClick={() => goToPage(currentPage - 1)}>{t.prevPage}</button>
                <div className="announcement-page-status">
                    <input type="text" className="announcement-page-input" inputMode='numeric'
                           pattern='[0-9]*' maxLength={3}
                           value={inputVal}
                           disabled={totalPages.current === 0}
                           onInput={(e) => setInputVal(e.target.value.replace(/\D/g, "").slice(0, 3))}
                           onKeyDown={(e) => (e.key === "Enter") && goToPage(e.target.value)}
                           onBlur={(e) => goToPage(e.target.value)} />
                    <span className="announcement-page-total">/{totalPages.current}</span>
                </div>
                <button type='button' className="announcement-page-btn"
                        disabled={totalPages.current === 0 || currentPage >= totalPages.current}
                        onClick={() => goToPage(currentPage + 1)}>{t.nextPage}</button>
            </div>
        </div>
        <div className="announcement-list" id="announcementList">
            {
                isLoading ?
                <p className="announcement-empty">Loading...</p> :
                data.length === 0 ?
                <p className="announcement-empty">{t.noAnnouncement}</p> :
                data.map((item, iter) => 
                    <article className="announcement-item" key={iter}>
                        <span className={"category-badge " + getCategoryBadgeClass(item.category)}>{localizeCategory(item.category)}</span>
                        <a href={item.link} className="announcement-link"
                           target='_blank' rel="noopener noreferrer">{getLocalizedValue(item, lang, 'title', t.untitledAnnouncement)}</a>
                        <time dateTime={item.date || ""} className="announcement-time">{formatDate(item.date)}</time>
                    </article>
                )
            }
        </div>
        </>}
    </section>
    </>
    );
}

export default Announcement;