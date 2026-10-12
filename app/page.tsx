"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0F0A1E",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "40px 32px",
          background: "#1A1235",
          borderRadius: 16,
          border: "1px solid #2D1B69",
        }}
      >
        {/* Logo mark */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #4A2FA0 0%, #7B5FC4 100%)",
              marginBottom: 16,
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            ON
          </div>
          <div style={{ color: "#C8B5F5", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Open Netrikkan
          </div>
          <div style={{ color: "#7B5FC4", fontSize: 11, letterSpacing: "0.08em", marginTop: 4 }}>
            Sales Pipeline · Internal
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", color: "#A98CE8", fontSize: 12, letterSpacing: "0.08em", marginBottom: 6 }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#0F0A1E",
                border: "1px solid #2D1B69",
                borderRadius: 8,
                color: "#F0EAFF",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#A98CE8", fontSize: 12, letterSpacing: "0.08em", marginBottom: 6 }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#0F0A1E",
                border: "1px solid #2D1B69",
                borderRadius: 8,
                color: "#F0EAFF",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{ color: "#F87171", fontSize: 13, textAlign: "center" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: "12px",
              background: loading ? "#2D1B69" : "linear-gradient(135deg, #4A2FA0 0%, #7B5FC4 100%)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
