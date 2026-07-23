import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { OntologyGraphInner } from "./OntologyGraphInner";

const OntologyGraphInnerDynamic = dynamic(
  () => import("./OntologyGraphInner").then((m) => m.OntologyGraphInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-surface-base rounded-lg">
        <div className="text-text-muted text-sm">Loading graph…</div>
      </div>
    ),
  },
);

type GraphProps = ComponentProps<typeof OntologyGraphInner>;

export function OntologyGraph(props: GraphProps) {
  return <OntologyGraphInnerDynamic {...props} />;
}
