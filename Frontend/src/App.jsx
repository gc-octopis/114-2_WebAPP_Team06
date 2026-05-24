import Layout from "./Layout";
import Hero from "./Hero";
import Favorites from "./Favorites";
import Announcement from "./Announcement";
import { useText } from "./LanguageContext";
import { useLocation } from "react-router-dom";

import { useEffect } from "react";

function App()
{
    const t = useText();
    const title = t.home;
    const location = useLocation();
    const selectedCategoryId = new URLSearchParams(location.search).get("cat");
    const isFeedbackCategory = selectedCategoryId === "feedback";

    useEffect(() => {
        document.title = "MyNTU++ | " + title;
    }, [title]);

    return (
        <Layout title={title}>       
            <div className="content-width-limiter">
                <Hero />
                {selectedCategoryId ? <Favorites /> : null}
                {(!selectedCategoryId || isFeedbackCategory) ? <Announcement /> : null}
            </div>
        </Layout>
    )
}

export default App;
