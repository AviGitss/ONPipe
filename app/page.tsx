"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { PipelineRow } from "@/lib/supabase";
import Link from "next/link";
import styles from "./page.module.css";

const STAGES = ["Won","Hot","Active","Warm","Early","Stalled","New","Lost"] as const;
const STAGE_ORDER = [...STAGES];

// Confidence weights by stage for HC projection
const STAGE_WEIGHT: Record<string, number> = {
  Won: 1.0, Hot: 0.80, Active: 0.60, Warm: 0.40,
  Early: 0.20, New: 0.15, Stalled: 0.05, Lost: 0,
};

// Assumed months-to-close by stage (from today)
const STAGE_MONTHS: Record<string, number> = {
  Won: 0, Hot: 1, Active: 2, Warm: 3,
  Early: 5, New: 6, Stalled: 8, Lost: 99,
};

// HC model: each ₹ Cr of revenue needs ~1 implementation engineer for ~3 months
// Assume avg deal takes 3 months of delivery effort per Cr of deal value
const CR_PER_HC_PER_QUARTER = 0.5; // 1 HC can deliver ₹0.5 Cr per quarter
const CURRENT_HC = 2; // baseline team (adjust as needed)

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 75 ? "#1A6B1A" : value >= 50 ? "#4A2FA0" : value >= 25 ? "#9B5E00" : "#BBBBBB";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{ width:64, height:8, background:"#DDD6F5", borderRadius:4, overflow:"hidden" }}>
        <div style={{ width:`${value}%`, height:"100%", background:color, borderRadius:4 }} />
      </div>
      <span style={{ fontSize:11, fontWeight:600, color:"#6B5B9E" }}>{value}%</span>
    </div>
  );
}

type EditState = Partial<PipelineRow> & { id: number };

const BLANK: EditState = {
  id: -1, prospect:"", comment:"", confidence:0, deal_value:0,
  stage:"Early", is_new:false, updated_this_week:false, sort_order:99,
};

const inp: React.CSSProperties = {
  padding:"6px 10px", border:"1.5px solid #DDD6F5", borderRadius:6,
  fontSize:12, color:"#1A1030", outline:"none", width:"100%", boxSizing:"border-box",
};
const sel: React.CSSProperties = { ...inp, cursor:"pointer" };

function EditForm({ e, set }: { e: EditState; set:(k:keyof EditState, v:unknown)=>void }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 85px 90px 105px 70px 70px", gap:8, alignItems:"end" }}>
      <div>
        <label style={{ fontSize:10, color:"#6B5B9E", display:"block", marginBottom:2 }}>Prospect *</label>
        <input style={inp} value={e.prospect??""} onChange={ev=>set("prospect",ev.target.value)} placeholder="Company name"/>
      </div>
      <div>
        <label style={{ fontSize:10, color:"#6B5B9E", display:"block", marginBottom:2 }}>Comment / status</label>
        <input style={inp} value={e.comment??""} onChange={ev=>set("comment",ev.target.value)} placeholder="e.g. Proposal sent"/>
      </div>
      <div>
        <label style={{ fontSize:10, color:"#6B5B9E", display:"block", marginBottom:2 }}>Confidence %</label>
        <input style={inp} type="number" min={0} max={100} value={e.confidence??0} onChange={ev=>set("confidence",Number(ev.target.value))}/>
      </div>
      <div>
        <label style={{ fontSize:10, color:"#6B5B9E", display:"block", marginBottom:2 }}>Deal (₹ Cr)</label>
        <input style={inp} type="number" step="0.1" min={0} value={e.deal_value??0} onChange={ev=>set("deal_value",Number(ev.target.value))}/>
      </div>
      <div>
        <label style={{ fontSize:10, color:"#6B5B9E", display:"block", marginBottom:2 }}>Stage</label>
        <select style={sel} value={e.stage??"Early"} onChange={ev=>set("stage",ev.target.value)}>
          {STAGES.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ textAlign:"center" }}>
        <label style={{ fontSize:10, color:"#6B5B9E", display:"block", marginBottom:6 }}>Updated ★</label>
        <input type="checkbox" checked={!!e.updated_this_week} onChange={ev=>set("updated_this_week",ev.target.checked)}/>
      </div>
      <div style={{ textAlign:"center" }}>
        <label style={{ fontSize:10, color:"#6B5B9E", display:"block", marginBottom:6 }}>New</label>
        <input type="checkbox" checked={!!e.is_new} onChange={ev=>set("is_new",ev.target.checked)}/>
      </div>
    </div>
  );
}

