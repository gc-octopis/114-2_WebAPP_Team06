import { useEffect } from "react";
import Layout from "./Layout";
import YouBike from "./YouBike";
import { useLanguage } from "./LanguageContext";

function YouBikePage() {
    const { lang } = useLanguage();
    const title = lang === "en" ? "YouBike" : "YouBike 即時車況";

    useEffect(() => {
        document.title = "MyNTU++ | " + title;
    }, [title]);

    return (
        <Layout title={title}>
            <div className="content-width-limiter">
                <YouBike />
            </div>
        </Layout>
    );
}

export default YouBikePage;
