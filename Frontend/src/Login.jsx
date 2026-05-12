import Layout from "./Layout";
import { useEffect, useState } from "react";
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "./LanguageContext";

import "./login.css";

function Login()
{
    const { lang } = useLanguage();
    const [mode, setMode] = useState("login");
    const isRegister = mode === "register";

    const copy = lang === "en" ? {
        title: isRegister ? "Create Account" : "Log in",
        eyebrow: "MyNTU++ Account",
        heading: isRegister ? "Start your campus dashboard" : "Welcome back",
        intro: isRegister
            ? "Create a student account to personalize services, pinned links, and campus updates."
            : "Use your NTU account to continue to your personalized campus dashboard.",
        loginTab: "Log in",
        registerTab: "Register",
        email: "NTU Email",
        emailPlaceholder: "b12999999@ntu.edu.tw",
        password: "Password",
        passwordPlaceholder: "Enter password",
        confirmPassword: "Confirm Password",
        confirmPasswordPlaceholder: "Enter password again",
        remember: "Remember me",
        forgot: "Forgot password?",
        submit: isRegister ? "Create account" : "Log in",
        helper: isRegister ? "Already have an account?" : "New to MyNTU++?",
        switchMode: isRegister ? "Log in instead" : "Create an account",
        secure: "NTU SSO ready",
        sync: "Personalized shortcuts",
        alerts: "Campus updates",
    } : {
        title: isRegister ? "註冊帳號" : "登入系統",
        eyebrow: "MyNTU++ 帳號",
        heading: isRegister ? "建立你的校園儀表板" : "歡迎回來",
        intro: isRegister
            ? "建立學生帳號後，可個人化常用服務、釘選捷徑與校園通知。"
            : "使用臺大帳號登入，回到你的個人化校園儀表板。",
        loginTab: "登入",
        registerTab: "註冊",
        email: "臺大信箱",
        emailPlaceholder: "b12999999@ntu.edu.tw",
        password: "密碼",
        passwordPlaceholder: "請輸入密碼",
        confirmPassword: "確認密碼",
        confirmPasswordPlaceholder: "請再次輸入密碼",
        remember: "記住我",
        forgot: "忘記密碼？",
        submit: isRegister ? "建立帳號" : "登入",
        helper: isRegister ? "已經有帳號了？" : "還沒有 MyNTU++ 帳號？",
        switchMode: isRegister ? "改用登入" : "建立新帳號",
        secure: "支援 NTU SSO",
        sync: "個人化捷徑",
        alerts: "校園通知同步",
    };

    useEffect(() => {
        document.title = "MyNTU++ | " + copy.title;
    }, [copy.title]);

    const navigate = useNavigate();
    const auth = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (isRegister && password !== confirmPassword) {
            setError(lang === 'en' ? 'Passwords do not match' : '密碼不一致');
            return;
        }

        setLoading(true);
        const url = isRegister ? '/api/auth/register/' : '/api/auth/login/';
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password, name: copy.title === 'Create Account' ? '' : '' })
            });

            // Safely handle empty/non-JSON responses to avoid JSON parse errors
            let data = null;
            const text = await res.text();
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (err) {
                    console.error('Failed to parse JSON response', err, text);
                }
            }

            if (!res.ok) {
                setError((data && data.error) || text || 'Unexpected error');
                setLoading(false);
                return;
            }

            // update global auth state if available
            if (auth && auth.setUser) auth.setUser(data);

            // on success, redirect to home
            navigate('/');
        } catch (err) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout title={copy.title}>
            <div className="auth-page">
                <section className="auth-hero-panel">
                    <div className="auth-brand-group" aria-hidden="true">
                        <div className="auth-logo">
                            <span>🌴</span>
                            <span className="auth-logo-building">🏫</span>
                            <span>🌴</span>
                        </div>
                        <div className="auth-brand-wordmark">
                            <div className="auth-brand-title">MyNTU++</div>
                            <div className="auth-brand-subtitle">SINCE 1928</div>
                        </div>
                    </div>
                    <h1 className="auth-heading">{copy.heading}</h1>
                    <p className="auth-intro">{copy.intro}</p>
                    <div className="auth-feature-list">
                        <div className="auth-feature-item">
                            <span className="auth-feature-icon">✓</span>
                            {copy.secure}
                        </div>
                        <div className="auth-feature-item">
                            <span className="auth-feature-icon">✓</span>
                            {copy.sync}
                        </div>
                        <div className="auth-feature-item">
                            <span className="auth-feature-icon">✓</span>
                            {copy.alerts}
                        </div>
                    </div>
                </section>

                <section className="auth-card" aria-label={copy.title}>
                    <div className="auth-tabs" role="tablist" aria-label={copy.title}>
                        <button
                            type="button"
                            className={"auth-tab" + (!isRegister ? " active" : "")}
                            onClick={() => setMode("login")}
                        >
                            {copy.loginTab}
                        </button>
                        <button
                            type="button"
                            className={"auth-tab" + (isRegister ? " active" : "")}
                            onClick={() => setMode("register")}
                        >
                            {copy.registerTab}
                        </button>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="auth-label" htmlFor="ntu-email">{copy.email}</label>
                        <input
                            id="ntu-email"
                            className="auth-input"
                            type="email"
                            autoComplete="email"
                            placeholder={copy.emailPlaceholder}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <label className="auth-label" htmlFor="password">{copy.password}</label>
                        <input
                            id="password"
                            className="auth-input"
                            type="password"
                            autoComplete={isRegister ? "new-password" : "current-password"}
                            placeholder={copy.passwordPlaceholder}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {isRegister && (
                            <>
                                <label className="auth-label" htmlFor="confirm-password">{copy.confirmPassword}</label>
                                <input
                                    id="confirm-password"
                                    className="auth-input"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder={copy.confirmPasswordPlaceholder}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </>
                        )}

                        {!isRegister && (
                            <div className="auth-options">
                                <label className="auth-check">
                                    <input type="checkbox" />
                                    <span>{copy.remember}</span>
                                </label>
                                <a href="#" className="auth-link">{copy.forgot}</a>
                            </div>
                        )}

                        {error && <div className="auth-error">{error}</div>}
                        <button className="auth-submit" type="submit" disabled={loading}>{loading ? (lang==='en'?'Loading...':'載入中...') : copy.submit}</button>
                    </form>

                    <p className="auth-switch">
                        {copy.helper}
                        <button type="button" onClick={() => setMode(isRegister ? "login" : "register")}>
                            {copy.switchMode}
                        </button>
                    </p>
                </section>
            </div>
        </Layout>
    );
}

export default Login;
