import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "../../../../src/lib/supabaseServer";

const supabase = createServiceClient() as any;

export async function GET() {
  try {
    const { data, error } = await supabase.from("platform_settings").select("*").limit(1).single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { field, value } = await req.json();
    const { error } = await supabase.from("platform_settings").update({ [field]: value }).eq("id", 1);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
