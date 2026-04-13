import { NextRequest, NextResponse } from "next/server";
import { fetchBuildXPosts } from "@/lib/moltbook";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const posts = await fetchBuildXPosts();
  return NextResponse.json({ posts });
}
