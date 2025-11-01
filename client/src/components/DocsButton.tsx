import * as React from "react";
import { fetchDocs, type DocItem } from "../lib/docs";

export default function DocsButton() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<DocItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchDocs()
      .then((d) => alive && setItems(d))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const query = q.trim().toLowerCase();
  const filtered = items.filter(
    (i) =>
      !query ||
      i.title.toLowerCase().includes(query) ||
      i.tags.some((t) => t.toLowerCase().includes(query))
  );

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border px-6 py-2 shadow-sm bg-white/70 hover:bg-white text-sm"
      >
        Documents
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 max-h-96 overflow-auto rounded-2xl border bg-white shadow-lg p-2">
          <div className="sticky top-0 bg-white p-1">
            <input
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          {loading && <div className="p-2 text-sm opacity-60">Loading…</div>}

          {!loading && filtered.length === 0 && (
            <div className="p-3 text-xs opacity-60">No documents found</div>
          )}

          {!loading &&
            filtered.map((d) => (
              <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-orange-50"
                onClick={() => setOpen(false)}
                title={d.url}
              >
                <span className="truncate">{d.title}</span>
                <span className="shrink-0 rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-[11px]">
                  {d.tags.join("/").toUpperCase()}
                </span>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
