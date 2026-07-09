import { NextRequest, NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabaseServer";
import { 
  getMarketplaceProducts, 
  purchaseMarketplaceItem,
  getUserMarketplaceOrders
} from "@/lib/marketplace";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    
    if (type === "orders") {
      const reqClient = await createRequestClient(req);
      const { user } = reqClient;
      if (!user) {
        return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
      }
      const orders = await getUserMarketplaceOrders(user.id);
      return NextResponse.json({ success: true, orders });
    }

    const category = searchParams.get("category") || undefined;
    const query = searchParams.get("query") || undefined;

    const products = await getMarketplaceProducts(category, query);

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

    const { productId, pin, shippingDetails } = await req.json();

    if (!productId || !pin) {
      return NextResponse.json({ error: "Product ID and PIN are required" }, { status: 400 });
    }

    if (!shippingDetails || !shippingDetails.name || !shippingDetails.phone || !shippingDetails.email || !shippingDetails.address) {
      return NextResponse.json({ error: "Complete shipping details are required" }, { status: 400 });
    }

    const result = await purchaseMarketplaceItem(user.id, productId, pin, shippingDetails);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
