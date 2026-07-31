'use client';

// Bloc de chargement générique (respecte prefers-reduced-motion via globals.css).
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-2 ${className}`} />;
}

// Lignes de table en chargement — conserve la mise en page (évite le saut de contenu).
export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-line">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="p-3"><Skeleton className="h-4 w-full max-w-[160px]" /></td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

// Cartes KPI en chargement
export function SkeletonCards({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-xl p-5 shadow-sm">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
