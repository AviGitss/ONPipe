import { createSupabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Password recovery — send to reset page instead of dashboard
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/reset`);
  }

  return NextResponse.redirect(`${origin}/`);
}
