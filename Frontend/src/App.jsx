import Layout from "./Layout";
import Hero from "./Hero";
import Favorites from "./Favorites";
import Announcement from "./Announcement";
import { useText } from "./LanguageContext";

import { useEffect } from "react";

function App()
{
    const t = useText();
    const title = t.home;

    useEffect(() => {
        document.title = "MyNTU++ | " + title;
    }, [title]);

    return (
        <Layout title={title}>       
            <div className="content-width-limiter">
                <Hero />
                <Favorites />
                <Announcement />
            </div>
        </Layout>
    )
}

export default App;