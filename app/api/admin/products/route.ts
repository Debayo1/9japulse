import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabaseServer";
import { getUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

async function checkAdmin() {
  const user = await getUser();
  if (!user) return null;
  if (!(await isAdminUser(user))) return null;
  return user;
}

// POST — create or update a product
export async function POST(req: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, id, title, description, price, image_url, category, rating, stock_quantity, images } = body;

  if (!title || !price || !image_url) {
    return NextResponse.json({ error: "title, price, and image_url are required" }, { status: 400 });
  }

  const svc = createServiceClient() as any;
  const payload = {
    title,
    description: description || null,
    price,
    image_url,
    category: category || "General",
    rating: rating || 4.5,
    stock_quantity: stock_quantity || 50,
    images: images && images.length > 0 ? images : null,
    updated_at: new Date().toISOString(),
  };

  if (action === "update" && id) {
    const { data, error } = await svc
      .from("marketplace_products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data });
  } else {
    // Create new — generate a clean ID from the title
    const newId = `prod-${Date.now()}`;
    const { data, error } = await svc
      .from("marketplace_products")
      .insert({ id: newId, ...payload, created_at: new Date().toISOString() })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data }, { status: 201 });
  }
}

// DELETE — remove a product
export async function DELETE(req: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const svc = createServiceClient() as any;
  const { error } = await svc.from("marketplace_products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
