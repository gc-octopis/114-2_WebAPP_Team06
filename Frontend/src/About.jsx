import Layout from "./Layout";
import Hero from "./Hero";

import './about.css';

import { useEffect } from "react";

function About()
{
    const title = "關於我們";
    useEffect(() => {
        document.title = "MyNTU++ | " + title;
    }, []);

    return (
        <Layout title={title}>
            <div className="content-width-limiter">
                <Hero />
                {/* 專案簡介 (加上乾淨的 class，不寫行內樣式) */}
                <section className="general-section">
                    <h2 className="section-title">專案簡介</h2>
                    <p>
                        MyNTU++ 是一個為國立臺灣大學學生打造的整合型服務平臺，致力於提升學生的校園生活體驗。我們將校內各項常用服務集中在一個介面上，讓同學輕鬆快速地完成學業相關的各項事務。
                    </p>
                    <p>
                        無論是課程選擇、場地借用、行事曆查詢或其他學生服務，MyNTU++ 都能提供一致且友善的使用體驗。
                    </p>
                </section>

                {/* 核心特色 */}
                <section className="general-section">
                    <h2 className="section-title">核心特色</h2>
                    <div className="cards-grid">
                        <div className="card-anchor-item">
                            <div className="card-icon-box">📚</div>
                            <span className="card-label">課程管理</span>
                        </div>
                        <div className="card-anchor-item">
                            <div className="card-icon-box">📋</div>
                            <span className="card-label">申請服務</span>
                        </div>
                        <div className="card-anchor-item">
                            <div className="card-icon-box">📅</div>
                            <span className="card-label">行事曆</span>
                        </div>
                        <div className="card-anchor-item">
                            <div className="card-icon-box">📢</div>
                            <span className="card-label">公告消息</span>
                        </div>
                        <div className="card-anchor-item">
                            <div className="card-icon-box">👤</div>
                            <span className="card-label">個人資料</span>
                        </div>
                        <div className="card-anchor-item">
                            <div className="card-icon-box">⚙️</div>
                            <span className="card-label">帳戶設定</span>
                        </div>
                    </div>
                </section>

                {/* 開發團隊 (套用新寫好的網格 class) */}
                <section className="general-section">
                    <h2 className="section-title">開發團隊</h2>
                    <div className="auto-grid">
                        <div className="info-card">
                            <div className="info-card-icon">👨‍💼</div>
                            <h3 className="info-card-title">專案經理</h3>
                            <p className="info-card-desc">負責專案規劃與進度管理</p>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">👩‍💻</div>
                            <h3 className="info-card-title">前端工程師</h3>
                            <p className="info-card-desc">負責使用者介面與互動設計</p>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">👨‍💻</div>
                            <h3 className="info-card-title">後端工程師</h3>
                            <p className="info-card-desc">負責伺服器與資料庫管理</p>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">🎨</div>
                            <h3 className="info-card-title">設計師</h3>
                            <p className="info-card-desc">負責視覺設計與使用者體驗</p>
                        </div>
                    </div>
                </section>

                {/* 我們的願景 (套用新寫好的卡片 class) */}
                <section className="general-section">
                    <h2 className="section-title">我們的願景</h2>
                    <div className="auto-grid">
                        <div className="info-card">
                            <div className="info-card-icon">1</div>
                            <h3 className="info-card-title">簡化流程</h3>
                            <p className="info-card-desc">整合分散的服務，減少學生的操作步驟</p>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">2</div>
                            <h3 className="info-card-title">提升體驗</h3>
                            <p className="info-card-desc">設計直覺友善的介面，提供流暢的使用體驗</p>
                        </div>
                        <div className="info-card">
                            <div className="info-card-icon">3</div>
                            <h3 className="info-card-title">持續創新</h3>
                            <p className="info-card-desc">不斷改進功能，把握學生需求</p>
                        </div>
                    </div>
                </section>

                {/* 聯絡資訊 */}
                <section className="general-section">
                    <h2 className="section-title">聯絡我們</h2>
                    <div className="contact-info info-panel">
                        <div className="contact-item">
                            <span className="contact-label">電子郵件：</span>
                            <a href="mailto:support@myntu.ntu.edu.tw" className="contact-link">support@myntu.ntu.edu.tw</a>
                        </div>
                        <div className="contact-item">
                            <span className="contact-label">位置：</span>
                            <span className="contact-text">國立臺灣大學</span>
                        </div>
                        <div className="contact-item">
                            <span className="contact-label">反饋表單：</span>
                            <a href="#" className="contact-link">提交建議</a>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    )
}

export default About;