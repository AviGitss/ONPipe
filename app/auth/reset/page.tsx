"use client";
import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the session in the URL hash after redirect
    const supabase = getSupabaseBrowser();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
      setTimeout(() => { window.location.href = "/"; }, 2000);
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: "#0F0A1E",
    border: "1px solid #2D1B69", borderRadius: 8, color: "#F0EAFF",
    fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F0A1E", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "40px 32px", background: "#1A1235", borderRadius: 16, border: "1px solid #2D1B69" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #4A2FA0 0%, #7B5FC4 100%)", marginBottom: 16, fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>ON</div>
          <div style={{ color: "#C8B5F5", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}>Open Netrikkan</div>
        </div>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ color: "#4ADE80", fontSize: 15, fontWeight: 600 }}>Password updated!</div>
            <div style={{ color: "#7B5FC4", fontSize: 13, marginTop: 8 }}>Redirecting you to the pipeline…</div>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: "center", color: "#7B5FC4", fontSize: 14 }}>
            Verifying reset link…
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ color: "#C8B5F5", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Set new password</div>
            <div>
              <label style={{ display: "block", color: "#A98CE8", fontSize: 12, letterSpacing: "0.08em", marginBottom: 6 }}>NEW PASSWORD</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", color: "#A98CE8", fontSize: 12, letterSpacing: "0.08em", marginBottom: 6 }}>CONFIRM PASSWORD</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Repeat password" style={inputStyle} />
            </div>
            {error && <div style={{ color: "#F87171", fontSize: 13, textAlign: "center" }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ marginTop: 8, padding: "12px", background: loading ? "#2D1B69" : "linear-gradient(135deg, #4A2FA0 0%, #7B5FC4 100%)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
