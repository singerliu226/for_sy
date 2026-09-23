import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const videoPath = join(process.cwd(), "dist", "client", "welcome", "generated", "midautumn-homecoming.mp4");

function headers(length: number) {
  return {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400",
    "Content-Type": "video/mp4",
    "Content-Length": String(length),
    "X-Content-Type-Options": "nosniff",
  };
}

export async function GET(request: Request) {
  try {
    const video = await readFile(videoPath);
    const range = request.headers.get("range");
    if (!range) return new Response(video, { headers: headers(video.length) });

    const match = /^bytes=(\d*)-(\d*)$/i.exec(range);
    if (!match) return new Response("Range not satisfiable", { status: 416, headers: { "Content-Range": `bytes */${video.length}` } });
    const isSuffixRange = !match[1] && Boolean(match[2]);
    const start = isSuffixRange
      ? Math.max(0, video.length - Number(match[2]))
      : Number(match[1] || 0);
    const end = isSuffixRange
      ? video.length - 1
      : Math.min(match[2] ? Number(match[2]) : video.length - 1, video.length - 1);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end) {
      return new Response("Range not satisfiable", { status: 416, headers: { "Content-Range": `bytes */${video.length}` } });
    }
    const chunk = video.subarray(start, end + 1);
    return new Response(chunk, {
      status: 206,
      headers: { ...headers(chunk.length), "Content-Range": `bytes ${start}-${end}/${video.length}` },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
