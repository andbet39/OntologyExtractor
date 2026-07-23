import { registry, TooManySessionsError } from "@/lib/server/session-registry";
import type { ProviderName } from "@/lib/server/providers";

export const runtime = "nodejs";

function readDefaultProvider(): ProviderName {
  const p = process.env.ONTOLOGY_PROVIDER?.trim();
  if (p === "lmstudio" || p === "azure") return p;
  return "mock";
}

export async function POST(request: Request) {
  let provider: ProviderName = readDefaultProvider();
  try {
    const body = await request.json() as { provider?: string };
    const p = body.provider?.trim();
    if (p === "lmstudio" || p === "azure" || p === "mock") {
      provider = p;
    }
  } catch {
    // no body — keep server default
  }

  try {
    const id = registry.createSession(provider);
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof TooManySessionsError) {
      return Response.json({ error: error.message }, { status: 429 });
    }
    const message = error instanceof Error ? error.message : "Failed to create session";
    return Response.json({ error: message }, { status: 500 });
  }
}
