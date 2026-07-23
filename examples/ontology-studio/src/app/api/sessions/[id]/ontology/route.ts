import { registry, SessionNotFoundError } from "@/lib/server/session-registry";
import type { EditOperation } from "@/lib/shared/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const ontology = registry.getDisplayOntology(id);
    if (ontology === null) {
      return Response.json({ error: "No ontology extracted yet" }, { status: 409 });
    }
    return Response.json(ontology);
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    return Response.json({ error: "Failed to retrieve ontology" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json() as { operations?: unknown };
    if (!Array.isArray(body.operations)) {
      return Response.json({ error: "operations must be an array" }, { status: 400 });
    }
    const operations = body.operations as EditOperation[];
    const typeCount = registry.applyEdits(id, operations);
    return Response.json({ ok: true, typeCount });
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    return Response.json({ error: "Failed to apply edits" }, { status: 500 });
  }
}
