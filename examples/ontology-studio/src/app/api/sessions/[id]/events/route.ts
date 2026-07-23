import { registry } from "@/lib/server/session-registry";
import type { SessionEvent } from "@/lib/shared/types";

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

  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const write = (eventName: string, data: unknown): void => {
        try {
          controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller already closed
        }
      };

      write("progress", snapshot);

      if (snapshot.status !== "extracting") {
        if (snapshot.status === "error") {
          write("error", { id, message: snapshot.error ?? "Extraction failed" });
        }
        controller.close();
        return;
      }

      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(": heartbeat\n\n")); }
        catch { clearInterval(heartbeat); }
      }, 15_000);
      heartbeat.unref();

      const unsubscribe = registry.subscribe(id, (event: SessionEvent) => {
        write(event.type, event.data);
        if (event.type !== "progress") {
          clearInterval(heartbeat);
          try { controller.close(); } catch { /* already closed */ }
        }
      });

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe?.();
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
