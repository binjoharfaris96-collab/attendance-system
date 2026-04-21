import { 
  MessageSquare, 
  Layout, 
  PlusCircle, 
  FileText, 
  HelpCircle, 
  FolderPlus, 
  CheckSquare, 
  Camera, 
  Link as LinkIcon, 
  ArrowRight,
  UserCheck,
  Video,
  Upload,
  Layers,
  ClipboardList,
  BookOpen
} from "lucide-react";

export default function AssignmentsGuidePage() {
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-sm font-bold uppercase tracking-wider">
          Learning Hub
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[var(--color-ink)] tracking-tight">
          Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] to-purple-600">Digital Classroom</span>
        </h1>
        <p className="text-lg text-[var(--color-muted)] max-w-2xl mx-auto leading-relaxed">
          Unlock the full potential of Stream and Classwork to stay organized, communicate effectively, and excel in your studies.
        </p>
      </header>

      {/* Core Features: Stream & Classwork */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Stream Section */}
        <div className="group card p-8 border-t-4 border-t-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-7 h-7 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-4">The Stream</h2>
          <p className="text-[var(--color-muted)] leading-relaxed mb-6">
            Think of the Stream as your classroom's <strong>social heartbeat</strong>. It's a dynamic communication feed where everything happens in real-time.
          </p>
          <ul className="space-y-3">
            {[
              "View important announcements from teachers",
              "Get notified about newly posted materials",
              "Engage in discussions through comments",
              "Stay updated on upcoming events and deadlines"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--color-ink)]">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Classwork Section */}
        <div className="group card p-8 border-t-4 border-t-[var(--color-accent)] hover:shadow-2xl hover:shadow-[var(--color-accent)]/10 transition-all duration-500">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Layout className="w-7 h-7 text-[var(--color-accent)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-4">Classwork</h2>
          <p className="text-[var(--color-muted)] leading-relaxed mb-6">
            Classwork is your <strong>organized workspace</strong>. It's where the heavy lifting happens, neatly structured by topics and modules.
          </p>
          <ul className="space-y-3">
            {[
              "Access all assignments and projects",
              "Download study materials and resources",
              "Track your progress on graded tasks",
              "Find organized folders for each subject"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--color-ink)]">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Teacher Guide Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
            <PlusCircle className="w-5 h-5 text-purple-500" />
          </div>
          <h2 className="text-3xl font-bold text-[var(--color-ink)]">Teacher's Playbook</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--surface-2)] border border-[var(--color-line)]">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-500" />
                Creation Types
              </h3>
              <div className="space-y-4">
                {[
                  { title: "Assignment", desc: "For homework and projects", icon: FileText },
                  { title: "Quiz", desc: "Using Google Forms for testing", icon: CheckSquare },
                  { title: "Question", desc: "Short responses or polls", icon: HelpCircle },
                  { title: "Material", desc: "Resources, PDFs, and links", icon: FolderPlus }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[var(--surface-1)] border border-[var(--color-line)] flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[var(--color-muted)]" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[var(--color-ink)]">{item.title}</p>
                      <p className="text-xs text-[var(--color-muted)]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 card p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-[var(--color-muted)] flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  1. Prepare the Content
                </h4>
                <ul className="space-y-4">
                  <li className="text-sm flex gap-3">
                    <span className="font-bold text-purple-500">A</span>
                    <span><strong>Add Context:</strong> Provide a clear title and detailed instructions.</span>
                  </li>
                  <li className="text-sm flex gap-3">
                    <span className="font-bold text-purple-500">B</span>
                    <span><strong>Attach Files:</strong> Upload from your computer or select from Google Drive.</span>
                  </li>
                  <li className="text-sm flex gap-3">
                    <span className="font-bold text-purple-500">C</span>
                    <span><strong>Collaborate:</strong> Create new Google Docs/Slides directly in the task.</span>
                  </li>
                  <li className="text-sm flex gap-3">
                    <span className="font-bold text-purple-500">D</span>
                    <span><strong>External Links:</strong> Paste URLs for websites or YouTube videos.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-[var(--color-muted)] flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  2. Configure Settings
                </h4>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 dark:bg-purple-500/5 dark:border-purple-500/20">
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-1">Targeting</p>
                    <p className="text-xs text-[var(--color-muted)]">Assign to the whole class or differentiate for specific students.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/20">
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Grading & Deadlines</p>
                    <p className="text-xs text-[var(--color-muted)]">Set maximum points (or ungraded) and specific due dates with times.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 dark:bg-blue-500/5 dark:border-blue-500/20">
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">Organization</p>
                    <p className="text-xs text-[var(--color-muted)]">Assign to a Topic to keep the Classwork tab clean and searchable.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Guide Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-[var(--color-ink)]">Student's Journey</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              step: "01", 
              title: "Open Task", 
              desc: "Click on any assignment in Stream or Classwork to see full details.", 
              icon: BookOpen,
              color: "bg-blue-500"
            },
            { 
              step: "02", 
              title: "Do the Work", 
              desc: "Read instructions carefully and use attached resources to complete the task.", 
              icon: ClipboardList,
              color: "bg-purple-500"
            },
            { 
              step: "03", 
              title: "Submit Work", 
              desc: "Click 'Add or Create' to attach your files, then hit 'Turn In'.", 
              icon: Upload,
              color: "bg-emerald-500"
            },
            { 
              step: "04", 
              title: "Get Feedback", 
              desc: "Check back for teacher comments and your final grade.", 
              icon: CheckSquare,
              color: "bg-amber-500"
            }
          ].map((item, i) => (
            <div key={i} className="card p-6 flex flex-col items-center text-center space-y-4 hover:-translate-y-2 transition-transform">
              <div className={`w-12 h-12 rounded-full ${item.color} text-white flex items-center justify-center shadow-lg`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">Step {item.step}</span>
              <h3 className="font-bold text-[var(--color-ink)]">{item.title}</h3>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Submission Methods */}
        <div className="p-8 rounded-3xl bg-[var(--surface-1)] border-2 border-dashed border-[var(--color-line)]">
          <h3 className="text-xl font-bold text-center mb-8">How can you submit?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Upload Files", icon: Upload },
              { label: "Camera Photo", icon: Camera },
              { label: "Google Drive", icon: FolderPlus },
              { label: "External Link", icon: LinkIcon }
            ].map((method, i) => (
              <div key={i} className="flex flex-col items-center space-y-3 group">
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all">
                  <method.icon className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium">{method.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-10 border-t border-[var(--color-line)] text-center max-w-xl mx-auto">
            <p className="text-sm text-[var(--color-muted)]">
              <strong>Need help?</strong> You can always post a <strong>Private Comment</strong> directly to your teacher on the assignment page to ask questions without other students seeing them.
            </p>
          </div>
        </div>
      </section>

      {/* Footer / CTA */}
      <footer className="text-center py-10 bg-gradient-to-tr from-[var(--surface-2)] to-transparent rounded-[3rem] border border-[var(--color-line)]">
        <h3 className="text-xl font-bold mb-2">Ready to start?</h3>
        <p className="text-[var(--color-muted)] mb-6">Explore your dashboard and try posting a greeting in the Stream!</p>
      </footer>
    </div>
  );
}
