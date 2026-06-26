import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  await signOut();

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
        cookieStore.set(cookie.name, "", { maxAge: 0, path: "/" });
      }
    }
  } catch (e) {
    console.error("[Signout API] Failed to clear cookies:", e);
  }

  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_BASE_URL!));
}
