"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const USERS = [
  "sskumar@opennetrikkan.com",
  "prithvi@opennetrikkan.com",
  "viewer@opennetrikkan.com",
  "planner@opennetrikkan.com",
  "planthead@opennetrikkan.com",
];

export default function AdminPage() {
  const sb = getSupabaseBrowser();
  const [authed, setAuthed] = useState(false);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user || user.email !== "sskumar@opennetrikkan.com") {
        window.location.href = "/";
        return;
      }
      setAuthed(true);
      setLoading(false);
    })();
  }, [sb]);

  async function setPassword(email: string) {
    const pw = passwords[email];
    if (!pw || pw.length < 6) {
      setStatus(s => ({ ...s, [email]: "Min 6 characters" }));
      return;
    }
    setStatus(s => ({ ...s, [email]: "Saving…" }));
    const res = await fetch("/api/admin/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pw }),
    });
    const json = await res.json();
    setStatus(s => ({ ...s, [email]: res.ok ? "✅ Password set" : `❌ ${json.error}` }));
    if (res.ok) setPasswords(p => ({ ...p, [email]: "" }));
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0F0A1E", color: "#4A2FA0", fontFamily: "sans-serif" }}>
      Loading…
    </div>
  );
  if (!authed) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#0F0A1E", padding: "40px 24px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: "#C8B5F5", fontSize: 20, fontWeight: 700, margin: 0 }}>User Password Manager</h1>
          <p style={{ color: "#7B5FC4", fontSize: 13, marginTop: 6 }}>Set passwords directly — no emails sent.</p>
        </div>
        {USERS.map(email => (
          <div key={email} style={{ background: "#1A1235", border: "1px solid #2D1B69", borderRadius: 12, padding: "16px 20px", marginBottom: 12 }}>
            <div style={{ color: "#A98CE8", fontSize: 13, marginBottom: 10 }}>{email}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                value={passwords[email] || ""}
                onChange={e => setPasswords(p => ({ ...p, [email]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && setPassword(email)}
                style={{ flex: 1, padding: "8px 12px", background: "#0F0A1E", border: "1px solid #2D1B69", borderRadius: 8, color: "#F0EAFF", fontSize: 13, outline: "none" }}
              />
              <button
                onClick={() => setPassword(email)}
                style={{ padding: "8px 16px", background: "linear-gradient(135deg, #4A2FA0 0%, #7B5FC4 100%)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Set Password
              </button>
            </div>
            {status[email] && (
              <div style={{ marginTop: 8, fontSize: 12, color: status[email].startsWith("✅") ? "#4ADE80" : status[email] === "Saving…" ? "#A98CE8" : "#F87171" }}>
                {status[email]}
              </div>
            )}
          </div>
        ))}
        <a href="/" style={{ display: "inline-block", marginTop: 16, color: "#7B5FC4", fontSize: 13, textDecoration: "none" }}>← Back to pipeline</a>
      </div>
    </div>
  );
}
