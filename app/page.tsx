"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { PipelineRow } from "@/lib/supabase";
import Link from "next/link";

const STAGE_ORDER = ["Hot","Active","Warm","Early","Stalled","New","Lost"] as const;

const STAGE_COLOR: Record<string,string> = {
  Hot:"#B91C1C", Active:"#4A2FA0", Warm:"#9B5E00",
  Early:"#1D4ED8", Stalled:"#6B7280", New:"#047857", Lost:"#9CA3AF",
};

function KPI({ label, value, sub, gold }: { label:string; value:string; sub?:string; gold?:boolean }) {
  return (
    <div style={{ background:"#fff",border:"1.5px solid #EDE8FF",borderRadius:10,padding:"18px 22px",minWidth:140 }}>
      <div style={{ fontSize:11,color:"#7B5FC4",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26,fontWeight:700,color:gold?"#9B5E00":"#2D1B69",lineHeight:1 }}>{value}</div>
      {sub&&<div style={{ fontSize:11,color:"#A98CE8",marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function HBar({ label, value, max, color }: { label:string; value:number; max:number; color:string }) {
  const pct = max>0 ? Math.round((value/max)*100) : 0;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
        <span style={{ fontWeight:600,color:"#2D1B69" }}>{label}</span>
        <span style={{ color:"#7B5FC4" }}>₹{value.toFixed(2)} Cr</span>
      </div>
      <div style={{ height:10,background:"#EDE8FF",borderRadius:5,overflow:"hidden" }}>
        <div style={{ width:`${pct}%`,height:"100%",background:color,borderRadius:5,transition:"width 0.5s" }}/>
      </div>
    </div>
  );
}

function FunnelBar({ stage, count, value, maxCount }: { stage:string; count:number; value:number; maxCount:number }) {
  const pct = maxCount>0 ? Math.round((count/maxCount)*100) : 0;
  const color = STAGE_COLOR[stage]??"#7B5FC4";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
      <div style={{ width:72,textAlign:"right",fontSize:12,fontWeight:600,color:"#2D1B69" }}>{stage}</div>
      <div style={{ flex:1,height:24,background:"#F3F0FF",borderRadius:4,overflow:"hidden" }}>
        <div style={{ width:`${pct}%`,height:"100%",background:color,borderRadius:4,display:"flex",alignItems:"center",paddingLeft:8 }}>
          {pct>15&&<span style={{ fontSize:11,color:"#fff",fontWeight:600 }}>{count}</span>}
        </div>
      </div>
      <div style={{ width:80,fontSize:11,color:"#6B5B9E" }}>
        {value>0?`₹${value.toFixed(1)}Cr`:"—"}
      </div>
    </div>
  );
}

// ── Bar chart component (SVG-based) ──
type BarDatum = { label: string; value: number; color: string; sub?: string };

function BarChart({ data, title, valuePrefix="₹", valueSuffix=" Cr", height=220 }: {
  data: BarDatum[]; title: string; valuePrefix?: string; valueSuffix?: string; height?: number;
}) {
  const [hovered, setHovered] = useState<number|null>(null);
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d=>d.value), 0.01);
  const barW = Math.min(56, Math.floor(560 / data.length) - 12);
  const chartH = height - 60; // reserve space for labels below
  const svgW = Math.max(data.length * (barW + 16) + 40, 300);

  return (
    <div style={{ background:"#fff",border:"1.5px solid #EDE8FF",borderRadius:10,padding:"20px 24px" }}>
      <div style={{ fontSize:13,fontWeight:700,color:"#2D1B69",marginBottom:16 }}>{title}</div>
      <div style={{ overflowX:"auto" }}>
        <svg width={svgW} height={height} style={{ display:"block" }}>
          {/* y-axis gridlines */}
          {[0,0.25,0.5,0.75,1].map(f=>{
            const y = Math.round(chartH * (1-f));
            const val = maxVal * f;
            return (
              <g key={f}>
                <line x1={36} x2={svgW-8} y1={y} y2={y} stroke="#EDE8FF" strokeWidth={1}/>
                <text x={32} y={y+4} textAnchor="end" fontSize={9} fill="#A98CE8">
                  {val>=1 ? val.toFixed(1) : val.toFixed(2)}
                </text>
              </g>
            );
          })}
          {/* bars */}
          {data.map((d,i)=>{
            const barH = Math.max(2, Math.round((d.value/maxVal)*chartH));
            const x = 40 + i*(barW+14);
            const y = chartH - barH;
            const isHov = hovered===i;
            return (
              <g key={i}
                onMouseEnter={()=>setHovered(i)}
                onMouseLeave={()=>setHovered(null)}
                style={{ cursor:"pointer" }}
              >
                <rect x={x} y={y} width={barW} height={barH}
                  fill={d.color} rx={4} opacity={isHov?1:0.85}/>
                {/* value label on hover */}
                {isHov&&(
                  <g>
                    <rect x={x-4} y={y-28} width={barW+8} height={22} rx={4} fill="#2D1B69"/>
                    <text x={x+barW/2} y={y-13} textAnchor="middle" fontSize={10} fill="#fff" fontWeight="bold">
                      {valuePrefix}{d.value.toFixed(2)}{valueSuffix}
                    </text>
                  </g>
                )}
                {/* x-axis label */}
                <text x={x+barW/2} y={chartH+14} textAnchor="middle" fontSize={10} fill="#2D1B69" fontWeight="600">
                  {d.label.length>10 ? d.label.slice(0,9)+"…" : d.label}
                </text>
                {d.sub&&(
                  <text x={x+barW/2} y={chartH+26} textAnchor="middle" fontSize={9} fill="#7B5FC4">
                    {d.sub}
                  </text>
                )}
              </g>
            );
          })}
          {/* x axis line */}
          <line x1={36} x2={svgW-8} y1={chartH} y2={chartH} stroke="#EDE8FF" strokeWidth={1.5}/>
        </svg>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const sb = getSupabaseBrowser();
  const [rows, setRows] = useState<PipelineRow[]>([]);
  const [user, setUser] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [genDate] = useState(new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}));

  const load = useCallback(async()=>{
    const { data } = await sb.from("pipeline").select("*").order("sort_order");
    if(data) setRows(data as PipelineRow[]);
  },[sb]);

  useEffect(()=>{
    (async()=>{
      const { data:{ user:u } } = await sb.auth.getUser();
      if(!u){ window.location.href="/login"; return; }
      setUser(u.email??null);
      await load();
      setLoading(false);
    })();
  },[sb,load]);

  if(loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"#4A2FA0",fontFamily:"sans-serif" }}>
      Loading analytics…
    </div>
  );

  // ── derived metrics ──
  const active    = rows.filter(r=>r.stage!=="Lost");
  const lost      = rows.filter(r=>r.stage==="Lost");
  const hot       = rows.filter(r=>r.stage==="Hot");
  const activeVal = active.reduce((s,r)=>s+Number(r.deal_value),0);
  const totalVal  = rows.reduce((s,r)=>s+Number(r.deal_value),0);
  const lostVal   = lost.reduce((s,r)=>s+Number(r.deal_value),0);
  const hotVal    = hot.reduce((s,r)=>s+Number(r.deal_value),0);
  const avgConf   = active.length ? Math.round(active.reduce((s,r)=>s+r.confidence,0)/active.length) : 0;
  const weightedPipeline = active.reduce((s,r)=>s+Number(r.deal_value)*(r.confidence/100),0);

  // by stage
  const byStage = STAGE_ORDER.map(st=>({
    stage:st,
    count:rows.filter(r=>r.stage===st).length,
    value:rows.filter(r=>r.stage===st).reduce((s,r)=>s+Number(r.deal_value),0),
  }));
  const maxCount = Math.max(...byStage.map(b=>b.count),1);

  // top deals
  const topDeals = [...active].sort((a,b)=>Number(b.deal_value)-Number(a.deal_value)).slice(0,5);

  // by stage value for bar
  const stageVals = byStage.filter(b=>b.value>0);
  const maxVal    = Math.max(...stageVals.map(b=>b.value),0.01);

  // ── chart data ──
  const top5ChartData: BarDatum[] = topDeals.map(r=>({
    label: r.prospect,
    value: Number(r.deal_value),
    color: STAGE_COLOR[r.stage]??"#7B5FC4",
    sub: r.stage,
  }));

  const stageChartData: BarDatum[] = byStage
    .filter(b=>b.value>0)
    .map(b=>({
      label: b.stage,
      value: b.value,
      color: STAGE_COLOR[b.stage]??"#7B5FC4",
      sub: `${b.count} deal${b.count!==1?"s":""}`,
    }));

  const stageCountChartData: BarDatum[] = byStage
    .filter(b=>b.count>0)
    .map(b=>({
      label: b.stage,
      value: b.count,
      color: STAGE_COLOR[b.stage]??"#7B5FC4",
    }));

  return (
    <div style={{ fontFamily:"DM Sans, Calibri, sans-serif", minHeight:"100vh", background:"#F7F5FF" }}>

      {/* Header */}
      <header style={{ background:"#2D1B69",color:"#fff",padding:"16px 28px 12px",display:"flex",alignItems:"flex-end",justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11,color:"#A98CE8",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4 }}>Open Netrikkan</div>
          <h1 style={{ fontSize:22,fontWeight:700,margin:0,lineHeight:1.1 }}>Pipeline Analytics</h1>
          <p style={{ fontSize:11,color:"#C8B5F5",marginTop:2 }}>Executive review · {genDate} · {user}</p>
        </div>
        <Link href="/" style={{ padding:"6px 14px",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:6,color:"#C8B5F5",fontSize:12,textDecoration:"none" }}>
          ← Pipeline
        </Link>
      </header>

      <div style={{ padding:"24px 28px 48px" }}>

        {/* KPI row */}
        <div style={{ display:"flex",flexWrap:"wrap",gap:16,marginBottom:28 }}>
          <KPI label="Active pipeline" value={`₹${activeVal.toFixed(2)} Cr`} sub={`${active.length} prospects`}/>
          <KPI label="Weighted pipeline" value={`₹${weightedPipeline.toFixed(2)} Cr`} sub="prob-adjusted" gold/>
          <KPI label="Hot deals" value={`₹${hotVal.toFixed(2)} Cr`} sub={`${hot.length} accounts`}/>
          <KPI label="Avg confidence" value={`${avgConf}%`} sub="active prospects"/>
          <KPI label="Total pipeline" value={`₹${totalVal.toFixed(2)} Cr`} sub="incl. lost"/>
          <KPI label="Lost value" value={`₹${lostVal.toFixed(2)} Cr`} sub={`${lost.length} deals lost`}/>
        </div>

        {/* ── Charts row ── */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20 }}>
          <BarChart
            title="Top 5 active deals by value (₹ Cr)"
            data={top5ChartData}
            valuePrefix="₹"
            valueSuffix=" Cr"
          />
          <BarChart
            title="Pipeline value by stage (₹ Cr)"
            data={stageChartData}
            valuePrefix="₹"
            valueSuffix=" Cr"
          />
        </div>

        <div style={{ marginBottom:20 }}>
          <BarChart
            title="Deal count by stage"
            data={stageCountChartData}
            valuePrefix=""
            valueSuffix=" deals"
            height={180}
          />
        </div>

        {/* Two columns — funnel + value bars */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20 }}>

          {/* Funnel by count */}
          <div style={{ background:"#fff",border:"1.5px solid #EDE8FF",borderRadius:10,padding:"20px 24px" }}>
            <div style={{ fontSize:13,fontWeight:700,color:"#2D1B69",marginBottom:16 }}>Pipeline funnel — by deal count</div>
            {byStage.map(b=>(
              <FunnelBar key={b.stage} stage={b.stage} count={b.count} value={b.value} maxCount={maxCount}/>
            ))}
          </div>

          {/* Value by stage */}
          <div style={{ background:"#fff",border:"1.5px solid #EDE8FF",borderRadius:10,padding:"20px 24px" }}>
            <div style={{ fontSize:13,fontWeight:700,color:"#2D1B69",marginBottom:16 }}>Deal value by stage (₹ Cr)</div>
            {stageVals.map(b=>(
              <HBar key={b.stage} label={b.stage} value={b.value} max={maxVal} color={STAGE_COLOR[b.stage]??"#7B5FC4"}/>
            ))}
            {stageVals.length===0&&<p style={{ color:"#A98CE8",fontSize:12 }}>No deals with value yet.</p>}
          </div>
        </div>

        {/* Top deals table */}
        <div style={{ background:"#fff",border:"1.5px solid #EDE8FF",borderRadius:10,padding:"20px 24px",marginBottom:20 }}>
          <div style={{ fontSize:13,fontWeight:700,color:"#2D1B69",marginBottom:14 }}>Top 5 active deals by value</div>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:"2px solid #EDE8FF" }}>
                <th style={{ textAlign:"left",padding:"6px 12px",fontSize:11,color:"#7B5FC4",textTransform:"uppercase",letterSpacing:"0.05em" }}>Prospect</th>
                <th style={{ textAlign:"left",padding:"6px 12px",fontSize:11,color:"#7B5FC4",textTransform:"uppercase",letterSpacing:"0.05em" }}>Status</th>
                <th style={{ textAlign:"center",padding:"6px 12px",fontSize:11,color:"#7B5FC4",textTransform:"uppercase",letterSpacing:"0.05em" }}>Stage</th>
                <th style={{ textAlign:"center",padding:"6px 12px",fontSize:11,color:"#7B5FC4",textTransform:"uppercase",letterSpacing:"0.05em" }}>Conf.</th>
                <th style={{ textAlign:"right",padding:"6px 12px",fontSize:11,color:"#7B5FC4",textTransform:"uppercase",letterSpacing:"0.05em" }}>Value (Cr)</th>
                <th style={{ textAlign:"right",padding:"6px 12px",fontSize:11,color:"#7B5FC4",textTransform:"uppercase",letterSpacing:"0.05em" }}>Weighted</th>
              </tr>
            </thead>
            <tbody>
              {topDeals.map(r=>(
                <tr key={r.id} style={{ borderBottom:"1px solid #F3F0FF" }}>
                  <td style={{ padding:"8px 12px",fontWeight:600,color:"#2D1B69" }}>
                    {r.prospect}
                    {r.updated_this_week&&<span style={{ color:"#7B5FC4",marginLeft:5 }}>★</span>}
                  </td>
                  <td style={{ padding:"8px 12px",fontSize:11,color:"#5A4A8E",maxWidth:220 }}>{r.comment||"—"}</td>
                  <td style={{ padding:"8px 12px",textAlign:"center" }}>
                    <span style={{ background:STAGE_COLOR[r.stage]??"#7B5FC4",color:"#fff",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600 }}>
                      {r.stage}
                    </span>
                  </td>
                  <td style={{ padding:"8px 12px",textAlign:"center",fontSize:12,fontWeight:600,color:r.confidence>=75?"#1A6B1A":r.confidence>=50?"#4A2FA0":"#9B5E00" }}>
                    {r.confidence}%
                  </td>
                  <td style={{ padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#2D1B69" }}>
                    {Number(r.deal_value).toFixed(2)}
                  </td>
                  <td style={{ padding:"8px 12px",textAlign:"right",fontSize:12,color:"#7B5FC4" }}>
                    {(Number(r.deal_value)*r.confidence/100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Full pipeline snapshot */}
        <div style={{ background:"#fff",border:"1.5px solid #EDE8FF",borderRadius:10,padding:"20px 24px" }}>
          <div style={{ fontSize:13,fontWeight:700,color:"#2D1B69",marginBottom:14 }}>Full pipeline snapshot</div>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
            <thead>
              <tr style={{ background:"#4A2FA0" }}>
                {["Prospect","Comment","Stage","Conf","Deal (Cr)","Weighted"].map(h=>(
                  <th key={h} style={{ padding:"8px 12px",textAlign:h==="Prospect"||h==="Comment"?"left":"center",color:"#fff",fontSize:10,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a,b)=>STAGE_ORDER.indexOf(a.stage)-STAGE_ORDER.indexOf(b.stage)||a.sort_order-b.sort_order).map((r,i)=>(
                <tr key={r.id} style={{ background:i%2===0?"#fff":"#F9F7FF",borderBottom:"1px solid #F0ECFF" }}>
                  <td style={{ padding:"7px 12px",fontWeight:600,color:"#2D1B69" }}>
                    {r.prospect}{r.is_new&&<span style={{ background:"#F0C040",color:"#3A2800",fontSize:9,fontWeight:700,padding:"1px 4px",borderRadius:3,marginLeft:5,verticalAlign:"middle" }}>NEW</span>}
                  </td>
                  <td style={{ padding:"7px 12px",color:"#5A4A8E",maxWidth:260 }}>{r.comment||"—"}</td>
                  <td style={{ padding:"7px 12px",textAlign:"center" }}>
                    <span style={{ background:STAGE_COLOR[r.stage]??"#7B5FC4",color:"#fff",borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:600 }}>{r.stage}</span>
                  </td>
                  <td style={{ padding:"7px 12px",textAlign:"center",fontWeight:600,color:r.confidence>=75?"#1A6B1A":r.confidence>=50?"#4A2FA0":"#9B5E00" }}>{r.confidence}%</td>
                  <td style={{ padding:"7px 12px",textAlign:"center",fontWeight:700,color:"#2D1B69" }}>{Number(r.deal_value)>0?Number(r.deal_value).toFixed(2):"—"}</td>
                  <td style={{ padding:"7px 12px",textAlign:"center",color:"#7B5FC4" }}>{Number(r.deal_value)>0?(Number(r.deal_value)*r.confidence/100).toFixed(2):"—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background:"#EDE8FF",fontWeight:700 }}>
                <td colSpan={4} style={{ padding:"8px 12px",color:"#2D1B69",fontSize:12 }}>TOTAL</td>
                <td style={{ padding:"8px 12px",textAlign:"center",color:"#2D1B69",fontSize:13 }}>₹{totalVal.toFixed(2)}</td>
                <td style={{ padding:"8px 12px",textAlign:"center",color:"#7B5FC4",fontSize:13 }}>₹{weightedPipeline.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <p style={{ marginTop:10,fontSize:10,color:"#A98CE8" }}>
            Generated {genDate} · Open Netrikkan Sales Intelligence · Weighted = Deal value × Confidence%
          </p>
        </div>

      </div>
    </div>
  );
}