// ── HC Projection helpers ──────────────────────────────────────────────────

function getQuarterLabel(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} FY${String(d.getFullYear()).slice(2)}`;
}

interface QuarterBucket {
  label: string;
  weightedRev: number;
  wonRev: number;
  deals: { prospect: string; value: number; weight: number; stage: string }[];
}

function buildHCProjection(rows: PipelineRow[]) {
  // Build quarterly buckets for next 5 quarters
  const buckets: Record<string, QuarterBucket> = {};
  const quarterKeys: string[] = [];

  for (let m = 0; m <= 18; m += 3) {
    const label = getQuarterLabel(m);
    if (!buckets[label]) {
      buckets[label] = { label, weightedRev: 0, wonRev: 0, deals: [] };
      quarterKeys.push(label);
    }
  }

  rows.forEach(row => {
    const stage = row.stage;
    const weight = STAGE_WEIGHT[stage] ?? 0;
    const monthsOut = STAGE_MONTHS[stage] ?? 99;
    if (weight === 0 || monthsOut > 18) return;

    const label = getQuarterLabel(monthsOut);
    if (!buckets[label]) return;

    const value = Number(row.deal_value) || 0;
    const weighted = value * weight;

    buckets[label].weightedRev += weighted;
    if (stage === "Won") buckets[label].wonRev += value;
    buckets[label].deals.push({ prospect: row.prospect, value, weight, stage });
  });

  // Compute cumulative + HC needed
  let cumRev = 0;
  return quarterKeys.map(k => {
    const b = buckets[k];
    cumRev += b.weightedRev;
    const hcNeeded = Math.ceil(b.weightedRev / CR_PER_HC_PER_QUARTER);
    const addlHC = Math.max(0, hcNeeded - CURRENT_HC);
    return { ...b, cumRev, hcNeeded, addlHC };
  });
}

function HCProjectionTab({ rows }: { rows: PipelineRow[] }) {
  const projection = buildHCProjection(rows);
  const [expanded, setExpanded] = useState<string|null>(null);
  const target = 2.0; // ₹ Cr target by Mar 2027

  // Find which quarter Mar 2027 lands in
  const mar27 = getQuarterLabel(
    Math.round((new Date(2027, 2, 31).getTime() - new Date().getTime()) / (1000*60*60*24*30))
  );

  return (
    <div style={{ padding:"24px 0 48px" }}>
      {/* Target callout */}
      <div style={{ background:"#F7F5FF", border:"1.5px solid #DDD6F5", borderRadius:10, padding:"14px 20px", marginBottom:24, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#2D1B69" }}>🎯 Target: ₹{target} Cr by Mar 2027</span>
        <span style={{ fontSize:12, color:"#6B5B9E" }}>
          HC model: {CURRENT_HC} current staff · ₹{CR_PER_HC_PER_QUARTER} Cr per HC per quarter · Additional hires triggered when pipeline exceeds capacity
        </span>
      </div>

      {/* Quarter cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16, marginBottom:32 }}>
        {projection.map(q => {
          const isTarget = q.label === mar27;
          const urgent = q.addlHC > 0;
          return (
            <div
              key={q.label}
              onClick={() => setExpanded(expanded === q.label ? null : q.label)}
              style={{
                border: isTarget ? "2px solid #C8A000" : "1.5px solid #DDD6F5",
                borderRadius:10,
                padding:"16px",
                background: urgent ? "#FFF8F0" : "#fff",
                cursor:"pointer",
                transition:"box-shadow 0.15s",
                boxShadow: expanded===q.label ? "0 2px 12px rgba(74,47,160,0.15)" : "none",
              }}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#2D1B69" }}>
                  {q.label}{isTarget?" 🎯":""}
                </span>
                {urgent && (
                  <span style={{ fontSize:10, background:"#FEE8E8", color:"#A32D2D", padding:"2px 7px", borderRadius:10, fontWeight:700 }}>
                    +{q.addlHC} HC
                  </span>
                )}
                {!urgent && q.hcNeeded > 0 && (
                  <span style={{ fontSize:10, background:"#EAF5EA", color:"#1A6B1A", padding:"2px 7px", borderRadius:10, fontWeight:600 }}>
                    Within cap
                  </span>
                )}
              </div>

              <div style={{ fontSize:22, fontWeight:800, color: urgent?"#9B5E00":"#4A2FA0", marginBottom:2 }}>
                ₹{q.weightedRev.toFixed(2)} Cr
              </div>
              <div style={{ fontSize:10, color:"#A98CE8", marginBottom:10 }}>Weighted pipeline this quarter</div>

              {q.wonRev > 0 && (
                <div style={{ fontSize:11, color:"#7A5C00", fontWeight:600, marginBottom:6 }}>
                  🏆 ₹{q.wonRev.toFixed(2)} Cr confirmed won
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                <div style={{ background:"#F7F5FF", borderRadius:6, padding:"6px 10px" }}>
                  <div style={{ fontSize:18, fontWeight:700, color:"#4A2FA0" }}>{q.hcNeeded}</div>
                  <div style={{ fontSize:9, color:"#A98CE8", textTransform:"uppercase", letterSpacing:"0.04em" }}>HC needed</div>
                </div>
                <div style={{ background: q.addlHC>0?"#FEE8E8":"#EDE8FF", borderRadius:6, padding:"6px 10px" }}>
                  <div style={{ fontSize:18, fontWeight:700, color: q.addlHC>0?"#A32D2D":"#4A2FA0" }}>{q.addlHC>0?`+${q.addlHC}`:CURRENT_HC}</div>
                  <div style={{ fontSize:9, color:"#A98CE8", textTransform:"uppercase", letterSpacing:"0.04em" }}>{q.addlHC>0?"Hire now":"Current team"}</div>
                </div>
              </div>

              <div style={{ marginTop:8, fontSize:10, color:"#A98CE8" }}>
                Cumulative ₹{q.cumRev.toFixed(2)} Cr · {q.deals.length} deal{q.deals.length!==1?"s":""}
              </div>

              {/* Drill-down */}
              {expanded === q.label && q.deals.length > 0 && (
                <div style={{ marginTop:12, borderTop:"1px solid #DDD6F5", paddingTop:10 }}>
                  {q.deals.map((d,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <span style={{ fontSize:11, color:"#2D1B69", fontWeight:500 }}>{d.prospect}</span>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span className={`pill pill-${d.stage}`}>{d.stage}</span>
                        <span style={{ fontSize:11, color:"#6B5B9E", fontWeight:600 }}>
                          ₹{(d.value*d.weight).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hiring timeline */}
      <div style={{ background:"#fff", border:"1.5px solid #DDD6F5", borderRadius:10, padding:"18px 20px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#2D1B69", marginBottom:14 }}>📅 Hiring trigger timeline</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:"#4A2FA0" }}>
                {["Quarter","Weighted Rev","Won","HC Needed","Additional Hires","Hire By"].map(h=>(
                  <th key={h} style={{ padding:"8px 12px", color:"#fff", textAlign:"left", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projection.map((q,i) => (
                <tr key={q.label} style={{ background: i%2===0?"#F7F5FF":"#fff", borderBottom:"1px solid #EDE8FF" }}>
                  <td style={{ padding:"8px 12px", fontWeight:600, color:"#2D1B69" }}>{q.label}</td>
                  <td style={{ padding:"8px 12px", color:"#4A2FA0", fontWeight:600 }}>₹{q.weightedRev.toFixed(2)} Cr</td>
                  <td style={{ padding:"8px 12px", color:"#7A5C00" }}>{q.wonRev>0?`₹${q.wonRev.toFixed(2)} Cr`:"—"}</td>
                  <td style={{ padding:"8px 12px" }}>{q.hcNeeded}</td>
                  <td style={{ padding:"8px 12px" }}>
                    {q.addlHC>0
                      ? <span style={{ background:"#FEE8E8", color:"#A32D2D", padding:"2px 8px", borderRadius:10, fontWeight:700 }}>+{q.addlHC}</span>
                      : <span style={{ color:"#A98CE8" }}>—</span>}
                  </td>
                  <td style={{ padding:"8px 12px", color:"#6B5B9E" }}>
                    {q.addlHC>0 ? `Before ${q.label} start` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize:10, color:"#A98CE8", marginTop:10 }}>
          * Weighted revenue = deal value × stage probability. HC model assumes ₹{CR_PER_HC_PER_QUARTER} Cr per person per quarter delivery capacity. Adjust in code constants as team productivity evolves.
        </p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const sb = getSupabaseBrowser();
  const [rows, setRows]       = useState<PipelineRow[]>([]);
  const [user, setUser]       = useState<string|null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState<EditState|null>(null);
  const [adding, setAdding]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [markingWon, setMarkingWon] = useState<number|null>(null);
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<"pipeline"|"hc">("pipeline");

  const load = useCallback(async () => {
    const { data } = await sb.from("pipeline").select("*").order("sort_order");
    if (data) setRows(data as PipelineRow[]);
  }, [sb]);

  useEffect(()=>{
    (async()=>{
      const { data:{ user:u } } = await sb.auth.getUser();
      if (!u){ window.location.href="/login"; return; }
      setUser(u.email??null);
      const { data:ed } = await sb.from("pipeline_editors").select("email").eq("email",u.email??"").maybeSingle();
      setCanEdit(!!ed);
      await load();
      setLoading(false);
    })();
  },[sb,load]);

  async function signOut(){
    await sb.auth.signOut();
    window.location.href="/login";
  }

  function startEdit(row:PipelineRow){
    if(!canEdit) return;
    setAdding(false);
    setEditing({...row});
    setErr("");
  }

  function startAdd(){
    if(!canEdit) return;
    setAdding(true);
    setEditing({...BLANK, sort_order: rows.length+1});
    setErr("");
  }

  function cancelEdit(){ setEditing(null); setAdding(false); setErr(""); }

  function setField(k:keyof EditState, v:unknown){
    if(!editing) return;
    setEditing({...editing,[k]:v});
  }

  async function save(){
    if(!editing) return;
    if(!editing.prospect?.trim()){ setErr("Prospect name is required."); return; }
    setSaving(true); setErr("");
    const payload = {
      prospect: editing.prospect,
      comment: editing.comment||"",
      confidence: Number(editing.confidence)||0,
      deal_value: Number(editing.deal_value)||0,
      stage: editing.stage,
      is_new: !!editing.is_new,
      updated_this_week: !!editing.updated_this_week,
      sort_order: Number(editing.sort_order)||99,
    };
    let error;
    if(adding){
      ({ error } = await sb.from("pipeline").insert(payload));
    } else {
      ({ error } = await sb.from("pipeline").update(payload).eq("id",editing.id));
    }
    if(error){ setErr(error.message); setSaving(false); return; }
    await load();
    setEditing(null); setAdding(false); setSaving(false);
  }

  async function markWon(row: PipelineRow){
    if(!canEdit || row.stage==="Won") return;
    setMarkingWon(row.id);
    await sb.from("pipeline").update({ stage:"Won", confidence:100 }).eq("id",row.id);
    await load();
    setMarkingWon(null);
  }

  async function del(id:number){
    if(!confirm("Delete this prospect?")) return;
    await sb.from("pipeline").delete().eq("id",id);
    await load();
  }

  if(loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"#4A2FA0",fontFamily:"sans-serif" }}>
      Loading pipeline…
    </div>
  );

  const sorted = [...rows].sort(
    (a,b)=>STAGE_ORDER.indexOf(a.stage)-STAGE_ORDER.indexOf(b.stage)||a.sort_order-b.sort_order
  );
  const activeValue = rows.filter(r=>r.stage!=="Lost"&&r.stage!=="Won").reduce((s,r)=>s+Number(r.deal_value),0);
  const wonValue    = rows.filter(r=>r.stage==="Won").reduce((s,r)=>s+Number(r.deal_value),0);
  const totalValue  = rows.reduce((s,r)=>s+Number(r.deal_value),0);
  const newCount    = rows.filter(r=>r.is_new).length;
  const updCount    = rows.filter(r=>r.updated_this_week).length;

  const abtn = (bg:string,c:string):React.CSSProperties=>({
    padding:"3px 8px",background:bg,color:c,border:"none",borderRadius:5,fontSize:12,cursor:"pointer"
  });

  // Tab button style
  const tabBtn = (active:boolean):React.CSSProperties=>({
    padding:"8px 20px", border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
    borderBottom: active?"3px solid #F0C040":"3px solid transparent",
    background:"transparent", color: active?"#2D1B69":"#A98CE8",
    transition:"all 0.15s",
  });

  return (
    <div>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.headerTitle}>Open Netrikkan · Sales Pipeline</h1>
            <p className={styles.headerSub}>
              Active Prospects · Status{canEdit?" · ✏️ Editor mode":""}
            </p>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <Link href="/analytics" style={{ padding:"6px 14px",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:6,color:"#C8B5F5",fontSize:12,textDecoration:"none" }}>
            📊 Analytics
          </Link>
          {canEdit&&tab==="pipeline"&&(
            <button onClick={startAdd} style={{ padding:"6px 14px",background:"#F0C040",border:"none",borderRadius:6,color:"#2D1B69",fontSize:12,cursor:"pointer",fontWeight:600 }}>
              + New Deal
            </button>
          )}
          <span style={{ fontSize:12,color:"#C8B5F5" }}>{user}</span>
          <button onClick={signOut} style={{ padding:"6px 14px",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:6,color:"#C8B5F5",fontSize:12,cursor:"pointer" }}>
            Sign out
          </button>
        </div>
      </header>

      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}><span className={styles.summaryVal}>{rows.length}</span><span className={styles.summaryLabel}>Prospects</span></div>
        <div className={styles.summaryItem}><span className={styles.summaryVal}>₹{activeValue.toFixed(2)} Cr</span><span className={styles.summaryLabel}>Active pipeline</span></div>
        <div className={styles.summaryItem} style={{ background:"rgba(180,140,0,0.15)", borderRadius:8, padding:"4px 12px" }}><span className={styles.summaryVal} style={{ color:"#C8A000" }}>🏆 ₹{wonValue.toFixed(2)} Cr</span><span className={styles.summaryLabel}>Won</span></div>
        <div className={styles.summaryItem}><span className={styles.summaryVal}>₹{totalValue.toFixed(2)} Cr</span><span className={styles.summaryLabel}>Total incl. lost</span></div>
        <div className={styles.summaryItem}><span className={styles.summaryVal}>{newCount} New</span><span className={styles.summaryLabel}>Added this cycle</span></div>
        <div className={styles.summaryItem}><span className={styles.summaryVal}>{updCount} ★</span><span className={styles.summaryLabel}>Updated this week</span></div>
      </div>

      {/* Tab bar */}
      <div style={{ background:"#fff", borderBottom:"1px solid #DDD6F5", display:"flex", paddingLeft:24 }}>
        <button style={tabBtn(tab==="pipeline")} onClick={()=>setTab("pipeline")}>📋 Pipeline</button>
        <button style={tabBtn(tab==="hc")} onClick={()=>setTab("hc")}>👥 HC Projection</button>
      </div>

      {/* ── PIPELINE TAB ── */}
      {tab==="pipeline"&&(
        <>
          {adding&&editing&&(
            <div style={{ background:"#F7F5FF",borderBottom:"2px solid #4A2FA0",padding:"16px 24px" }}>
              <div style={{ fontSize:13,fontWeight:600,color:"#2D1B69",marginBottom:10 }}>➕ New Deal</div>
              <EditForm e={editing} set={setField}/>
              {err&&<p style={{ color:"#A32D2D",fontSize:12,marginTop:6 }}>{err}</p>}
              <div style={{ display:"flex",gap:8,marginTop:12 }}>
                <button onClick={save} disabled={saving} style={{ padding:"7px 18px",background:"#4A2FA0",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer",opacity:saving?0.6:1 }}>
                  {saving?"Saving…":"Save Deal"}
                </button>
                <button onClick={cancelEdit} style={{ padding:"7px 14px",background:"#EDE8FF",color:"#4A2FA0",border:"none",borderRadius:6,fontSize:13,cursor:"pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          <div className={styles.wrap}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Prospect</th>
                    <th>Comment / Status</th>
                    <th style={{ textAlign:"center" }}>Confidence</th>
                    <th style={{ textAlign:"center" }}>Deal Value (Cr)</th>
                    <th style={{ textAlign:"center" }}>Stage</th>
                    {canEdit&&<th style={{ textAlign:"center",width:110 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(row=>{
                    const isEditing = !adding && editing?.id===row.id;
                    return (
                      <tr key={row.id} className={row.stage==="Won"?styles.rowWon:row.is_new?styles.rowNew:row.stage==="Lost"?styles.rowLost:""}>
                        {isEditing&&editing?(
                          <>
                            <td colSpan={5} style={{ padding:"12px 14px" }}>
                              <EditForm e={editing} set={setField}/>
                              {err&&<p style={{ color:"#A32D2D",fontSize:12,marginTop:6 }}>{err}</p>}
                              <div style={{ display:"flex",gap:8,marginTop:10 }}>
                                <button onClick={save} disabled={saving} style={{ padding:"6px 16px",background:"#4A2FA0",color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:saving?"not-allowed":"pointer",opacity:saving?0.6:1 }}>
                                  {saving?"Saving…":"Save"}
                                </button>
                                <button onClick={cancelEdit} style={{ padding:"6px 12px",background:"#EDE8FF",color:"#4A2FA0",border:"none",borderRadius:6,fontSize:12,cursor:"pointer" }}>Cancel</button>
                              </div>
                            </td>
                            {canEdit&&<td/>}
                          </>
                        ):(
                          <>
                            <td className={styles.prospectCell}>
                              <span className={styles.prospectName}>{row.prospect}</span>
                              {row.stage==="Won"&&<span style={{ marginLeft:6, fontSize:14 }}>🏆</span>}
                              {row.updated_this_week&&<span className={styles.star}>★</span>}
                              {row.is_new&&<span className={styles.newBadge}>New</span>}
                            </td>
                            <td className={styles.commentCell}>{row.comment}</td>
                            <td style={{ textAlign:"center" }}><ConfidenceBar value={row.confidence}/></td>
                            <td style={{ textAlign:"center" }}>
                              {Number(row.deal_value)>0
                                ?<span className={styles.dealValue}>{Number(row.deal_value).toFixed(2)}</span>
                                :<span className={styles.dealValueZero}>—</span>}
                            </td>
                            <td style={{ textAlign:"center" }}>
                              <span className={`pill pill-${row.stage}`}>{row.stage}</span>
                            </td>
                            {canEdit&&(
                              <td style={{ textAlign:"center",whiteSpace:"nowrap" }}>
                                {row.stage!=="Won"&&(
                                  <button
                                    onClick={()=>markWon(row)}
                                    title="Mark as Won"
                                    disabled={markingWon===row.id}
                                    style={{ ...abtn("#FFF3C0","#7A5C00"), marginRight:4, border:"1px solid #C8A000", opacity:markingWon===row.id?0.5:1 }}
                                  >
                                    🏆
                                  </button>
                                )}
                                <button onClick={()=>startEdit(row)} title="Edit" style={abtn("#EDE8FF","#4A2FA0")}>✏️</button>
                                <button onClick={()=>del(row.id)} title="Delete" style={{ ...abtn("#FEE8E8","#A32D2D"),marginLeft:4 }}>🗑</button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {canEdit&&<p style={{ marginTop:12,fontSize:11,color:"#A98CE8" }}>🏆 one-click win · ✏️ edit · 🗑 delete · Changes save to Supabase in real time</p>}
          </div>
        </>
      )}

      {/* ── HC PROJECTION TAB ── */}
      {tab==="hc"&&(
        <div className={styles.wrap}>
          <HCProjectionTab rows={rows}/>
        </div>
      )}
    </div>
  );
}
