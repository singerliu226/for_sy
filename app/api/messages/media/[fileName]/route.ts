import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const dynamic = "force-dynamic";

const storePath = process.env.MESSAGE_BOARD_FILE ?? join(process.cwd(), ".message-board", "messages.json");
const uploadsDirectory = join(dirname(storePath), "uploads");
const mediaTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  webm: "audio/webm",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
};
const safeFileName = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif|webm|m4a|mp3|wav|ogg)$/i;

export async function GET(_request: Request, context: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await context.params;
  const match = safeFileName.exec(fileName);
  if (!match) return new Response("Not found", { status: 404 });

  try {
    const file = await readFile(join(uploadsDirectory, fileName));
    return new Response(file, {
      headers: {
        "Cache-Control": "private, max-age=86400",
        "Content-Type": mediaTypes[match[1].toLowerCase()],
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
