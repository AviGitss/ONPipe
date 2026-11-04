"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { JDS, jdText, type JD } from "@/lib/jds";
import { TYPE_LABEL, type EmpType } from "@/lib/plans";

type Req = {
  id: number; req_code: string; client: string; role: string; jd_key: string; skills: string; emp_type: EmpType;
  openings: number; filled: number; needed_by: string | null; priority: "High" | "Medium" | "Low";
  status: string; hiring_owner: string; offer_status: string; offer_date: string | null; joining_date: string | null; notes: string;
};
type Src = { id: number; req_id: number; source: string; cvs_received: number; cvs_screened: number; shortlisted: number; interviewed: number };

const STATUSES = ["Planned", "Open", "Sourcing", "Interviewing", "Offered", "Joined", "On hold", "Closed"];
const ACTIVE = ["Open", "Sourcing", "Interviewing", "Offered"];
const OFFERS = ["None", "Offered", "Accepted", "Declined"];
const SOURCES = ["LinkedIn", "Naukri", "Referral", "Consultant / agency", "Campus", "UTS bench", "Partner", "Own network", "Other"];
const STATUS_COLOR: Record<string, [string, string]> = {
  Planned: ["#F2F2F2", "#555"], Open: ["#EDE8FF", "#4A2FA0"], Sourcing: ["#E6F0FF", "#1D4ED8"], Interviewing: ["#FFF3E0", "#9B5E00"],
  Offered: ["#FFF3C0", "#7A5C00"], Joined: ["#EAF5EA", "#1A6B1A"], "On hold": ["#FFF0E0", "#8B4500"], Closed: ["#FEE8E8", "#A32D2D"],
};

