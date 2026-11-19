export function Skeleton({ className = '', width, height = 14 }: { className?: string; width?: string | number; height?: string | number }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" style={{ width, height }} />;
}
