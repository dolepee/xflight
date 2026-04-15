import * as cheerio from "cheerio";

export interface MoltbookPost {
  id: string;
  url: string;
  author: string;
  authorWallet?: string;
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  type: "buildx";
}

const SAMPLE_POSTS: MoltbookPost[] = [
  {
    id: "sample-001",
    url: "https://www.moltbook.com/posts/sample-001",
    author: "DeFiAgent",
    authorWallet: "0x1234567890abcdef1234567890abcdef12345678",
    title: "X Layer Trading Agent v2",
    content: `I deployed an autonomous trading agent on X Layer.
Agent wallet: 0x1234567890abcdef1234567890abcdef12345678
- 150+ successful swaps on Uniswap X Layer
- $12,400 total PnL in 7 days
- Used OnchainOS execution layer
- Deployed contract: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
- Live demo: https://agent.example.com
- GitHub: https://github.com/defiagent/xlayer-trader

Built with @OnchainOS on @XLayerOfficial`,
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    likes: 234,
    comments: 45,
    type: "buildx",
  },
];

function allowSampleFallback(): boolean {
  return process.env.ALLOW_SAMPLE_POSTS === "true" || process.env.NODE_ENV === "test";
}

function samplePostById(postId?: string): MoltbookPost | null {
  if (!allowSampleFallback()) return null;
  return SAMPLE_POSTS.find((post) => post.id === postId) || SAMPLE_POSTS[0] || null;
}

export async function fetchBuildXPosts(): Promise<MoltbookPost[]> {
  try {
    const res = await fetch("https://www.moltbook.com/api/v1/submolts/buildx?limit=20", {
      headers: { "User-Agent": "XFlight/1.0" },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return parseBuildXResponse(data);
  } catch {
    return samplePostById() ? SAMPLE_POSTS : [];
  }
}

export async function fetchPost(postId: string): Promise<MoltbookPost | null> {
  try {
    const res = await fetch(`https://www.moltbook.com/api/v1/posts/${postId}`, {
      headers: { "User-Agent": "XFlight/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return parsePostResponse(data);
  } catch {
    return samplePostById(postId);
  }
}

export async function fetchPostFromUrl(url: string): Promise<MoltbookPost | null> {
  const postId = extractPostId(url);
  if (postId) return fetchPost(postId);

  try {
    const parsed = new URL(url);
    const res = await fetch(parsed.toString(), { headers: { "User-Agent": "XFlight/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    return scrapePost(html, parsed.toString());
  } catch {
    return samplePostById();
  }
}

function extractPostId(url: string): string | null {
  const match = url.match(/\/posts\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function parseBuildXResponse(data: unknown): MoltbookPost[] {
  if (!data || typeof data !== "object") return samplePostById() ? SAMPLE_POSTS : [];
  const items = (data as Record<string, unknown>).data || (data as Record<string, unknown>).posts || [];
  if (!Array.isArray(items)) return samplePostById() ? SAMPLE_POSTS : [];

  return items.slice(0, 20).map((item: unknown, i: number) => {
    const obj = item as Record<string, unknown>;
    return {
      id: String(obj.id || `post-${i}`),
      url: `https://www.moltbook.com/posts/${obj.id || i}`,
      author: String(obj.author || obj.username || "unknown"),
      authorWallet: obj.wallet as string | undefined,
      title: String(obj.title || String(obj.content || "").slice(0, 80) || ""),
      content: String(obj.content || obj.body || ""),
      timestamp: String(obj.created_at || obj.timestamp || new Date().toISOString()),
      likes: Number(obj.likes || obj.like_count || 0),
      comments: Number(obj.comments || obj.comment_count || 0),
      type: "buildx" as const,
    };
  });
}

function parsePostResponse(data: unknown): MoltbookPost | null {
  if (!data || typeof data !== "object") return samplePostById();
  const obj = data as Record<string, unknown>;
  return {
    id: String(obj.id || "unknown"),
    url: `https://www.moltbook.com/posts/${obj.id}`,
    author: String(obj.author || obj.username || "unknown"),
    authorWallet: obj.wallet as string | undefined,
    title: String(obj.title || ""),
    content: String(obj.content || obj.body || ""),
    timestamp: String(obj.created_at || obj.timestamp || new Date().toISOString()),
    likes: Number(obj.likes || 0),
    comments: Number(obj.comments || 0),
    type: "buildx",
  };
}

function scrapePost(html: string, url: string): MoltbookPost | null {
  try {
    const $ = cheerio.load(html);
    const content = $('[data-testid="post-content"], .post-content, article, .content').text().trim();
    const author = $('[data-testid="author"], .author, .username').first().text().trim();
    const title = $("h1, [data-testid='title']").first().text().trim();

    if (!content) return samplePostById();

    return {
      id: extractPostId(url) || "scraped",
      url,
      author: author || "unknown",
      title: title || content.slice(0, 80),
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      type: "buildx",
    };
  } catch {
    return samplePostById();
  }
}
