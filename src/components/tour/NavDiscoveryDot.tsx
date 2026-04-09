/**
 * Small pulsing teal dot — indicates an unvisited nav item.
 * Purely decorative; auto-dismissed by useNavDiscovery hook when user visits the page.
 */
export default function NavDiscoveryDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-1.5 w-1.5 ${className ?? ""}`}
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-atlas-teal opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-atlas-teal" />
    </span>
  );
}
