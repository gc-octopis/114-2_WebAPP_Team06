import { UseLinkContext } from "./LinkContext";
import { motion } from "motion/react"
import { useLanguage, getLocalizedValue, getLocalizedCategoryLabel } from "./LanguageContext";

function hasCjk(text = "") {
    return /[\u3400-\u9fff]/.test(text);
}

function hasEnglishMapping(item) {
    const enLabel = (item?.label_en || "").trim();
    const zhLabel = (item?.label || "").trim();

    if (!enLabel) return false;
    if (enLabel === zhLabel && hasCjk(enLabel)) return false;

    return true;
}

function Favorites()
{
    const { lang } = useLanguage();
    const { categories, activeCatIdx } = UseLinkContext();
    const activeCat = categories[activeCatIdx];

    const activeCategoryLabel = activeCat ? getLocalizedCategoryLabel(activeCat, lang) : "";
    const visibleLinks = (activeCat?.links || []).filter((item) => {
        if (lang !== "en") return true;
        return hasEnglishMapping(item);
    });

    return (
    <>
    {/*favorite section*/}
    <section className="general-section">
        <h2 className="section-title" id="favoritesTitle">{activeCat ? (activeCat.icon + "  " + activeCategoryLabel) : ""}</h2>

            <motion.div
            key={activeCatIdx} // Changing the key triggers the animation
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="cards-grid" id="favoritesGrid">
                {
                    activeCat && visibleLinks.map((item, iter) => 
                        {
                            const linkLabel = getLocalizedValue(item, lang, "label", "");
                            return (
                        <a href={item.url} className="card-anchor-item" key={iter}
                        target="_blank" rel="noopener noreferrer" title={linkLabel}>
                            <div className="card-icon-box">
                                <img src={item.icon} alt={linkLabel} className="card-icon-img" loading="lazy" />
                            </div>
                            <span className="card-label">{linkLabel}</span>
                        </a>
                            );
                        }
                    )
                }
            </motion.div>

    </section>
    </>
    )
}

export default Favorites;