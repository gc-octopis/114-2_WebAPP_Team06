import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";

function Settings() {
  const { lang } = useLanguage();
  const auth = useAuth();
  const navigate = useNavigate();
  const authApiBase = import.meta.env.VITE_AUTH_API_BASE || "";

  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const title = lang === "en" ? "Account Settings" : "個人帳號設定";

  useEffect(() => {
    document.title = `MyNTU++ | ${title}`;
  }, [title]);

  useEffect(() => {
    if (!auth?.user) {
      navigate("/login");
      return;
    }
    setNickname(auth.user.name || "");
  }, [auth?.user?.id]);

  async function save(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!auth?.user) {
      navigate("/login");
      return;
    }

    setSaving(true);
    try {
      let res = await fetch(`${authApiBase}/api/auth/profile/`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nickname }),
      });
      let data = await res.json().catch(() => ({}));
      // If PATCH isn't supported server-side, try POST as a fallback
      if (!res.ok) {
        if (res.status === 404 || res.status === 405 || res.status >= 500) {
          res = await fetch(`${authApiBase}/api/auth/profile/`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nickname }),
          });
          data = await res.json().catch(() => ({}));
        }
      }
      if (!res.ok) {
        throw new Error(data?.error || `API error: ${res.status}`);
      }
      if (auth?.setUser) auth.setUser(data);
      setSuccess(lang === "en" ? "Saved." : "已儲存");
    } catch (err) {
      setError(err?.message || (lang === "en" ? "Save failed" : "儲存失敗"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title={title}>
      <div className="content-width-limiter">
        <section className="announcement-section">
          <h2 className="section-title">{title}</h2>
          <form className="feedback-form" onSubmit={save}>
            <label className="feedback-label" htmlFor="nickname">
              {lang === "en" ? "Nickname" : "暱稱"}
            </label>
            <input
              id="nickname"
              type="text"
              className="feedback-input"
              maxLength={150}
              placeholder={lang === "en" ? "e.g. Alex" : "例如：小明"}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />

            {error && <p className="feedback-status feedback-status--error">{error}</p>}
            {success && <p className="feedback-status feedback-status--success">{success}</p>}

            <button type="submit" className="feedback-submit-btn" disabled={saving}>
              {saving ? (lang === "en" ? "Saving..." : "儲存中...") : (lang === "en" ? "Save" : "儲存")}
            </button>
          </form>
        </section>
      </div>
    </Layout>
  );
}

export default Settings;
