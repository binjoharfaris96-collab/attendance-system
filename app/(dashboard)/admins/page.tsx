import { requireSession } from "@/lib/auth";
import { listBuildings, listAdminsWithBuildings, updateUserBuilding } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function AdminsPage() {
  const session = await requireSession();

  if (session.role !== "owner") {
    redirect("/dashboard");
  }

  const [admins, buildings] = await Promise.all([
    listAdminsWithBuildings(),
    listBuildings()
  ]);

  async function handleAssignBuilding(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const buildingId = formData.get("buildingId") as string;
    if (!userId) return;
    
    // "" OR "null" means no building
    const bid = (buildingId === "" || buildingId === "null") ? null : buildingId;
    
    await updateUserBuilding(userId, bid);
    revalidatePath("/admins");
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Administrator Roles
          </h1>
          <p className="text-slate-500 text-lg">
            Manage permissions and assign administrators to specific buildings.
          </p>
        </div>
        <div className="hidden md:block">
           <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-sm font-bold flex items-center gap-2">
             <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
             System Overseer Mode
           </div>
        </div>
      </header>

      {/* Add New Admin Form */}
      <div className="mb-12 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-indigo-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Register New Administrator
        </h2>
        
        <form action={async (formData) => {
          "use server";
          const { createAdminAccountAction } = await import("@/app/actions/admin-management");
          const result = await createAdminAccountAction(formData);
          if (result?.error) {
            // In a real app we'd use useActionState for errors, but for simplicity here we'll just revalidate
          }
        }} className="grid md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
            <input 
              name="fullName" 
              type="text" 
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
            <input 
              name="email" 
              type="email" 
              placeholder="admin@school.com"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Initial Password</label>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Assign to Building</label>
            <div className="flex gap-2">
              <select
                name="buildingId"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
              >
                <option value="null">Global (No Building)</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <button 
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Create
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-sm font-bold text-slate-400 uppercase tracking-widest">Administrator</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-400 uppercase tracking-widest">Assigned Building</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-100 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50/40 transition-colors duration-150 group">
                  <td className="px-6 py-6 font-medium text-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm">
                        {admin.fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold">{admin.fullName}</span>
                        <span className="text-slate-500 text-xs font-medium">{admin.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter ${
                      admin.role === 'owner' 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-6 capitalize text-slate-600 font-medium">
                    {admin.buildingName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        {admin.buildingName}
                      </div>
                    ) : (
                      <span className="text-slate-300 italic flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-right">
                    {admin.role !== 'owner' ? (
                      <form action={handleAssignBuilding} className="inline-flex items-center gap-2">
                        <input type="hidden" name="userId" value={admin.id} />
                        <select
                          name="buildingId"
                          className="text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer group-hover:border-indigo-300"
                          defaultValue={admin.buildingId || ""}
                        >
                          <option value="null">No Building</option>
                          {buildings.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        <button 
                          type="submit"
                          className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-sm active:scale-95"
                        >
                          Save
                        </button>
                      </form>
                    ) : (
                      <span className="text-slate-300 text-xs italic font-medium">Global Access</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
