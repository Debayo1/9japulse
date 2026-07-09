import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabaseServer";
import { 
  getMarketplaceProducts, 
  searchAndSyncTemuProducts, 
  purchaseMarketplaceItem 
} from "@/lib/marketplace";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const query = searchParams.get("query") || undefined;

    let products;
    if (query && query.trim().length > 0) {
      // Sync from Temu RapidAPI search
      products = await searchAndSyncTemuProducts(query);
    } else {
      // Fetch local catalog
      products = await getMarketplaceProducts(category);
    }

    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const reqClient = await createRequestClient(req);
    const { user } = reqClient;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const { productId, pin } = await req.json();

    if (!productId || !pin) {
      return NextResponse.json({ error: "Product ID and PIN are required" }, { status: 400 });
    }

    const result = await purchaseMarketplaceItem(user.id, productId, pin);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
