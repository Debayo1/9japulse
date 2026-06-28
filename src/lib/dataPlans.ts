"use server";

import { createServiceClient } from "./supabaseServer";

export interface DataPlanDb {
  id: string;
  service: string;
  display_name: string | null;
  plan_value: string;
  price: number;
  discount: string | null;
  fixed_price: boolean;
  full_service_name: string | null;
  created_at: string;
}

export async function fetchActiveDataPlans(): Promise<DataPlanDb[]> {
  try {
    const svc = createServiceClient() as any;
    const { data, error } = await svc
      .from("data_plans")
      .select("*")
      .order("price", { ascending: true });

    if (error) {
      console.warn("[9jaPulse] Error fetching data plans from Supabase:", error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      service: String(row.service),
      display_name: row.display_name,
      plan_value: String(row.plan_value),
      price: Number(row.price),
      discount: row.discount,
      fixed_price: Boolean(row.fixed_price),
      full_service_name: row.full_service_name,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : "",
    }));
  } catch (err) {
    console.error("[9jaPulse] Database error in fetchActiveDataPlans:", err);
    return [];
  }
}
