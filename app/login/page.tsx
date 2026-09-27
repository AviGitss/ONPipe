"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowser();

    // Check allowlist first
    const { data: allowed } = await supabase
      .from("allowed_users")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (!allowed) {
      setError("This email is not authorised. Contact Sriram to request access.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
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

        {sent ? (
          <div style={styles.success}>
            <div style={styles.successIcon}>✉️</div>
            <h2 style={styles.successTitle}>Check your inbox</h2>
            <p style={styles.successText}>
              We sent a magic link to <strong>{email}</strong>.<br />
              Click it to sign in — no password needed.
            </p>
          </div>
        ) : (
          <>
            <h1 style={styles.heading}>Sign in</h1>
            <p style={styles.subheading}>
              Enter your email. We'll send you a one-click sign-in link.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
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

              {error && <p style={styles.error}>{error}</p>}

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  ...styles.btn,
                  opacity: loading || !email ? 0.6 : 1,
                  cursor: loading || !email ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Checking…" : "Send magic link"}
              </button>
            </form>
          </>
        )}

        <p style={styles.footer}>
          Access is restricted. Contact{" "}
          <a href="mailto:sskumar@opennetrikkan.com" style={styles.link}>
            sskumar@opennetrikkan.com
          </a>{" "}
          to request access.
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
  form:       { display: "flex", flexDirection: "column", gap: 12 },
  label:      { fontSize: 12, fontWeight: 600, color: "#3A2860", letterSpacing: "0.04em" },
  input: {
    padding: "10px 14px",
    border: "1.5px solid #DDD6F5",
    borderRadius: 8,
    fontSize: 14,
    color: "#1A1030",
    outline: "none",
    transition: "border-color 0.15s",
  },
  btn: {
    marginTop: 8,
    padding: "12px 0",
    background: "#4A2FA0",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    transition: "background 0.15s",
  },
  error: {
    background: "#FEE8E8",
    color: "#A32D2D",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 12,
    margin: 0,
  },
  success:      { textAlign: "center", padding: "12px 0" },
  successIcon:  { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: 700, color: "#1A1030", marginBottom: 8 },
  successText:  { fontSize: 13, color: "#6B5B9E", lineHeight: 1.6 },
  footer: { marginTop: 28, fontSize: 11, color: "#A98CE8", textAlign: "center" },
  link:   { color: "#4A2FA0", textDecoration: "none", fontWeight: 500 },
};
