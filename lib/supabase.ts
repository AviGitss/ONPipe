import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Public client (browser / server components without auth context)
export const supabase = createClient(url, key);

export type PipelineRow = {
  id: number;
  prospect: string;
  comment: string | null;
  confidence: number;
  deal_value: number;
  stage: "Hot" | "Active" | "Warm" | "Early" | "Stalled" | "Lost" | "New";
  is_new: boolean;
  updated_this_week: boolean;
  sort_order: number;
  updated_at: string;
};
