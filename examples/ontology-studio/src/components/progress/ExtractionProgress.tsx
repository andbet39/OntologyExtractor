import type { Progress } from "@/lib/shared/types";

interface ExtractionProgressProps {
  progress: Progress | null;
  status: "idle" | "extracting" | "error";
  error: string | undefined;
}

const PHASES = ["chunking", "extracting", "canonicalizing", "consolidating", "emitting", "done"] as const;

function phaseIndex(phase: string): number {
  return PHASES.indexOf(phase as (typeof PHASES)[number]);
}

function phasePercent(progress: Progress): number {
  const chunkPercent =
    progress.chunks.total === 0
      ? 0
      : (progress.chunks.processed / progress.chunks.total) * 70;
  const phaseBonus: Record<string, number> = {
    idle: 0, chunking: 5, extracting: 10,
    canonicalizing: 82, consolidating: 90, emitting: 96,
    done: 100, error: 100, cancelled: 100,
  };
  return Math.min(100, Math.max(phaseBonus[progress.phase] ?? 0, chunkPercent));
}

export function ExtractionProgress({ progress, status, error }: ExtractionProgressProps) {
  if (status === "idle" && !progress) return null;

  const currentPhase = progress?.phase ?? "idle";
  const percent = progress ? phasePercent(progress) : 0;
  const currentIdx = phaseIndex(currentPhase);

  return (
    <div className="mt-4 space-y-3">
      {status === "error" && error && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-700/40 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Phase stepper */}
      <div className="flex gap-1">
        {PHASES.slice(0, -1).map((phase, idx) => {
          const isActive = phase === currentPhase;
          const isDone = currentIdx > idx || currentPhase === "done";
          return (
            <div
              key={phase}
              className={`flex-1 h-1 rounded-full transition-colors ${
                isDone ? "bg-accent" : isActive ? "bg-accent/60" : "bg-surface-border"
              }`}
              title={phase}
            />
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-accent transition-all duration-300 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Status text */}
      {progress && (
        <div className="text-xs text-text-secondary space-y-0.5">
          <div className="font-medium text-text-primary capitalize">{currentPhase}</div>
          {progress.chunks.total > 0 && (
            <div>
              {progress.chunks.processed}/{progress.chunks.total} chunks · {progress.canonicalTypes} types
            </div>
          )}
          {progress.llmCalls.extraction > 0 && (
            <div>
              {progress.llmCalls.extraction} extraction calls · {progress.llmCalls.canonicalization} canon. calls
            </div>
          )}
        </div>
      )}
    </div>
  );
}
