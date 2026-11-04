"use client";

import { useState } from "react";
import type { PipelineRow } from "@/lib/supabase";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Status = NonNullable<PipelineRow["proposal_status"]>;
const STATUSES: Status[] = ["Contract pending", "Won", "Submitted", "In preparation", "Lost"];
const STATUS_STYLE: Record<Status, [string, string]> = {
  "Contract pending": ["#FFF3C0", "#7A5C00"], Won: ["#EAF5EA", "#1A6B1A"], Submitted: ["#EDE8FF", "#4A2FA0"],
  "In preparation": ["#FFF3E0", "#9B5E00"], Lost: ["#FEE8E8", "#A32D2D"],
};
const MAX_WORDS = 50;
const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const monthYear = (d: string | null | undefined) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "");
const inp: React.CSSProperties = { padding: "6px 8px", border: "1.5px solid #DDD6F5", borderRadius: 6, fontSize: 12, color: "#1A1030", background: "#fff", minWidth: 0 };
const lab: React.CSSProperties = { fontSize: 10, color: "#6B5B9E", display: "block", marginBottom: 2 };

function Logo({ name, domain }: { name: string; domain?: string | null }) {
  const [bad, setBad] = useState(false);
  const initials = name.replace(/[^A-Za-z ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  const box: React.CSSProperties = { width: 40, height: 40, borderRadius: 8, border: "1px solid #DDD6F5", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", overflow: "hidden" };
  if (!domain || bad) return <div style={{ ...box, background: "#EDE8FF", color: "#4A2FA0", fontWeight: 700, fontSize: 13 }} title={domain ? "Logo not found" : "Add a website to show the logo"}>{initials}</div>;
  return (
    <div style={box}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`} alt={`${name} logo`} width={32} height={32} onError={() => setBad(true)} style={{ objectFit: "contain" }} />
    </div>
  );
}

export default function Proposals({ rows, canEdit, onChanged }: { rows: PipelineRow[]; canEdit?: boolean; onChanged?: () => Promise<void> }) {
  const sb = getSupabaseBrowser();
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ status: Status; win: string; summary: string; domain: string }>({ status: "Submitted", win: "", summary: "", domain: "" });
  const [adding, setAdding] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const list = rows.filter(r => r.proposal_status)
    .sort((a, b) => STATUSES.indexOf(a.proposal_status as Status) - STATUSES.indexOf(b.proposal_status as Status) || b.confidence - a.confidence);
  const candidates = rows.filter(r => !r.proposal_status && r.stage !== "Lost");
  const live = list.filter(r => r.proposal_status !== "Lost");
  const size = live.reduce((s, r) => s + (Number(r.deal_value) || 0), 0);
  const weighted = live.reduce((s, r) => s + (Number(r.deal_value) || 0) * (r.confidence / 100), 0);
  const today = new Date().toISOString().slice(0, 10);

  function startEdit(r: PipelineRow) {
    setEditId(r.id); setErr("");
    setDraft({ status: (r.proposal_status as Status) ?? "Submitted", win: r.likely_win_date ?? "", summary: r.proposal_summary ?? "", domain: r.logo_domain ?? "" });
  }
  async function save(id: number) {
    if (words(draft.summary) > MAX_WORDS) { setErr(`Description is ${words(draft.summary)} words. Keep it to ${MAX_WORDS} or fewer.`); return; }
    setSaving(true);
    const { error } = await sb.from("pipeline").update({
      proposal_status: draft.status, likely_win_date: draft.win || null, proposal_summary: draft.summary.trim() || null,
      logo_domain: draft.domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null }).eq("id", id);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setEditId(null); setErr(""); if (onChanged) await onChanged();
  }
  async function addProposal() {
    const id = Number(adding); if (!id) return;
    const { error } = await sb.from("pipeline").update({ proposal_status: "In preparation" }).eq("id", id);
    if (error) { setErr(error.message); return; }
    setAdding(""); if (onChanged) await onChanged(); startEdit({ ...(rows.find(r => r.id === id) as PipelineRow), proposal_status: "In preparation" });
  }

  const th: React.CSSProperties = { padding: "8px 10px", color: "#fff", fontSize: 11, fontWeight: 600, textAlign: "left", whiteSpace: "nowrap" };
  return (
    <div style={{ background: "#fff", border: "1.5px solid #DDD6F5", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1B69" }}>Proposals</div>
          <div style={{ fontSize: 11, color: "#6B5B9E" }}>{live.length} live proposals · Rs {size.toFixed(2)} Cr in total · Rs {weighted.toFixed(2)} Cr weighted. Size and confidence come from the pipeline.</div>
        </div>
        {canEdit && candidates.length > 0 && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select style={{ ...inp, maxWidth: 220 }} value={adding} onChange={e => setAdding(e.target.value)} aria-label="Add a pipeline deal as a proposal">
              <option value="">Add a deal as a proposal…</option>
              {candidates.map(c => <option key={c.id} value={c.id}>{c.prospect}</option>)}
            </select>
            <button disabled={!adding} onClick={addProposal} style={{ padding: "6px 12px", background: "#4A2FA0", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: adding ? 1 : 0.5 }}>Add</button>
          </div>
        )}
      </div>
      {err && <div style={{ fontSize: 12, color: "#A32D2D", marginBottom: 8 }}>{err}</div>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 860 }}>
          <thead>
            <tr style={{ background: "#4A2FA0" }}>
              {["Company", "Status", "Proposal size", "Likely win", "Confidence", "Proposal", canEdit ? "" : null].filter(h => h !== null).map(h => <th key={h as string} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={7} style={{ padding: 14, color: "#A98CE8" }}>No proposals marked yet.</td></tr>}
            {list.map((r, k) => {
              const st = r.proposal_status as Status;
              const overdue = r.likely_win_date && r.likely_win_date < today && st !== "Won" && st !== "Lost";
              const editing = editId === r.id;
              return [
                <tr key={r.id} style={{ background: k % 2 ? "#fff" : "#F7F5FF", borderBottom: "1px solid #EDE8FF", opacity: st === "Lost" ? 0.6 : 1 }}>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 170 }}>
                      <Logo name={r.prospect} domain={r.logo_domain} />
                      <b style={{ color: "#2D1B69" }}>{r.prospect}</b>
                    </div>
                  </td>
                  <td style={{ padding: "8px 10px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap", background: STATUS_STYLE[st][0], color: STATUS_STYLE[st][1] }}>{st}</span></td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{Number(r.deal_value) > 0 ? `Rs ${Number(r.deal_value).toFixed(2)} Cr` : "-"}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    {r.likely_win_date ? <>{monthYear(r.likely_win_date)}{overdue && <span style={{ marginLeft: 6, fontSize: 10, color: "#A32D2D", fontWeight: 700 }}>overdue</span>}</>
                      : <span style={{ color: "#A98CE8" }}>{st === "Won" ? "Won" : st === "Lost" ? "-" : "Not set"}</span>}
                  </td>
                  <td style={{ padding: "8px 10px", minWidth: 110 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ height: 8, background: "#DDD6F5", borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${r.confidence}%`, height: "100%", background: r.confidence >= 75 ? "#1A6B1A" : r.confidence >= 50 ? "#4A2FA0" : r.confidence >= 25 ? "#9B5E00" : "#BBBBBB" }} /></div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6B5B9E" }}>{r.confidence}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "8px 10px", color: "#1A1030", lineHeight: 1.45, minWidth: 280 }}>{r.proposal_summary || <span style={{ color: "#A98CE8" }}>No description yet.</span>}</td>
                  {canEdit && <td style={{ padding: "8px 10px" }}><button onClick={() => (editing ? setEditId(null) : startEdit(r))} style={{ padding: "4px 10px", background: "#EDE8FF", color: "#4A2FA0", border: "none", borderRadius: 5, fontSize: 12, cursor: "pointer" }}>{editing ? "Close" : "Edit"}</button></td>}
                </tr>,
                editing && (
                  <tr key={r.id + "e"} style={{ background: "#fff", borderBottom: "2px solid #DDD6F5" }}>
                    <td colSpan={7} style={{ padding: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, alignItems: "end" }}>
                        <div><label style={lab}>Status</label><select style={{ ...inp, width: "100%" }} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Status })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><label style={lab}>Likely win date</label><input style={{ ...inp, width: "100%" }} type="date" value={draft.win} onChange={e => setDraft({ ...draft, win: e.target.value })} /></div>
                        <div><label style={lab}>Company website, for the logo</label><input style={{ ...inp, width: "100%" }} placeholder="example.com" value={draft.domain} onChange={e => setDraft({ ...draft, domain: e.target.value })} /></div>
                      </div>
                      <label style={{ ...lab, marginTop: 10 }}>Proposal description <span style={{ color: words(draft.summary) > MAX_WORDS ? "#A32D2D" : "#A98CE8" }}>({words(draft.summary)}/{MAX_WORDS} words)</span></label>
                      <textarea style={{ ...inp, width: "100%", minHeight: 64, resize: "vertical", fontFamily: "inherit" }} value={draft.summary} onChange={e => setDraft({ ...draft, summary: e.target.value })} />
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button disabled={saving} onClick={() => save(r.id)} style={{ padding: "6px 16px", background: "#4A2FA0", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving…" : "Save"}</button>
                        <button onClick={() => setEditId(null)} style={{ padding: "6px 14px", background: "#EDE8FF", color: "#4A2FA0", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                      </div>
                    </td>
                  </tr>),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