const fmt = (d: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");
const card: React.CSSProperties = { background: "#fff", border: "1.5px solid #DDD6F5", borderRadius: 10, padding: 14 };
const inp: React.CSSProperties = { padding: "6px 8px", border: "1.5px solid #DDD6F5", borderRadius: 6, fontSize: 12, color: "#1A1030", background: "#fff", minWidth: 0 };
const lab: React.CSSProperties = { fontSize: 10, color: "#6B5B9E", display: "block", marginBottom: 2 };
const btn = (primary = false): React.CSSProperties => ({ padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600,
  border: primary ? "none" : "1px solid #4A2FA0", background: primary ? "#4A2FA0" : "#fff", color: primary ? "#fff" : "#4A2FA0" });

function mailto(to: string, subject: string, body: string) {
  const max = 1700; // many mail apps cut very long links; the full text is also available to copy
  const b = body.length > max ? body.slice(0, max).replace(/\n[^\n]*$/, "") + "\n\n[Text shortened. Ask for the full JD.]" : body;
  return `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(b)}`;
}

export default function Requisitions({ canEdit }: { canEdit: boolean }) {
  const sb = getSupabaseBrowser();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [srcs, setSrcs] = useState<Src[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [fStatus, setFStatus] = useState("Active");
  const [fClient, setFClient] = useState("All");
  const [open, setOpen] = useState<number | null>(null);
  const [jdReq, setJdReq] = useState<Req | null>(null);
  const [to, setTo] = useState("");
  const [bulkTo, setBulkTo] = useState("");
  const [copied, setCopied] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ client: "", role: "", jd_key: Object.keys(JDS)[0], skills: "", emp_type: "P" as EmpType, openings: 1, needed_by: "" });

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      sb.from("requisitions").select("*").order("needed_by", { nullsFirst: false }).order("req_code"),
      sb.from("req_sources").select("*").order("id"),
    ]);
    if (a.error) setErr(a.error.message); else setReqs(a.data as Req[]);
    if (b.data) setSrcs(b.data as Src[]);
    setLoading(false);
  }, [sb]);
  useEffect(() => { load(); }, [load]);

  const totals = (id: number) => srcs.filter(s => s.req_id === id).reduce((t, s) => ({
    r: t.r + s.cvs_received, s: t.s + s.cvs_screened, l: t.l + s.shortlisted, i: t.i + s.interviewed }), { r: 0, s: 0, l: 0, i: 0 });

  async function patch(id: number, p: Partial<Req>) {
    setReqs(rs => rs.map(r => (r.id === id ? { ...r, ...p } : r)));
    const { error } = await sb.from("requisitions").update(p).eq("id", id);
    if (error) { setErr(error.message); load(); } else setErr("");
  }
  async function addSource(req_id: number) {
    const { error } = await sb.from("req_sources").insert({ req_id, source: "LinkedIn" });
    if (error) setErr(error.message); else load();
  }
  async function patchSource(id: number, p: Partial<Src>) {
    setSrcs(ss => ss.map(s => (s.id === id ? { ...s, ...p } : s)));
    const { error } = await sb.from("req_sources").update(p).eq("id", id);
    if (error) { setErr(error.message); load(); }
  }
  async function delSource(id: number) {
    const { error } = await sb.from("req_sources").delete().eq("id", id);
    if (error) setErr(error.message); else load();
  }
  async function addReq() {
    if (!form.client.trim() || !form.role.trim()) { setErr("Client and role are required."); return; }
    const next = reqs.reduce((m, r) => Math.max(m, parseInt(r.req_code.replace(/\D/g, "")) || 0), 0) + 1;
    const { error } = await sb.from("requisitions").insert({
      req_code: "REQ-" + String(next).padStart(3, "0"), client: form.client.trim(), role: form.role.trim(), jd_key: form.jd_key,
      skills: form.skills, emp_type: form.emp_type, openings: Number(form.openings) || 1, needed_by: form.needed_by || null, status: "Open" });
    if (error) { setErr(error.message); return; }
    setAdding(false); setErr(""); setForm({ ...form, client: "", role: "", skills: "", needed_by: "" }); load();
  }
  function copy(text: string, tag: string) {
    const done = () => { setCopied(tag); setTimeout(() => setCopied(""), 1500); };
    try { navigator.clipboard.writeText(text).then(done, done); } catch { done(); }
  }

  const clients = useMemo(() => ["All", ...Array.from(new Set(reqs.map(r => r.client)))], [reqs]);
  const shown = reqs.filter(r =>
    (fStatus === "All" || (fStatus === "Active" ? ACTIVE.includes(r.status) : r.status === fStatus)) && (fClient === "All" || r.client === fClient));

  const activeReqs = reqs.filter(r => ACTIVE.includes(r.status));
  const openPositions = activeReqs.reduce((s, r) => s + Math.max(0, r.openings - r.filled), 0);
  const cv = srcs.reduce((t, s) => ({ r: t.r + s.cvs_received, s: t.s + s.cvs_screened, l: t.l + s.shortlisted, i: t.i + s.interviewed }), { r: 0, s: 0, l: 0, i: 0 });
  const offersOut = reqs.filter(r => r.offer_status === "Offered").length;
  const joined = reqs.reduce((s, r) => s + r.filled, 0);
  const planned = reqs.filter(r => r.status === "Planned").length;

  const bulkText = () => {
    const L = ["Hello,", "", "These are our current openings at Open Netrikkan (UTS). Please send suitable CVs to sskumar@opennetrikkan.com with the job title in the subject.", ""];
    activeReqs.forEach(r => {
      const jd = JDS[r.jd_key];
      L.push(`- ${jd?.title ?? r.role} (${jd?.level ?? ""}), ${jd?.location ?? ""}, ${TYPE_LABEL[r.emp_type]}, ${Math.max(0, r.openings - r.filled)} opening(s), needed by ${fmt(r.needed_by)}`);
      if (r.skills) L.push(`  Skills: ${r.skills}`);
    });
    L.push("", "Full JDs are available on request.", "", "Regards,", "Sriram");
    return L.join("\n");
  };

  const pill = (s: string) => <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap", background: STATUS_COLOR[s]?.[0], color: STATUS_COLOR[s]?.[1] }}>{s}</span>;

  if (loading) return <div style={{ padding: 40, color: "#4A2FA0" }}>Loading requisitions…</div>;

  const jd: JD | undefined = jdReq ? JDS[jdReq.jd_key] : undefined;
  const jdBody = jdReq && jd ? jdText(jd, { client: jdReq.client, type: jdReq.emp_type, openings: Math.max(1, jdReq.openings - jdReq.filled), neededBy: jdReq.needed_by ? fmt(jdReq.needed_by) : null }) : "";

  return (
    <div style={{ padding: "24px 0 48px", display: "flex", flexDirection: "column", gap: 18 }}>
      {err && <div style={{ ...card, borderColor: "#A32D2D", color: "#A32D2D", fontSize: 12 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
        {[["Open positions", openPositions, `${activeReqs.length} requisitions`], ["Planned, not opened", planned, "waiting on a PO"],
          ["CVs received", cv.r, "all sources"], ["Screened", cv.s, ""], ["Shortlisted", cv.l, ""], ["Interviewed", cv.i, ""],
          ["Offers out", offersOut, ""], ["Joined", joined, "people"]].map(([l, v, n]) => (
          <div key={l as string} style={{ ...card, padding: 12 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "#A98CE8" }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#2D1B69", lineHeight: 1.2 }}>{v}</div>
            <div style={{ fontSize: 10, color: "#6B5B9E" }}>{n}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, background: "#F7F5FF", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div><label style={lab}>Status</label>
          <select style={inp} value={fStatus} onChange={e => setFStatus(e.target.value)}>
            {["Active", "All", ...STATUSES].map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label style={lab}>Client</label>
          <select style={inp} value={fClient} onChange={e => setFClient(e.target.value)}>{clients.map(c => <option key={c}>{c}</option>)}</select></div>
        <div style={{ flex: 1 }} />
        <div><label style={lab}>Email all active openings to</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input style={{ ...inp, width: 220 }} type="email" placeholder="recruiter@agency.com" value={bulkTo} onChange={e => setBulkTo(e.target.value)} />
            <a style={{ ...btn(true), textDecoration: "none", opacity: bulkTo.includes("@") ? 1 : 0.5, pointerEvents: bulkTo.includes("@") ? "auto" : "none" }}
              href={mailto(bulkTo, "Open positions at Open Netrikkan", bulkText())}>Email list</a>
            <button style={btn()} onClick={() => copy(bulkText(), "bulk")}>{copied === "bulk" ? "Copied" : "Copy"}</button>
          </div></div>
        {canEdit && <button style={btn(true)} onClick={() => setAdding(!adding)}>+ New requisition</button>}
      </div>

      {adding && canEdit && (
        <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, alignItems: "end" }}>
          <div><label style={lab}>Client</label><input style={{ ...inp, width: "100%" }} value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} /></div>
          <div><label style={lab}>Role</label><input style={{ ...inp, width: "100%" }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
          <div><label style={lab}>JD</label>
            <select style={{ ...inp, width: "100%" }} value={form.jd_key} onChange={e => setForm({ ...form, jd_key: e.target.value })}>
              {Object.entries(JDS).map(([k, j]) => <option key={k} value={k}>{j.title}</option>)}</select></div>
          <div><label style={lab}>Skills</label><input style={{ ...inp, width: "100%" }} value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} /></div>
          <div><label style={lab}>Type</label>
            <select style={{ ...inp, width: "100%" }} value={form.emp_type} onChange={e => setForm({ ...form, emp_type: e.target.value as EmpType })}>
              {(Object.keys(TYPE_LABEL) as EmpType[]).map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></div>
          <div><label style={lab}>Openings</label><input style={{ ...inp, width: "100%" }} type="number" min={1} value={form.openings} onChange={e => setForm({ ...form, openings: Number(e.target.value) })} /></div>
          <div><label style={lab}>Needed by</label><input style={{ ...inp, width: "100%" }} type="date" value={form.needed_by} onChange={e => setForm({ ...form, needed_by: e.target.value })} /></div>
          <button style={btn(true)} onClick={addReq}>Save</button>
        </div>
      )}

      <div style={{ ...card, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 1100 }}>
          <thead>
            <tr style={{ background: "#4A2FA0" }}>
              {["Req", "Client", "Role and skills", "Type", "Filled", "Needed by", "Status", "CVs rec / scr / short / int", "Sources", "Offer", "Joining", ""].map(h =>
                <th key={h} style={{ padding: "8px 10px", color: "#fff", fontSize: 11, fontWeight: 600, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={12} style={{ padding: 16, color: "#A98CE8" }}>No requisitions match this filter.</td></tr>}
            {shown.map((r, k) => {
              const t = totals(r.id);
              const mine = srcs.filter(s => s.req_id === r.id);
              const isOpen = open === r.id;
              return [
                <tr key={r.id} onClick={() => setOpen(isOpen ? null : r.id)} style={{ background: k % 2 ? "#fff" : "#F7F5FF", cursor: "pointer", borderBottom: "1px solid #EDE8FF" }}>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", fontWeight: 600, color: "#2D1B69" }}>{r.req_code}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{r.client}</td>
                  <td style={{ padding: "8px 10px", minWidth: 240 }}><b style={{ color: "#2D1B69" }}>{r.role}</b>
                    <div style={{ fontSize: 11, color: "#6B5B9E" }}>{r.skills}</div></td>
                  <td style={{ padding: "8px 10px" }} title={TYPE_LABEL[r.emp_type]}>{r.emp_type}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{r.filled} / {r.openings}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{fmt(r.needed_by)}</td>
                  <td style={{ padding: "8px 10px" }}>{pill(r.status)}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{t.r} / {t.s} / {t.l} / {t.i}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#6B5B9E" }}>{mine.length ? mine.map(s => `${s.source} ${s.cvs_received}`).join(", ") : "-"}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{r.offer_status === "None" ? "-" : `${r.offer_status}${r.offer_date ? ", " + fmt(r.offer_date) : ""}`}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{fmt(r.joining_date)}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                    <button style={btn()} onClick={() => { setJdReq(r); setTo(""); }}>JD / Email</button></td>
                </tr>,
                isOpen && (
                  <tr key={r.id + "d"} style={{ background: "#fff", borderBottom: "2px solid #DDD6F5" }}>
                    <td colSpan={12} style={{ padding: 14 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
                        <div><label style={lab}>Status</label><select style={{ ...inp, width: "100%" }} disabled={!canEdit} value={r.status} onChange={e => patch(r.id, { status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><label style={lab}>Priority</label><select style={{ ...inp, width: "100%" }} disabled={!canEdit} value={r.priority} onChange={e => patch(r.id, { priority: e.target.value as Req["priority"] })}>{["High", "Medium", "Low"].map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><label style={lab}>Openings</label><input style={{ ...inp, width: "100%" }} type="number" min={0} disabled={!canEdit} value={r.openings} onChange={e => patch(r.id, { openings: Number(e.target.value) })} /></div>
                        <div><label style={lab}>Filled (joined)</label><input style={{ ...inp, width: "100%" }} type="number" min={0} disabled={!canEdit} value={r.filled} onChange={e => patch(r.id, { filled: Number(e.target.value) })} /></div>
                        <div><label style={lab}>Needed by</label><input style={{ ...inp, width: "100%" }} type="date" disabled={!canEdit} value={r.needed_by ?? ""} onChange={e => patch(r.id, { needed_by: e.target.value || null })} /></div>
                        <div><label style={lab}>Hiring owner</label><input style={{ ...inp, width: "100%" }} disabled={!canEdit} value={r.hiring_owner} onChange={e => setReqs(rs => rs.map(x => x.id === r.id ? { ...x, hiring_owner: e.target.value } : x))} onBlur={e => patch(r.id, { hiring_owner: e.target.value })} /></div>
                        <div><label style={lab}>Offer status</label><select style={{ ...inp, width: "100%" }} disabled={!canEdit} value={r.offer_status} onChange={e => patch(r.id, { offer_status: e.target.value })}>{OFFERS.map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><label style={lab}>Offer date</label><input style={{ ...inp, width: "100%" }} type="date" disabled={!canEdit} value={r.offer_date ?? ""} onChange={e => patch(r.id, { offer_date: e.target.value || null })} /></div>
                        <div><label style={lab}>Joining date</label><input style={{ ...inp, width: "100%" }} type="date" disabled={!canEdit} value={r.joining_date ?? ""} onChange={e => patch(r.id, { joining_date: e.target.value || null })} /></div>
                      </div>
                      <label style={lab}>Notes</label>
                      <input style={{ ...inp, width: "100%", marginBottom: 14 }} disabled={!canEdit} value={r.notes}
                        onChange={e => setReqs(rs => rs.map(x => x.id === r.id ? { ...x, notes: e.target.value } : x))} onBlur={e => patch(r.id, { notes: e.target.value })} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#2D1B69", marginBottom: 6 }}>CV sources</div>
                      <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
                        <thead><tr>{["Source", "Received", "Screened", "Shortlisted", "Interviewed", ""].map(h => <th key={h} style={{ ...lab, textAlign: "left", padding: "2px 8px 2px 0" }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {mine.map(s => (
                            <tr key={s.id}>
                              <td style={{ paddingRight: 8 }}><input style={{ ...inp, width: 170 }} list="cv-sources" disabled={!canEdit} value={s.source} onChange={e => setSrcs(ss => ss.map(x => x.id === s.id ? { ...x, source: e.target.value } : x))} onBlur={e => patchSource(s.id, { source: e.target.value })} /></td>
                              {(["cvs_received", "cvs_screened", "shortlisted", "interviewed"] as const).map(f => (
                                <td key={f} style={{ paddingRight: 8 }}><input style={{ ...inp, width: 80 }} type="number" min={0} disabled={!canEdit} value={s[f]} onChange={e => patchSource(s.id, { [f]: Number(e.target.value) })} /></td>))}
                              <td>{canEdit && <button style={{ ...btn(), borderColor: "#A32D2D", color: "#A32D2D" }} onClick={() => delSource(s.id)}>Remove</button>}</td>
                            </tr>))}
                          {mine.length === 0 && <tr><td colSpan={6} style={{ fontSize: 11, color: "#A98CE8" }}>No CVs logged yet.</td></tr>}
                        </tbody>
                      </table>
                      {canEdit && <button style={{ ...btn(), marginTop: 8 }} onClick={() => addSource(r.id)}>+ Add source</button>}
                      <datalist id="cv-sources">{SOURCES.map(s => <option key={s} value={s} />)}</datalist>
                    </td>
                  </tr>),
              ];
            })}
          </tbody>
        </table>
      </div>
      {!canEdit && <p style={{ fontSize: 11, color: "#A98CE8" }}>View only. Editors can change requisitions.</p>}

      {jdReq && jd && (
        <div role="dialog" aria-modal="true" onClick={() => setJdReq(null)} style={{ position: "fixed", inset: 0, background: "rgba(26,16,48,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ ...card, width: "min(720px,100%)", maxHeight: "90vh", overflowY: "auto", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div><div style={{ fontSize: 11, color: "#A98CE8" }}>{jdReq.req_code} · {jdReq.client}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#2D1B69" }}>{jd.title}</div></div>
              <button style={btn()} onClick={() => setJdReq(null)}>Close</button>
            </div>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 12, lineHeight: 1.55, background: "#F7F5FF", borderRadius: 8, padding: 12, margin: "0 0 12px" }}>{jdBody}</pre>
            <label style={lab}>Email this JD to</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input style={{ ...inp, flex: 1, minWidth: 200 }} type="email" placeholder="name@company.com" value={to} onChange={e => setTo(e.target.value)} />
              <a style={{ ...btn(true), textDecoration: "none", opacity: to.includes("@") ? 1 : 0.5, pointerEvents: to.includes("@") ? "auto" : "none" }}
                href={mailto(to, `Opening: ${jd.title}${jdReq.client ? " (" + jdReq.client + ")" : ""}`, `Hello,\n\nWe are hiring for the role below. Please share suitable CVs.\n\n${jdBody}\n\nRegards,\nSriram`)}>Open in email app</a>
              <button style={btn()} onClick={() => copy(jdBody, "jd")}>{copied === "jd" ? "Copied" : "Copy JD"}</button>
            </div>
            <p style={{ fontSize: 10, color: "#A98CE8", marginTop: 6 }}>Opens your email app with the JD filled in. Long JDs may be shortened in the email; use Copy JD to paste the full text.</p>
          </div>
        </div>
      )}
    </div>
  );
}
