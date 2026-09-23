import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const videoPath = join(process.cwd(), "dist", "client", "welcome", "generated", "midautumn-homecoming.mp4");

export async function GET() {
  try {
    const video = await readFile(videoPath);
    return new Response(video, {
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Content-Type": "video/mp4",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
