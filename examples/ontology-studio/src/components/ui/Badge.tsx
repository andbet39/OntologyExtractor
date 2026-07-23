interface BadgeProps {
  children: React.ReactNode;
  variant?: "node" | "rel" | "neutral" | "error";
  className?: string;
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const variantClass = {
    node: "bg-accent/20 text-accent border-accent/40",
    rel: "bg-purple-900/30 text-purple-300 border-purple-700/40",
    neutral: "bg-surface-overlay text-text-secondary border-surface-border",
    error: "bg-red-900/30 text-red-300 border-red-700/40",
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${variantClass} ${className}`}
    >
      {children}
    </span>
  );
}
