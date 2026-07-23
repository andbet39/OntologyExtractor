import { registry, SessionNotFoundError } from "@/lib/server/session-registry";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const snapshot = registry.getSnapshot(id);
  if (snapshot === undefined) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }
  return Response.json(snapshot);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const ok = registry.resetSession(id);
    if (!ok) return Response.json({ error: "Session not found" }, { status: 404 });
    return Response.json({ id, reset: true });
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    return Response.json({ error: "Reset failed" }, { status: 500 });
  }
}
