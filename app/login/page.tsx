"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (authError) {
      setError("Invalid email or password.");
    } else {
      window.location.href = "/";
    }
    setLoading(false);
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      { redirectTo: `${window.location.origin}/auth/reset` }
    );
    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
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

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #4A2FA0 0%, #7B5FC4 100%)", marginBottom: 16, fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>ON</div>
          <div style={{ color: "#C8B5F5", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}>Open Netrikkan</div>
          <div style={{ color: "#7B5FC4", fontSize: 11, letterSpacing: "0.08em", marginTop: 4 }}>Sales Pipeline · Internal</div>
        </div>

        {/* Forgot password — success state */}
        {mode === "forgot" && resetSent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
            <div style={{ color: "#C8B5F5", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Check your email</div>
            <div style={{ color: "#7B5FC4", fontSize: 13, marginBottom: 24 }}>
              A password reset link has been sent to <strong style={{ color: "#A98CE8" }}>{email}</strong>
            </div>
            <button onClick={() => { setMode("login"); setResetSent(false); }}
              style={{ color: "#A98CE8", background: "none", border: "none", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              Back to sign in
            </button>
          </div>

        ) : mode === "forgot" ? (
          /* Forgot password form */
          <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ color: "#C8B5F5", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Reset your password</div>
            <div style={{ color: "#7B5FC4", fontSize: 12, marginBottom: 4 }}>Enter your email and we'll send a reset link.</div>
            <div>
              <label style={{ display: "block", color: "#A98CE8", fontSize: 12, letterSpacing: "0.08em", marginBottom: 6 }}>EMAIL</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} />
            </div>
            {error && <div style={{ color: "#F87171", fontSize: 13, textAlign: "center" }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ marginTop: 4, padding: "12px", background: loading ? "#2D1B69" : "linear-gradient(135deg, #4A2FA0 0%, #7B5FC4 100%)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <button type="button" onClick={() => { setMode("login"); setError(""); }}
              style={{ color: "#7B5FC4", background: "none", border: "none", fontSize: 13, cursor: "pointer", marginTop: 4 }}>
              ← Back to sign in
            </button>
          </form>

        ) : (
          /* Login form */
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", color: "#A98CE8", fontSize: 12, letterSpacing: "0.08em", marginBottom: 6 }}>EMAIL</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ color: "#A98CE8", fontSize: 12, letterSpacing: "0.08em" }}>PASSWORD</label>
                <button type="button" onClick={() => { setMode("forgot"); setError(""); }}
                  style={{ color: "#7B5FC4", background: "none", border: "none", fontSize: 12, cursor: "pointer", padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
            </div>
            {error && <div style={{ color: "#F87171", fontSize: 13, textAlign: "center" }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ marginTop: 8, padding: "12px", background: loading ? "#2D1B69" : "linear-gradient(135deg, #4A2FA0 0%, #7B5FC4 100%)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, letterSpacing: "0.04em", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
