import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { clearSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSession();
  return NextResponse.redirect(`${appUrl}/login`, { status: 303 });
}
