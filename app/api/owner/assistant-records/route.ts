import { getAssistantAuditRecords } from "@/lib/assistant-audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await getAssistantAuditRecords();
    return Response.json({ records: records.slice().reverse() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "对话档案暂时打不开。" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
