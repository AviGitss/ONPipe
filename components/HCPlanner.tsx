"use client";

import { useMemo, useState } from "react";
import type { PipelineRow } from "@/lib/supabase";

/**
 * HC Requirement Planner.
 * Reads live pipeline rows. Deals with a role plan below use it; any other deal
 * (including a newly added one) falls back to a rule of thumb that you can edit
 * on screen, so a new project always shows up in the projection.
 * To give a deal a real plan, add an entry to PLANS (match = regex on prospect name).
 */

const MONTHS = ["Nov-26","Dec-26","Jan-27","Feb-27","Mar-27","Apr-27","May-27","Jun-27","Jul-27","Aug-27"];

type Role = { role: string; type: "P" | "C" | "B" | "Pt"; adds: number[] };
type Plan = { key: string; label: string; match: RegExp | null; color: string; note: string; roles: Role[] };

const PLANS: Plan[] = [
  { key: "tescom", label: "Tescom", match: /tescom/i, color: "#2D1B69", note: "MES implementation",
    roles: [
      { role: "MES PM, 16-yr", type: "P", adds: [1] },
      { role: "Integration architect, bridge", type: "C", adds: [1] },
      { role: "Integration architect, 8-10 yrs", type: "P", adds: [0, 0, 1] },
    ] },
  { key: "timex", label: "Timex", match: /timex/i, color: "#4A2FA0", note: "Approval likely Dec / Jan",
    roles: [
      { role: "Program PM, 20-yr", type: "P", adds: [0, 0, 1] },
      { role: "Simulation/data engineers", type: "P", adds: [0, 0, 2, 0, 0, 0, 1] },
      { role: "Field engineer, Noida", type: "P", adds: [0, 0, 0, 1] },
    ] },
  { key: "logesys", label: "Logesys", match: /logesys/i, color: "#7B5FC4", note: "Build Jan-Feb, AMC from May",
    roles: [
      { role: "IoT lead architect", type: "C", adds: [0, 0, 1] },
      { role: "Firmware engineers", type: "C", adds: [0, 0, 1, 1] },
      { role: "Cloud/backend engineers", type: "C", adds: [0, 0, 1, 1] },
      { role: "Mobile/dashboard engineer", type: "C", adds: [0, 0, 0, 1] },
      { role: "QA/test", type: "C", adds: [0, 0, 0, 1] },
      { role: "Delivery PM", type: "C", adds: [0, 0, 0, 1] },
      { role: "On-ground deployment, UAE", type: "Pt", adds: [0, 0, 0, 0, 2, 2] },
      { role: "AMC lead, remote", type: "C", adds: [0, 0, 0, 0, 0, 0, 1] },
    ] },
  { key: "dixon", label: "UST - Dixon", match: /dixon/i, color: "#A98CE8", note: "8-member team from December",
    roles: [
      { role: "Program lead", type: "B", adds: [0, 1] },
      { role: "MES solution architect", type: "B", adds: [0, 1] },
      { role: "Functional consultant, EMS", type: "B", adds: [0, 1] },
      { role: "MES developers", type: "B", adds: [0, 2, 1] },
      { role: "Integration engineer, ERP/PLC", type: "B", adds: [0, 0, 1] },
      { role: "QA", type: "B", adds: [0, 0, 1] },
    ] },
  { key: "quest", label: "Qwest - Renesas", match: /renesas|qwest|quest/i, color: "#C8B5F5", note: "Opcenter MES consultant by Feb",
    roles: [{ role: "Siemens Opcenter MES consultant", type: "C", adds: [0, 0, 0, 1] }] },
  { key: "tvs", label: "TVS Sundaram", match: /tvs/i, color: "#F0C040", note: "Inventory leak identification",
    roles: [{ role: "IoT/data engineer", type: "C", adds: [0, 0, 1] }] },
  { key: "core", label: "Core team", match: null, color: "#8E88A8", note: "Not tied to a deal",
    roles: [{ role: "BD/partnerships lead", type: "P", adds: [0, 0, 0, 0, 0, 0, 0, 0, 1] }] },
];

const FALLBACK_COLORS = ["#6B5B9E", "#9B8BC9", "#B9A7E8", "#D8C9F7", "#5A4300", "#8B6FD0", "#3C2A85"];

type Item = {
  id: string; label: string; color: string; note: string; stage: string;
  value: number; confidence: number; fixed: boolean; estimate: boolean;
  roles: { role: string; type: string; adds: number[] }[];
  tot: number[]; cum: number[]; peak: number; rowIds: number[];
};

