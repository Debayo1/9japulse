import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabaseServer";
import { getOrCreateVirtualAccount } from "@/lib/virtualAccount";

export async function POST(req: NextRequest) {
  try {
    const reqClient = await createRequestClient(req);
    const { user } = reqClient;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await getOrCreateVirtualAccount(user.id);
    return NextResponse.json({ success: true, account });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create virtual account" }, { status: 500 });
  }
}
