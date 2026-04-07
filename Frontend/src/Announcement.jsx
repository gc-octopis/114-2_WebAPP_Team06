import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './announcement.css';
import { useLanguage, useText, getLocalizedValue } from './LanguageContext';
import { AnnouncementAPI } from './announcementAPI';

function Announcement()
{
    const { lang } = useLanguage();
    const location = useLocation();
    const t = useText();
    const [data, setData] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const ITEMS_PER_PAGE = 10;
    const FEEDBACK_ITEMS_PER_PAGE = 4;
    const [currentPage, setCurrentPage] = useState(1);
    const [category, setCategory] = useState("");
    const [inputVal, setInputVal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [feedbackPosts, setFeedbackPosts] = useState([]);
    const [feedbackPage, setFeedbackPage] = useState(1);
    const [feedbackInputVal, setFeedbackInputVal] = useState('1');
    const [feedbackIsLoading, setFeedbackIsLoading] = useState(false);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackError, setFeedbackError] = useState('');
    const [feedbackSuccess, setFeedbackSuccess] = useState('');
    const [feedbackForm, setFeedbackForm] = useState({
        nickname: '',
        content: '',
    });

    const totalItems = useRef(0);
    const totalPages = useRef(0);
    const feedbackTotalPages = useRef(0);
    const isFeedbackCategory = new URLSearchParams(location.search).get('cat') === 'feedback';

    useEffect(() => {
        setCategory("");
        setCurrentPage(1);
    }, [lang]);

    useEffect(() => {
        if (isFeedbackCategory) {
            return;
        }

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
    }, [lang, category, currentPage, isFeedbackCategory]);

    useEffect(() => {
        if (!isFeedbackCategory) {
            return;
        }

        (async function () {
            setFeedbackIsLoading(true);
            setFeedbackError('');
            try {
                const result = await AnnouncementAPI.getFeedbackPosts({
                    page: feedbackPage,
                    page_size: FEEDBACK_ITEMS_PER_PAGE,
                });

                setFeedbackPosts(result.posts);
                feedbackTotalPages.current = result.total_pages;
                if (result.page !== feedbackPage) {
                    setFeedbackPage(result.page);
                }
                setFeedbackInputVal(String(result.total_pages === 0 ? 0 : result.page));
            } catch (error) {
                setFeedbackPosts([]);
                feedbackTotalPages.current = 0;
                setFeedbackInputVal('0');
                setFeedbackError(t.feedbackPostFailed);
            } finally {
                setFeedbackIsLoading(false);
            }
        })();
    }, [feedbackPage, isFeedbackCategory, t.feedbackPostFailed]);

    useEffect(() => {
        setFeedbackSuccess('');
        setFeedbackError('');
    }, [lang]);

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

    function goToFeedbackPage(inputValue) {
        if (feedbackTotalPages.current === 0) {
            setFeedbackPage(1);
            return;
        }

        const sanitized = String(inputValue).replace(/\D/g, '').slice(0, 3);
        let nextPage = Number.parseInt(sanitized, 10);
        if (Number.isNaN(nextPage)) {
            nextPage = feedbackPage;
        }

        if (nextPage < 1) nextPage = 1;
        if (nextPage > feedbackTotalPages.current) nextPage = feedbackTotalPages.current;

        setFeedbackPage(nextPage);
    }

    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return t.missingDate;
        return dateTimeString;
    }

    async function submitFeedback(e) {
        e.preventDefault();
        setFeedbackError('');
        setFeedbackSuccess('');

        const payload = {
            nickname: feedbackForm.nickname.trim(),
            content: feedbackForm.content.trim(),
        };

        if (!payload.content) {
            setFeedbackError(t.feedbackPostFailed);
            return;
        }

        setIsSubmittingFeedback(true);
        try {
            await AnnouncementAPI.createFeedbackPost(payload);
            setFeedbackForm({ nickname: '', content: '' });
            setFeedbackSuccess(t.feedbackPostSuccess);
            setFeedbackPage(1);
            const result = await AnnouncementAPI.getFeedbackPosts({ page: 1, page_size: FEEDBACK_ITEMS_PER_PAGE });
            setFeedbackPosts(result.posts);
            feedbackTotalPages.current = result.total_pages;
            setFeedbackInputVal(String(result.total_pages === 0 ? 0 : result.page));
        } catch (error) {
            setFeedbackError(error.message || t.feedbackPostFailed);
        } finally {
            setIsSubmittingFeedback(false);
        }
    }


    return (
    <>
    {/*announcements section*/}
    <section className="general-section">
        <h2 className="section-title">{isFeedbackCategory ? t.feedbackBoard : t.announcements}</h2>
        {!isFeedbackCategory && data && <>
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

        {isFeedbackCategory && (
            <>
                <p className="feedback-intro">{t.feedbackIntro}</p>
                <div className="feedback-toolbar">
                    <h3 className="feedback-list-title">{t.feedbackListTitle}</h3>
                    <div className="announcement-pagination">
                        <button
                            type="button"
                            className="announcement-page-btn"
                            disabled={feedbackTotalPages.current === 0 || feedbackPage <= 1}
                            onClick={() => goToFeedbackPage(feedbackPage - 1)}
                        >
                            {t.prevPage}
                        </button>
                        <div className="announcement-page-status">
                            <input
                                type="text"
                                className="announcement-page-input"
                                inputMode='numeric'
                                pattern='[0-9]*'
                                maxLength={3}
                                value={feedbackInputVal}
                                disabled={feedbackTotalPages.current === 0}
                                onInput={(e) => setFeedbackInputVal(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                onKeyDown={(e) => (e.key === 'Enter') && goToFeedbackPage(e.target.value)}
                                onBlur={(e) => goToFeedbackPage(e.target.value)}
                            />
                            <span className="announcement-page-total">/{feedbackTotalPages.current}</span>
                        </div>
                        <button
                            type='button'
                            className="announcement-page-btn"
                            disabled={feedbackTotalPages.current === 0 || feedbackPage >= feedbackTotalPages.current}
                            onClick={() => goToFeedbackPage(feedbackPage + 1)}
                        >
                            {t.nextPage}
                        </button>
                    </div>
                </div>

                <div className="feedback-list">
                    {feedbackIsLoading ? (
                        <p className="announcement-empty">Loading...</p>
                    ) : feedbackPosts.length === 0 ? (
                        <p className="announcement-empty">{t.feedbackEmpty}</p>
                    ) : (
                        feedbackPosts.map((post) => (
                            <article className="feedback-item" key={post.id}>
                                <div className="feedback-item-header">
                                    <div className="feedback-item-user">
                                        <span
                                            className="feedback-avatar"
                                            style={{ backgroundColor: post.avatar_color || '#94a3b8' }}
                                            aria-hidden="true"
                                        />
                                        <p className="feedback-item-author">{post.nickname || t.anonymousUser}</p>
                                    </div>
                                    <time className="feedback-item-time">{formatDateTime(post.created_at)}</time>
                                </div>
                                <p className="feedback-item-content">{post.content}</p>
                            </article>
                        ))
                    )}
                </div>

                <h3 className="feedback-list-title">{t.feedbackFormTitle}</h3>
                <form className="feedback-form" onSubmit={submitFeedback}>
                    <label className="feedback-label" htmlFor="feedback-nickname">{t.feedbackNicknameLabel}</label>
                    <input
                        id="feedback-nickname"
                        type="text"
                        className="feedback-input"
                        maxLength={80}
                        placeholder={t.feedbackNicknamePlaceholder}
                        value={feedbackForm.nickname}
                        onChange={(e) => setFeedbackForm((prev) => ({ ...prev, nickname: e.target.value }))}
                    />

                    <label className="feedback-label" htmlFor="feedback-content">{t.feedbackContentLabel}</label>
                    <textarea
                        id="feedback-content"
                        className="feedback-textarea"
                        maxLength={3000}
                        required
                        placeholder={t.feedbackContentPlaceholder}
                        value={feedbackForm.content}
                        onChange={(e) => setFeedbackForm((prev) => ({ ...prev, content: e.target.value }))}
                    />

                    {feedbackError && <p className="feedback-status feedback-status--error">{feedbackError}</p>}
                    {feedbackSuccess && <p className="feedback-status feedback-status--success">{feedbackSuccess}</p>}

                    <button type="submit" className="feedback-submit-btn" disabled={isSubmittingFeedback}>
                        {isSubmittingFeedback ? t.feedbackSubmitting : t.feedbackSubmit}
                    </button>
                </form>
            </>
        )}
    </section>
    </>
    );
}

export default Announcement;