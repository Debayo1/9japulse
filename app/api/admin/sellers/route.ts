import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../src/lib/supabaseServer";

const supabase = createServiceClient() as any;

export async function GET() {
  try {
    const { data, error } = await supabase.from("sellers").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
