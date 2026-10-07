<<<<<<< HEAD
import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { PipelineRow } from "@/lib/supabase";
import SignOutButton from "@/components/SignOutButton";
import styles from "./page.module.css";

export const revalidate = 60;

const STAGE_ORDER = ["Hot", "Active", "Warm", "Early", "Stalled", "New", "Lost"];

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 75 ? "#1A6B1A" :
    value >= 50 ? "#4A2FA0" :
    value >= 25 ? "#9B5E00" :
    "#BBBBBB";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ width: 64, height: 8, background: "#DDD6F5", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#6B5B9E" }}>{value}%</span>
=======
"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { PipelineRow } from "@/lib/supabase";
import Link from "next/link";
import styles from "./page.module.css";

const STAGES = ["Hot","Active","Warm","Early","Stalled","New","Lost"] as const;
const STAGE_ORDER = [...STAGES];

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 75 ? "#1A6B1A" : value >= 50 ? "#4A2FA0" : value >= 25 ? "#9B5E00" : "#BBBBBB";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{ width:64, height:8, background:"#DDD6F5", borderRadius:4, overflow:"hidden" }}>
        <div style={{ width:`${value}%`, height:"100%", background:color, borderRadius:4 }} />
      </div>
      <span style={{ fontSize:11, fontWeight:600, color:"#6B5B9E" }}>{value}%</span>
>>>>>>> 1f9d56e (edit options)
    </div>
  );
}

<<<<<<< HEAD
export default async function PipelinePage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("pipeline")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  const rows = data as PipelineRow[];

  const activeRows   = rows.filter(r => r.stage !== "Lost");
  const totalValue   = rows.reduce((s, r) => s + Number(r.deal_value), 0);
  const activeValue  = activeRows.reduce((s, r) => s + Number(r.deal_value), 0);
  const newCount     = rows.filter(r => r.is_new).length;
  const updatedCount = rows.filter(r => r.updated_this_week).length;

  const sorted = [...rows].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || a.sort_order - b.sort_order
  );

  return (
    <div>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          /*<span className={styles.headerNum}>02</span>*/
          <div>
            <h1 className={styles.headerTitle}>Sales Pipeline</h1>
            <p className={styles.headerSub}>Active Prospects · Status</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "#C8B5F5" }}>{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* Summary bar */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryVal}>{rows.length}</span>
          <span className={styles.summaryLabel}>Prospects</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryVal}>₹{activeValue.toFixed(2)} Cr</span>
          <span className={styles.summaryLabel}>Active Pipeline</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryVal}>₹{totalValue.toFixed(2)} Cr</span>
          <span className={styles.summaryLabel}>Total incl. Lost</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryVal}>{newCount} New</span>
          <span className={styles.summaryLabel}>Added this cycle</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryVal}>{updatedCount} ★</span>
          <span className={styles.summaryLabel}>Updated this week</span>
        </div>
      </div>

      {/* Table */}
=======
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

export default function PipelinePage() {
  const sb = getSupabaseBrowser();
  const [rows, setRows]       = useState<PipelineRow[]>([]);
  const [user, setUser]       = useState<string|null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState<EditState|null>(null);
  const [adding, setAdding]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(true);

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
  const activeValue = rows.filter(r=>r.stage!=="Lost").reduce((s,r)=>s+Number(r.deal_value),0);
  const totalValue  = rows.reduce((s,r)=>s+Number(r.deal_value),0);
  const newCount    = rows.filter(r=>r.is_new).length;
  const updCount    = rows.filter(r=>r.updated_this_week).length;

  const abtn = (bg:string,c:string):React.CSSProperties=>({
    padding:"3px 8px",background:bg,color:c,border:"none",borderRadius:5,fontSize:12,cursor:"pointer"
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
          {canEdit&&(
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
        <div className={styles.summaryItem}><span className={styles.summaryVal}>₹{totalValue.toFixed(2)} Cr</span><span className={styles.summaryLabel}>Total incl. lost</span></div>
        <div className={styles.summaryItem}><span className={styles.summaryVal}>{newCount} New</span><span className={styles.summaryLabel}>Added this cycle</span></div>
        <div className={styles.summaryItem}><span className={styles.summaryVal}>{updCount} ★</span><span className={styles.summaryLabel}>Updated this week</span></div>
      </div>

      {/* Add new deal form */}
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

>>>>>>> 1f9d56e (edit options)
      <div className={styles.wrap}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Comment / Status</th>
<<<<<<< HEAD
                <th style={{ textAlign: "center" }}>Confidence</th>
                <th style={{ textAlign: "center" }}>Deal Value (Cr)</th>
                <th style={{ textAlign: "center" }}>Stage</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(row => (
                <tr
                  key={row.id}
                  className={
                    row.is_new ? styles.rowNew :
                    row.stage === "Lost" ? styles.rowLost : ""
                  }
                >
                  <td className={styles.prospectCell}>
                    <span className={styles.prospectName}>{row.prospect}</span>
                    {row.updated_this_week && <span className={styles.star}>★</span>}
                    {row.is_new && <span className={styles.newBadge}>New</span>}
                  </td>
                  <td className={styles.commentCell}>{row.comment}</td>
                  <td style={{ textAlign: "center" }}>
                    <ConfidenceBar value={row.confidence} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {Number(row.deal_value) > 0
                      ? <span className={styles.dealValue}>{Number(row.deal_value).toFixed(2)}</span>
                      : <span className={styles.dealValueZero}>—</span>
                    }
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`pill pill-${row.stage}`}>{row.stage}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
=======
                <th style={{ textAlign:"center" }}>Confidence</th>
                <th style={{ textAlign:"center" }}>Deal Value (Cr)</th>
                <th style={{ textAlign:"center" }}>Stage</th>
                {canEdit&&<th style={{ textAlign:"center",width:90 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map(row=>{
                const isEditing = !adding && editing?.id===row.id;
                return (
                  <tr key={row.id} className={row.is_new?styles.rowNew:row.stage==="Lost"?styles.rowLost:""}>
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
        {canEdit&&<p style={{ marginTop:12,fontSize:11,color:"#A98CE8" }}>Click ✏️ to edit any row · Changes save to Supabase in real time</p>}
>>>>>>> 1f9d56e (edit options)
      </div>
    </div>
  );
}
