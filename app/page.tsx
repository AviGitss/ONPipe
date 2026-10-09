"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo / brand */}
        <div style={styles.brand}>
          <div style={styles.brandNum}>ON</div>
          <div>
            <div style={styles.brandTitle}>Open Netrikkan</div>
            <div style={styles.brandSub}>Sales Pipeline · Internal</div>
          </div>
        </div>

        <h1 style={styles.heading}>Sign in</h1>
        <p style={styles.subheading}>Enter your email and password to continue.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label} htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              autoComplete="email"
            />
          </div>
          <div>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              ...styles.btn,
              opacity: loading || !email || !password ? 0.6 : 1,
              cursor: loading || !email || !password ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={styles.footer}>
          Open Netrikkan · Sales Pipeline · Internal
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #2D1B69 0%, #4A2FA0 60%, #7B5FC4 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(45,27,105,0.35)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: "1px solid #EDE8FF",
  },
  brandNum: {
    width: 44, height: 44,
    background: "#2D1B69",
    borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#C8B5F5",
    fontWeight: 800, fontSize: 16,
    letterSpacing: 1,
  },
  brandTitle: { fontWeight: 700, fontSize: 16, color: "#2D1B69" },
  brandSub:   { fontSize: 12, color: "#A98CE8", marginTop: 2 },
  heading:    { fontSize: 22, fontWeight: 700, color: "#1A1030", marginBottom: 8 },
  subheading: { fontSize: 13, color: "#6B5B9E", marginBottom: 24, lineHeight: 1.5 },
  form:       { display: "flex", flexDirection: "column", gap: 16 },
  label:      { fontSize: 12, fontWeight: 600, color: "#3A2860", letterSpacing: "0.04em", display: "block", marginBottom: 6 },
  input: {
    padding: "10px 14px",
    border: "1.5px solid #DDD6F5",
    borderRadius: 8,
    fontSize: 14,
    color: "#1A1030",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  btn: {
    marginTop: 4,
    padding: "12px 0",
    background: "#4A2FA0",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    width: "100%",
  },
  error: {
    background: "#FEE8E8",
    color: "#A32D2D",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 12,
    margin: 0,
  },
  footer: { marginTop: 28, fontSize: 11, color: "#A98CE8", textAlign: "center" },
};
