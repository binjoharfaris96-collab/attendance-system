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
        className="field-input w-auto py-2 text-sm font-medium cursor-pointer"
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
          className="btn btn--outline text-xs px-3 py-2"
        >
          Apply
        </button>
      </noscript>
    </form>
  );
}

