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
    </div>
  );
}

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
      <div className={styles.wrap}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Comment / Status</th>
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
      </div>
    </div>
  );
}