function pad(a: number[]) { const r = a.slice(0, 10); while (r.length < 10) r.push(0); return r; }
function cumulative(a: number[]) { let t = 0; return a.map(x => (t += x)); }
const f1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);

export default function HCPlanner({ rows }: { rows: PipelineRow[] }) {
  const [thr, setThr] = useState(90);
  const [perCr, setPerCr] = useState(2);       // people per Rs Cr for deals with no role plan
  const [startIdx, setStartIdx] = useState(2); // month index those people start (Jan-27)
  const [over, setOver] = useState<Record<string, number>>({});

  const items: Item[] = useMemo(() => {
    const live = rows.filter(r => r.stage !== "Lost");
    const used = new Set<number>();
    const out: Item[] = [];

    PLANS.forEach(p => {
      const matched = p.match ? live.filter(r => p.match!.test(r.prospect)) : [];
      matched.forEach(r => used.add(r.id));
      if (p.match && matched.length === 0) return; // plan with no live deal is skipped
      const best = matched.length ? matched.reduce((a, b) => (b.confidence > a.confidence ? b : a)) : null;
      const roles = p.roles.map(r => ({ ...r, adds: pad(r.adds) }));
      const tot = Array.from({ length: 10 }, (_, m) => roles.reduce((s, r) => s + r.adds[m], 0));
      const cum = cumulative(tot);
      out.push({
        id: p.key, label: p.label, color: p.color, note: p.note,
        stage: best ? best.stage : "Plan",
        value: matched.length ? Math.max(...matched.map(r => Number(r.deal_value) || 0)) : 0,
        confidence: best ? best.confidence : 100,
        fixed: !p.match, estimate: false, roles, tot, cum, peak: cum[9],
        rowIds: matched.map(r => r.id),
      });
    });

    let ci = 0;
    live.filter(r => !used.has(r.id)).forEach(r => {
      const v = Number(r.deal_value) || 0;
      const n = v > 0 ? Math.max(1, Math.ceil(v * perCr)) : 0;
      const tot = Array.from({ length: 10 }, (_, m) => (m === startIdx ? n : 0));
      const cum = cumulative(tot);
      out.push({
        id: "row-" + r.id, label: r.prospect, color: FALLBACK_COLORS[ci++ % FALLBACK_COLORS.length],
        note: r.comment || "", stage: r.stage, value: v, confidence: r.confidence, fixed: false, estimate: true,
        roles: n ? [{ role: `Delivery team (estimate, ${perCr}/Rs Cr)`, type: "C", adds: tot }] : [],
        tot, cum, peak: cum[9], rowIds: [r.id],
      });
    });
    return out;
  }, [rows, perCr, startIdx]);

  const conf = (i: Item) => (i.fixed ? 100 : over[i.id] ?? i.confidence);

  const full = MONTHS.map((_, m) => items.reduce((s, i) => s + i.cum[m], 0));
  const exp = MONTHS.map((_, m) => items.reduce((s, i) => s + (i.cum[m] * conf(i)) / 100, 0));
  const com = MONTHS.map((_, m) => items.reduce((s, i) => s + (conf(i) >= thr ? i.cum[m] : 0), 0));

  const planned = items.filter(i => i.peak > 0);
  const noHC = items.filter(i => i.peak === 0);
  const live = rows.filter(r => r.stage !== "Lost");
  const weighted = live.reduce((s, r) => s + (Number(r.deal_value) || 0) * (r.confidence / 100), 0);

  const card: React.CSSProperties = { background: "#fff", border: "1.5px solid #DDD6F5", borderRadius: 10, padding: 14 };
  const lab: React.CSSProperties = { fontSize: 10, color: "#A98CE8", textTransform: "uppercase", letterSpacing: "0.05em" };
  const inp: React.CSSProperties = { width: 64, padding: "5px 8px", border: "1.5px solid #DDD6F5", borderRadius: 6, fontSize: 12 };

  function renderTile(i: Item) {
    const c = conf(i);
    const committed = !i.fixed && c >= thr;
    const first = i.tot.findIndex(x => x > 0);
    return (
      <div key={i.id} style={{ ...card, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: i.color, flex: "none" }} />
            <span style={{ fontWeight: 700, color: "#2D1B69", fontSize: 13, overflowWrap: "anywhere" }}>{i.label}</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap",
            background: committed ? "#F0C040" : "#EDE8FF", color: committed ? "#3B2C00" : "#4A2FA0" }}>
            {i.fixed ? "Core" : committed ? "Committed" : i.stage}
          </span>
        </div>
        {i.note && <div style={{ fontSize: 11, color: "#6B5B9E" }}>{i.note}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
          <div><div style={{ fontSize: 18, fontWeight: 700, color: "#2D1B69" }}>{i.peak}</div><div style={lab}>if it lands</div></div>
          <div><div style={{ fontSize: 18, fontWeight: 700, color: "#4A2FA0" }}>{f1((i.peak * c) / 100)}</div><div style={lab}>expected</div></div>
          <div><div style={{ fontSize: 18, fontWeight: 700, color: "#2D1B69" }}>{i.value ? i.value.toFixed(2) : "-"}</div><div style={lab}>Rs Cr</div></div>
        </div>
        {!i.fixed && (
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: "#6B5B9E" }}>
            Confidence
            <input type="range" min={0} max={100} step={5} value={c} style={{ flex: 1, minWidth: 0, accentColor: "#4A2FA0" }}
              onChange={e => setOver({ ...over, [i.id]: Number(e.target.value) })} />
            <b style={{ width: 36, textAlign: "right", color: "#1A1030" }}>{c}%</b>
          </label>
        )}
        <div style={{ fontSize: 10, color: "#A98CE8" }}>
          {i.peak > 0 ? `${i.roles.length} role${i.roles.length > 1 ? "s" : ""} · first hire ${MONTHS[first]}` : "No people planned yet"}
          {i.estimate && i.peak > 0 ? " · rule-of-thumb estimate" : ""}
        </div>
      </div>
    );
  }

  // chart
  const W = 900, H = 280, L = 34, R = 10, T = 16, B = 28;
  const mx = Math.max(8, Math.ceil(Math.max(...full, 1) / 4) * 4);
  const bw = (W - L - R) / 10, iw = bw * 0.56;
  const y = (v: number) => T + (H - T - B) * (1 - v / mx);

  return (
    <div style={{ padding: "24px 0 48px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* controls */}
      <div style={{ ...card, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", background: "#F7F5FF" }}>
        <label style={{ fontSize: 12, color: "#6B5B9E" }}>Committed at or above{" "}
          <input style={inp} type="number" min={0} max={100} step={5} value={thr} onChange={e => setThr(Number(e.target.value) || 0)} /> %</label>
        <label style={{ fontSize: 12, color: "#6B5B9E" }}>Deals with no role plan: people per Rs Cr{" "}
          <input style={inp} type="number" min={0} step={0.5} value={perCr} onChange={e => setPerCr(Number(e.target.value) || 0)} /></label>
        <label style={{ fontSize: 12, color: "#6B5B9E" }}>starting{" "}
          <select style={{ ...inp, width: 96 }} value={startIdx} onChange={e => setStartIdx(Number(e.target.value))}>
            {MONTHS.map((m, k) => <option key={m} value={k}>{m}</option>)}
          </select></label>
        <button onClick={() => setOver({})} style={{ padding: "6px 14px", background: "#EDE8FF", color: "#4A2FA0", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
          Reset sliders to pipeline
        </button>
        <span style={{ fontSize: 11, color: "#A98CE8" }}>Sliders are what-if only. Edit confidence on the Pipeline tab to change it for good.</span>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        {[
          ["Hire against now", f1(com[9]), `deals at or above ${thr}%`, true],
          ["Expected by Aug-27", f1(exp[9]), `of ${full[9]} if every deal lands`, false],
          ["Expected by Jan-27", f1(exp[2]), `committed ${com[2]} · full ${full[2]}`, false],
          ["Pipeline, weighted (tracker)", "Rs " + f1(weighted) + " Cr", `${live.length} live deals`, false],
        ].map(([l, v, n, hi]) => (
          <div key={l as string} style={{ ...card, background: hi ? "#2D1B69" : "#fff", borderColor: hi ? "#2D1B69" : "#DDD6F5" }}>
            <div style={{ ...lab, color: hi ? "#C8B5F5" : "#A98CE8" }}>{l}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: hi ? "#fff" : "#2D1B69", lineHeight: 1.2 }}>{v}</div>
            <div style={{ fontSize: 11, color: hi ? "#C8B5F5" : "#6B5B9E" }}>{n}</div>
          </div>
        ))}
      </div>

      {/* tiles: always visible */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1B69", marginBottom: 10 }}>Opportunities and the people they need</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }}>
          {planned.map(renderTile)}
        </div>
      </div>
      {noHC.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1B69", marginBottom: 10 }}>Opportunities with no people planned</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }}>
            {noHC.map(renderTile)}
          </div>
        </div>
      )}

      {/* chart */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1B69", marginBottom: 8 }}>Cumulative new headcount by month</div>
        <div style={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 560, display: "block" }} role="img" aria-label="Cumulative new headcount by month">
            {[0, 1, 2, 3, 4].map(k => {
              const g = (mx / 4) * k;
              return <g key={k}><line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#EDE8FF" /><text x={L - 6} y={y(g) + 4} textAnchor="end" fontSize={11} fill="#6B5B9E">{g}</text></g>;
            })}
            {MONTHS.map((mo, m) => {
              const x = L + m * bw + (bw - iw) / 2;
              let acc = 0;
              return (
                <g key={mo}>
                  {items.map(i => {
                    const e = (i.cum[m] * conf(i)) / 100;
                    if (e <= 0) return null;
                    const r = <rect key={i.id} x={x} y={y(acc + e)} width={iw} height={Math.max(0, y(acc) - y(acc + e))} fill={i.color}><title>{`${i.label}: ${f1(e)} expected`}</title></rect>;
                    acc += e;
                    return r;
                  })}
                  <line x1={x - 4} x2={x + iw + 4} y1={y(full[m])} y2={y(full[m])} stroke="#1A1030" strokeWidth={2} strokeDasharray="4 3"><title>{`Full plan: ${full[m]}`}</title></line>
                  <line x1={x - 4} x2={x + iw + 4} y1={y(com[m])} y2={y(com[m])} stroke="#F0C040" strokeWidth={3}><title>{`Committed: ${com[m]}`}</title></line>
                  <text x={x + iw / 2} y={y(Math.max(exp[m], full[m])) - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#2D1B69">{f1(exp[m])}</text>
                  <text x={x + iw / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="#6B5B9E">{mo}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8, fontSize: 11, color: "#6B5B9E" }}>
          {planned.map(i => <span key={i.id} style={{ display: "flex", gap: 6, alignItems: "center" }}><i style={{ width: 10, height: 10, borderRadius: 2, background: i.color, display: "inline-block" }} />{i.label}</span>)}
          <span>- - Full plan</span><span style={{ color: "#9B5E00" }}>— Committed only</span><span>Number = expected total</span>
        </div>
      </div>

      {/* grid */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#2D1B69", marginBottom: 8 }}>Month by month, by account (expected people added)</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 760 }}>
            <thead>
              <tr style={{ background: "#4A2FA0" }}>
                {["Account", "Conf.", ...MONTHS, "Total"].map((h, k) => <th key={h} style={{ padding: "8px 10px", color: "#fff", fontSize: 11, fontWeight: 600, textAlign: k < 1 ? "left" : "right", whiteSpace: "nowrap" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {planned.map((i, k) => (
                <tr key={i.id} style={{ background: k % 2 ? "#fff" : "#F7F5FF", borderBottom: "1px solid #EDE8FF" }}>
                  <td style={{ padding: "7px 10px", fontWeight: 600, color: "#2D1B69", whiteSpace: "nowrap" }}>{i.label}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right" }}>{conf(i)}%</td>
                  {i.tot.map((x, m) => <td key={m} style={{ padding: "7px 10px", textAlign: "right", color: x ? "#1A1030" : "#C8B5F5" }}>{x ? f1((x * conf(i)) / 100) : "-"}</td>)}
                  <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700 }}>{f1((i.peak * conf(i)) / 100)}</td>
                </tr>
              ))}
              {[
                ["Added per month, expected", exp.map((v, m) => v - (m ? exp[m - 1] : 0)), false, exp[9]],
                ["Cumulative, expected", exp, true, exp[9]],
                ["Cumulative, committed only", com, false, com[9]],
                ["Cumulative, full plan", full, false, full[9]],
              ].map(([l, arr, gold, tot]) => (
                <tr key={l as string} style={{ background: gold ? "#F0C040" : "#fff", fontWeight: 700, color: gold ? "#3B2C00" : "#2D1B69", borderBottom: "1px solid #EDE8FF" }}>
                  <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>{l as string}</td><td />
                  {(arr as number[]).map((v, m) => <td key={m} style={{ padding: "7px 10px", textAlign: "right" }}>{f1(v)}</td>)}
                  <td style={{ padding: "7px 10px", textAlign: "right" }}>{f1(tot as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 10, color: "#A98CE8", marginTop: 8 }}>
          Expected = planned additions x confidence. Role plans for the named accounts come from the onboarding plan; any other deal uses the rule of thumb above until a plan is added in components/HCPlanner.tsx.
        </p>
      </div>
    </div>
  );
}
