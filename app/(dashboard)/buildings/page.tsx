import { requireSession } from "@/lib/auth";
import { listBuildings, createBuilding, deleteBuilding } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function BuildingsPage() {
  const session = await requireSession();

  if (session.role !== "owner") {
    redirect("/dashboard");
  }

  const buildings = await listBuildings();

  async function handleAddBuilding(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    if (!name) return;
    await createBuilding({ name, address });
    revalidatePath("/buildings");
  }

  async function handleDeleteBuilding(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;
    await deleteBuilding(id);
    revalidatePath("/buildings");
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-ink)] mb-2">
          Building Management
        </h1>
        <p className="text-[var(--color-muted)] text-lg">
          Add or remove campus locations within your school system.
        </p>
      </header>

      <section className="bg-[var(--surface-1)] rounded-2xl shadow-xl border border-[var(--color-line)] p-8 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] rounded-full -mr-16 -mt-16 opacity-50 blur-3xl"></div>
        <h2 className="text-xl font-bold text-[var(--color-ink)] mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
          Register New Building
        </h2>
        <form action={handleAddBuilding} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--color-muted)] ml-1">Building Name</label>
            <input
              name="name"
              placeholder="e.g., East Wing Architecture"
              className="field-input"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--color-muted)] ml-1">Address (Optional)</label>
            <input
              name="address"
              placeholder="e.g., 42 Education St."
              className="field-input"
            />
          </div>
          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              className="btn btn--primary w-full md:w-auto justify-center px-10 py-3.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Building
            </button>
          </div>
        </form>
      </section>

      <section className="bg-[var(--surface-1)] rounded-2xl shadow-xl border border-[var(--color-line)] p-8">
        <h2 className="text-xl font-bold text-[var(--color-ink)] mb-8 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
          Active Buildings
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buildings.map((b) => (
            <div key={b.id} className="group p-5 border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-1)_76%,transparent)] rounded-2xl hover:border-[color-mix(in_srgb,var(--color-accent)_40%,var(--color-line))] hover:shadow-lg transition-all duration-300 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] text-[var(--color-accent)] border border-[var(--color-line)] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-bold text-[var(--color-ink)] truncate">{b.name}</h3>
                  <p className="text-sm text-[var(--color-muted)] truncate">{b.address || "No address provided"}</p>
                </div>
              </div>
               
              <form action={handleDeleteBuilding} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-x-2 group-hover:translate-x-0">
                <input type="hidden" name="id" value={b.id} />
                <button 
                  type="submit"
                  className="p-2.5 text-[var(--color-muted)] hover:text-[color-mix(in_srgb,var(--color-red)_90%,white)] hover:bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)] rounded-lg transition-all duration-200"
                  title="Remove Building"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </form>
            </div>
          ))}

          {buildings.length === 0 && (
            <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]">
              <p className="text-[var(--color-muted)] font-medium italic">No buildings registered yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
