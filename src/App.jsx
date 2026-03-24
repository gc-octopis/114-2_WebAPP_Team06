import Layout from "./Layout";
import Hero from "./Hero";
import Favorites from "./Favorites";
import Announcement from "./Announcement";

import { useEffect } from "react";

function App()
{
    const title = "首頁";
    useEffect(() => {
        document.title = "MyNTU++ | " + title;
    }, []);

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