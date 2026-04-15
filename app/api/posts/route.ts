import { NextResponse } from "next/server";
import { fetchBuildXPosts } from "@/lib/moltbook";

export const runtime = "nodejs";

export async function GET() {
  const posts = await fetchBuildXPosts();
  return NextResponse.json({ posts });
}
