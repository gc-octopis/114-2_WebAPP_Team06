import { UseLinkContext } from "./LinkContext";
import { motion, AnimatePresence } from "motion/react"

function Favorites()
{
    const { categories, activeCatIdx } = UseLinkContext();
    const activeCat = categories[activeCatIdx];

    return (
    <>
    {/*favorite section*/}
    <section className="general-section">
        <h2 className="section-title" id="favoritesTitle">{activeCat ? (activeCat.icon + "  " + activeCat.label) : "工具列表"}</h2>

            <motion.div
            key={activeCatIdx} // Changing the key triggers the animation
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="cards-grid" id="favoritesGrid">
                {
                    activeCat && activeCat.links.map((item, iter) => 
                        <a href={item.url} className="card-anchor-item" key={iter}
                        target="_blank" rel="noopener noreferrer" title={item.label}>
                            <div className="card-icon-box">
                                <img src={item.icon} alt={item.label} className="card-icon-img" loading="lazy" />
                            </div>
                            <span className="card-label">{item.label}</span>
                        </a>
                    )
                }
            </motion.div>

    </section>
    </>
    )
}

export default Favorites;