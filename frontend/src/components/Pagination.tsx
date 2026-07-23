'use client';

// Pagination simple : précédent / suivant + position. Masquée s'il n'y a qu'une page.
export default function Pagination({
  page, total, limit, onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total <= limit) return null;

  const debut = (page - 1) * limit + 1;
  const fin = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t text-sm bg-white rounded-b-xl">
      <span className="text-gray-500">{debut}–{fin} sur {total}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="border rounded px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
        >
          Précédent
        </button>
        <span className="text-gray-500">{page} / {pages}</span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="border rounded px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
