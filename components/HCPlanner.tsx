"use client";

import { useMemo, useState } from "react";
import type { PipelineRow } from "@/lib/supabase";
import { MONTHS, PLANS, TYPE_LABEL, type EmpType } from "@/lib/plans";

/**
 * HC and skills required by client and month, driven by the live pipeline.
 * Planned roles come from lib/plans.ts. A pipeline deal with no plan falls back to a
 * rule of thumb (editable on screen) so a new project always shows up.
 */

const STAGE_MONTHS: Record<string, number> = { Won: 0, Hot: 1, Active: 2, Warm: 3, Early: 5, New: 6, Stalled: 8, Lost: 99 };

type Line = { role: string; skills: string; type: EmpType | "E"; adds: number[] };
type Client = { id: string; label: string; stage: string; confidence: number; value: number; lines: Line[]; cum: number[]; core: boolean };

const cumulative = (a: number[]) => { let t = 0; return a.map(x => (t += x)); };
const pad = (a: number[]) => { const r = a.slice(0, 10); while (r.length < 10) r.push(0); return r; };
const f1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);

export default function HCPlanner({ rows }: { rows: PipelineRow[] }) {
  const [thr, setThr] = useState(90);
  const [perCr, setPerCr] = useState(2);
  const [startIdx, setStartIdx] = useState(2);

  const { clients, skipped } = useMemo(() => {
    const live = rows.filter(r => r.stage !== "Lost");
    const used = new Set<number>();
    const out: Client[] = [];
    PLANS.forEach(p => {
      const matched = p.match ? live.filter(r => p.match!.test(r.prospect)) : [];
      matched.forEach(r => used.add(r.id));
      if (p.match && !matched.length) return;
      const best = matched.length ? matched.reduce((a, b) => (b.confidence > a.confidence ? b : a)) : null;
      const lines = p.roles.map(r => ({ role: r.role, skills: r.skills, type: r.type as EmpType, adds: pad(r.adds) }));
      const tot = MONTHS.map((_, m) => lines.reduce((s, l) => s + l.adds[m], 0));
      out.push({ id: p.key, label: p.label, stage: best ? best.stage : "Plan", confidence: best ? best.confidence : 100,
        value: matched.length ? Math.max(...matched.map(r => Number(r.deal_value) || 0)) : 0, lines, cum: cumulative(tot), core: !p.match });
    });
    const skip: string[] = [];
    live.filter(r => !used.has(r.id)).forEach(r => {
      const v = Number(r.deal_value) || 0;
      if (v <= 0) { skip.push(r.prospect); return; }
      const n = Math.max(1, Math.ceil(v * perCr));
      const adds = MONTHS.map((_, m) => (m === startIdx ? n : 0));
      out.push({ id: "row-" + r.id, label: r.prospect, stage: r.stage, confidence: r.confidence, value: v,
        lines: [{ role: "Delivery team (estimate)", skills: `${perCr} people per Rs Cr of deal value, no role plan yet`, type: "E", adds }],
        cum: cumulative(adds), core: false });
    });
    return { clients: out, skipped: skip };
  }, [rows, perCr, startIdx]);

  const full = MONTHS.map((_, m) => clients.reduce((s, c) => s + c.cum[m], 0));
  const exp = MONTHS.map((_, m) => clients.reduce((s, c) => s + (c.cum[m] * c.confidence) / 100, 0));
  const com = MONTHS.map((_, m) => clients.reduce((s, c) => s + (c.confidence >= thr || c.core ? c.cum[m] : 0), 0));
  const perMonth = (arr: number[]) => arr.map((v, m) => v - (m ? arr[m - 1] : 0));

  const card: React.CSSProperties = { background: "#fff", border: "1.5px solid #DDD6F5", borderRadius: 10, padding: 16 };
  const inp: React.CSSProperties = { width: 64, padding: "5px 8px", border: "1.5px solid #DDD6F5", borderRadius: 6, fontSize: 12 };
  const th: React.CSSProperties = { padding: "8px 10px", color: "#fff", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", textAlign: "right" };
  const td: React.CSSProperties = { padding: "6px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" };

  // chart
  const W = 900, H = 240, L = 34, R = 10, T = 16, B = 28;
  const mx = Math.max(8, Math.ceil(Math.max(...full, 1) / 4) * 4);
  const bw = (W - L - R) / 10, iw = bw * 0.5;
  const y = (v: number) => T + (H - T - B) * (1 - v / mx);

  return (
    <div style={{ padding: "24px 0 48px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ ...card, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", background: "#F7F5FF", padding: 12 }}>
        <label style={{ fontSize: 12, color: "#6B5B9E" }}>Committed at or above{" "}
          <input style={inp} type="number" min={0} max={100} step={5} value={thr} onChange={e => setThr(Number(e.target.value) || 0)} /> %</label>
        <label style={{ fontSize: 12, color: "#6B5B9E" }}>Deals with no role plan: people per Rs Cr{" "}
          <input style={inp} type="number" min={0} step={0.5} value={perCr} onChange={e => setPerCr(Number(e.target.value) || 0)} /></label>
        <label style={{ fontSize: 12, color: "#6B5B9E" }}>starting{" "}
          <select style={{ ...inp, width: 96 }} value={startIdx} onChange={e => setStartIdx(Number(e.target.value))}>
            {MONTHS.map((m, k) => <option key={m} value={k}>{m}</option>)}
          </select></label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        {[["Hire against now", f1(com[9]), `people on deals at or above ${thr}%`, true],
          ["Expected by Aug-27", f1(exp[9]), "confidence-weighted", false],
          ["Full plan by Aug-27", String(full[9]), "if every deal lands", false]].map(([l, v, n, hi]) => (
          <div key={l as string} style={{ ...card, padding: 14, background: hi ? "#2D1B69" : "#fff", borderColor: hi ? "#2D1B69" : "#DDD6F5" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: hi ? "#C8B5F5" : "#A98CE8" }}>{l}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: hi ? "#fff" : "#2D1B69", lineHeight: 1.2 }}>{v}</div>
            <div style={{ fontSize: 11, color: hi ? "#C8B5F5" : "#6B5B9E" }}>{n}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1B69", marginBottom: 6 }}>New headcount needed, cumulative</div>
        <div style={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 560, display: "block" }} role="img" aria-label="Cumulative new headcount by month">
            {[0, 1, 2, 3, 4].map(k => { const g = (mx / 4) * k; return <g key={k}><line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#EDE8FF" /><text x={L - 6} y={y(g) + 4} textAnchor="end" fontSize={11} fill="#6B5B9E">{g}</text></g>; })}
            {MONTHS.map((mo, m) => {
              const x = L + m * bw + (bw - iw) / 2;
              return (
                <g key={mo}>
                  <rect x={x} y={y(exp[m])} width={iw} height={Math.max(0, y(0) - y(exp[m]))} fill="#7B5FC4"><title>{`Expected: ${f1(exp[m])}`}</title></rect>
                  <line x1={x - 5} x2={x + iw + 5} y1={y(full[m])} y2={y(full[m])} stroke="#1A1030" strokeWidth={2} strokeDasharray="4 3"><title>{`Full plan: ${full[m]}`}</title></line>
                  <line x1={x - 5} x2={x + iw + 5} y1={y(com[m])} y2={y(com[m])} stroke="#F0C040" strokeWidth={3}><title>{`Committed: ${com[m]}`}</title></line>
                  <text x={x + iw / 2} y={y(Math.max(exp[m], full[m])) - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#2D1B69">{f1(exp[m])}</text>
                  <text x={x + iw / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="#6B5B9E">{mo}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginTop: 6, fontSize: 11, color: "#6B5B9E" }}>
          <span><i style={{ display: "inline-block", width: 10, height: 10, background: "#7B5FC4", marginRight: 6 }} />Expected (weighted)</span>
          <span>- - Full plan</span><span style={{ color: "#9B5E00" }}>— Committed only</span>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1B69", marginBottom: 2 }}>Who we need, by client and month</div>
        <div style={{ fontSize: 11, color: "#6B5B9E", marginBottom: 10 }}>People starting each month if the deal lands. P permanent, C contract, B UTS bench, Pt partner, E rule-of-thumb estimate.</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
            <thead>
              <tr style={{ background: "#4A2FA0" }}>
                <th style={{ ...th, textAlign: "left" }}>Client / role</th><th style={{ ...th, textAlign: "left" }}>Skills</th><th style={th}>Type</th>
                {MONTHS.map(m => <th key={m} style={th}>{m}</th>)}<th style={th}>Total</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => {
                const tot = MONTHS.map((_, m) => c.lines.reduce((s, l) => s + l.adds[m], 0));
                const committed = c.confidence >= thr || c.core;
                return [
                  <tr key={c.id} style={{ background: "#EDE8FF" }}>
                    <td colSpan={3} style={{ ...td, textAlign: "left", fontWeight: 700, color: "#2D1B69" }}>
                      {c.label}{" "}
                      <span className={`pill pill-${c.stage}`}>{c.core ? "Core" : c.stage}</span>{" "}
                      <span style={{ fontSize: 11, fontWeight: 600, color: committed ? "#9B5E00" : "#6B5B9E" }}>
                        {c.core ? "" : `${c.confidence}%${committed ? " · committed" : ""}${c.value ? ` · Rs ${c.value.toFixed(2)} Cr` : ""}`}
                      </span>
                    </td>
                    {tot.map((x, m) => <td key={m} style={{ ...td, fontWeight: 700, color: x ? "#2D1B69" : "#C8B5F5" }}>{x || "-"}</td>)}
                    <td style={{ ...td, fontWeight: 700 }}>{tot.reduce((a, b) => a + b, 0)}</td>
                  </tr>,
                  ...c.lines.map((l, i) => (
                    <tr key={c.id + i} style={{ borderBottom: "1px solid #EDE8FF" }}>
                      <td style={{ ...td, textAlign: "left", paddingLeft: 22, whiteSpace: "nowrap" }}>{l.role}</td>
                      <td style={{ ...td, textAlign: "left", color: "#6B5B9E", fontSize: 11, minWidth: 220 }}>{l.skills}</td>
                      <td style={{ ...td, color: "#6B5B9E" }} title={l.type === "E" ? "Estimate" : TYPE_LABEL[l.type]}>{l.type}</td>
                      {l.adds.map((x, m) => <td key={m} style={{ ...td, color: x ? "#1A1030" : "#DDD6F5" }}>{x || "-"}</td>)}
                      <td style={{ ...td, fontWeight: 600 }}>{l.adds.reduce((a, b) => a + b, 0)}</td>
                    </tr>
                  )),
                ];
              })}
              {[["Added per month, expected", perMonth(exp), false, exp[9]],
                ["Cumulative, expected", exp, true, exp[9]],
                ["Cumulative, committed only", com, false, com[9]],
                ["Cumulative, full plan", full, false, full[9]]].map(([l, arr, gold, tot]) => (
                <tr key={l as string} style={{ background: gold ? "#F0C040" : "#fff", fontWeight: 700, color: gold ? "#3B2C00" : "#2D1B69", borderTop: "1px solid #DDD6F5" }}>
                  <td colSpan={3} style={{ ...td, textAlign: "left" }}>{l as string}</td>
                  {(arr as number[]).map((v, m) => <td key={m} style={td}>{f1(v)}</td>)}
                  <td style={td}>{f1(tot as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {skipped.length > 0 && <p style={{ fontSize: 11, color: "#A98CE8", marginTop: 10 }}>No headcount estimated yet (no deal value): {skipped.join(", ")}.</p>}
      </div>
    </div>
  );
}
