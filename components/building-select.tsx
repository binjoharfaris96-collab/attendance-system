"use client";

interface BuildingOption {
  id: string;
  name: string;
}

export function BuildingSelect({
  buildings,
  defaultValue,
}: {
  buildings: BuildingOption[];
  defaultValue: string;
}) {
  return (
    <form method="GET" action="/dashboard" className="flex items-center gap-2">
      <select
        name="bid"
        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
        defaultValue={defaultValue}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">All Buildings</option>
        {buildings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <noscript>
        <button
          type="submit"
          className="text-xs bg-slate-900 text-white px-2 py-1 rounded"
        >
          Apply
        </button>
      </noscript>
    </form>
  );
}

