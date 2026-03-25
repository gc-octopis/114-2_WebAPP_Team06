import Layout from "./Layout";
import Hero from "./Hero";

import './about.css';

import { useEffect } from "react";
import { useLanguage } from "./LanguageContext";

function About()
{
    const { lang } = useLanguage();
    const title = lang === "en" ? "About" : "關於我們";
    const copy = lang === "en" ? {
        intro: "Project Overview",
        introP1: "MyNTU++ is an integrated student portal for National Taiwan University. It brings common campus services into one interface so students can finish academic tasks more quickly.",
        introP2: "From course selection and facility requests to calendar lookup and service access, MyNTU++ aims to provide a consistent and friendly experience.",
        features: "Core Features",
        featureItems: ["Course Management", "Application Services", "Calendar", "Announcements", "Profile", "Account Settings"],
        team: "Team",
        teamItems: [
            ["Project Manager", "Project planning and progress tracking"],
            ["Frontend Engineer", "User interface and interaction design"],
            ["Backend Engineer", "Server and database management"],
            ["Designer", "Visual design and user experience"],
        ],
        vision: "Vision",
        visionItems: [
            ["Simplify", "Integrate fragmented services and reduce operation steps."],
            ["Improve", "Deliver a clean and intuitive interface."],
            ["Evolve", "Keep iterating based on student needs."],
        ],
        contact: "Contact",
        email: "Email:",
        location: "Location:",
        feedback: "Feedback Form:",
        locationText: "National Taiwan University",
        feedbackText: "Submit suggestion",
    } : {
        intro: "專案簡介",
        introP1: "MyNTU++ 是一個為國立臺灣大學學生打造的整合型服務平臺，致力於提升學生的校園生活體驗。我們將校內各項常用服務集中在一個介面上，讓同學輕鬆快速地完成學業相關的各項事務。",
        introP2: "無論是課程選擇、場地借用、行事曆查詢或其他學生服務，MyNTU++ 都能提供一致且友善的使用體驗。",
        features: "核心特色",
        featureItems: ["課程管理", "申請服務", "行事曆", "公告消息", "個人資料", "帳戶設定"],
        team: "開發團隊",
        teamItems: [
            ["專案經理", "負責專案規劃與進度管理"],
            ["前端工程師", "負責使用者介面與互動設計"],
            ["後端工程師", "負責伺服器與資料庫管理"],
            ["設計師", "負責視覺設計與使用者體驗"],
        ],
        vision: "我們的願景",
        visionItems: [
            ["簡化流程", "整合分散的服務，減少學生的操作步驟"],
            ["提升體驗", "設計直覺友善的介面，提供流暢的使用體驗"],
            ["持續創新", "不斷改進功能，把握學生需求"],
        ],
        contact: "聯絡我們",
        email: "電子郵件：",
        location: "位置：",
        feedback: "反饋表單：",
        locationText: "國立臺灣大學",
        feedbackText: "提交建議",
    };

    useEffect(() => {
        document.title = "MyNTU++ | " + title;
    }, [title]);

    return (
        <Layout title={title}>
            <div className="content-width-limiter">
                <Hero />
                {/* 專案簡介 (加上乾淨的 class，不寫行內樣式) */}
                <section className="general-section">
                    <h2 className="section-title">{copy.intro}</h2>
                    <p>
                        {copy.introP1}
                    </p>
                    <p>
                        {copy.introP2}
                    </p>
                </section>

                {/* 核心特色 */}
                <section className="general-section">
                    <h2 className="section-title">{copy.features}</h2>
                    <div className="cards-grid">
                        <div className="card-anchor-item">
                            <div className="card-icon-box">📚</div>
                            <span className="card-label">{copy.featureItems[0]}</span>
                        </div>
                        <div className="card-anchor-item">
                            <div className="card-icon-box">📋</div>
                            <span className="card-label">{copy.featureItems[1]}</span>
                        </div>
                        <div className="card-anchor-item">
                            <div className="card-icon-box">📅</div>
                            <span className="card-label">{copy.featureItems[2]}</span>
                        </div>
                        <div className="card-anchor-item">
                            <div className="card-icon-box">📢</div>
                            <span className="card-label">{copy.featureItems[3]}</span>
                        </div>
                        <div className="card-anchor-item">
                            <div className="card-icon-box">👤</div>
                            <span className="card-label">{copy.featureItems[4]}</span>
                        </div>
                        <div className="card-anchor-item">
                            <div className="card-icon-box">⚙️</div>
                            <span className="card-label">{copy.featureItems[5]}</span>
                        </div>
                    </div>
                </section>

                {/* 開發團隊 (套用新寫好的網格 class) */}
                <section className="general-section">
                    <h2 className="section-title">{copy.team}</h2>
                    <div className="auto-grid">
                        <div className="info-card">
                            <div className="info-card-icon">👨‍💼</div>
                            <h3 className="info-card-title">{copy.teamItems[0][0]}</h3>
                            <p className="info-card-desc">{copy.teamItems[0][1]}</p>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">👩‍💻</div>
                            <h3 className="info-card-title">{copy.teamItems[1][0]}</h3>
                            <p className="info-card-desc">{copy.teamItems[1][1]}</p>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">👨‍💻</div>
                            <h3 className="info-card-title">{copy.teamItems[2][0]}</h3>
                            <p className="info-card-desc">{copy.teamItems[2][1]}</p>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">🎨</div>
                            <h3 className="info-card-title">{copy.teamItems[3][0]}</h3>
                            <p className="info-card-desc">{copy.teamItems[3][1]}</p>
                        </div>
                    </div>
                </section>

                {/* 我們的願景 (套用新寫好的卡片 class) */}
                <section className="general-section">
                    <h2 className="section-title">{copy.vision}</h2>
                    <div className="auto-grid">
                        <div className="info-card">
                            <div className="info-card-icon">1</div>
                            <h3 className="info-card-title">{copy.visionItems[0][0]}</h3>
                            <p className="info-card-desc">{copy.visionItems[0][1]}</p>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">2</div>
                            <h3 className="info-card-title">{copy.visionItems[1][0]}</h3>
                            <p className="info-card-desc">{copy.visionItems[1][1]}</p>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">3</div>
                            <h3 className="info-card-title">{copy.visionItems[2][0]}</h3>
                            <p className="info-card-desc">{copy.visionItems[2][1]}</p>
                        </div>
                    </div>
                </section>

                {/* 聯絡資訊 */}
                <section className="general-section">
                    <h2 className="section-title">{copy.contact}</h2>
                    <div className="contact-info info-panel">
                        <div className="contact-item">
                            <span className="contact-label">{copy.email}</span>
                            <a href="mailto:support@myntu.ntu.edu.tw" className="contact-link">support@myntu.ntu.edu.tw</a>
                        </div>
                        <div className="contact-item">
                            <span className="contact-label">{copy.location}</span>
                            <span className="contact-text">{copy.locationText}</span>
                        </div>
                        <div className="contact-item">
                            <span className="contact-label">{copy.feedback}</span>
                            <a href="#" className="contact-link">{copy.feedbackText}</a>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    )
}

export default About;