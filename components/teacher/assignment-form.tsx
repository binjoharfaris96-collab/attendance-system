"use client";

import { useMemo, useState } from "react";
import {
  AlignLeft,
  Bold,
  BookOpen,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  FileQuestion,
  FileText,
  FileUp,
  FolderPlus,
  HelpCircle,
  Italic,
  Link as LinkIcon,
  List,
  Plus,
  PlusCircle,
  Radio,
  RefreshCcw,
  Trash2,
  Underline,
  Upload,
  Users,
  X,
  Play,
} from "lucide-react";

import { createAssignment } from "@/app/actions/assignments";
import { GoogleDrivePicker } from "@/components/google-drive-picker";

type TeacherClass = {
  id: string;
  name: string;
};

type ReusableAssignment = {
  id: string;
  title: string;
  description?: string | null;
  className: string;
  createdAt?: string | null;
  type?: string | null;
  topic?: string | null;
  points?: number | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
};

type ComposerMode = "assignment" | "quiz" | "question" | "material";

const modeMeta: Record<
  ComposerMode,
  {
    label: string;
    submitLabel: string;
    icon: React.ReactNode;
    titlePlaceholder: string;
    bodyPlaceholder: string;
  }
> = {
  assignment: {
    label: "Assignment",
    submitLabel: "Assign",
    icon: <ClipboardList className="h-5 w-5" />,
    titlePlaceholder: "Title*",
    bodyPlaceholder: "Instructions (optional)",
  },
  quiz: {
    label: "Quiz assignment",
    submitLabel: "Assign",
    icon: <CheckSquare className="h-5 w-5" />,
    titlePlaceholder: "Title*",
    bodyPlaceholder: "Instructions (optional)",
  },
  question: {
    label: "Question",
    submitLabel: "Ask",
    icon: <HelpCircle className="h-5 w-5" />,
    titlePlaceholder: "Question*",
    bodyPlaceholder: "Instructions (optional)",
  },
  material: {
    label: "Material",
    submitLabel: "Post",
    icon: <BookOpen className="h-5 w-5" />,
    titlePlaceholder: "Title*",
    bodyPlaceholder: "Description (optional)",
  },
};

function formatPostDate(value?: string | null) {
  if (!value) return "Draft";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Draft";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function AssignmentForm({
  classes,
  assignments = [],
}: {
  classes: TeacherClass[];
  assignments?: ReusableAssignment[];
}) {
  const [mode, setMode] = useState<ComposerMode | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [showReuseDialog, setShowReuseDialog] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [showQuestionTypes, setShowQuestionTypes] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [points, setPoints] = useState("100");
  const [dueDate, setDueDate] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [questionType, setQuestionType] = useState<"short" | "multiple">("short");
  const [studentsCanReply, setStudentsCanReply] = useState(true);
  const [studentsCanEdit, setStudentsCanEdit] = useState(false);
  const [copyAttachments, setCopyAttachments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeMode = mode ? modeMeta[mode] : null;
  const topics = useMemo(
    () =>
      Array.from(
        new Set(assignments.map((assignment) => assignment.topic).filter(Boolean) as string[]),
      ),
    [assignments],
  );

  function openComposer(nextMode: ComposerMode) {
    setMode(nextMode);
    setMenuOpen(false);
    setError(null);
    if (nextMode === "material") {
      setPoints("0");
      setDueDate("");
    } else if (!points || points === "0") {
      setPoints("100");
    }
  }

  function handleLink(label: string) {
    const url = window.prompt(`Enter the ${label} URL:`);
    if (url) {
      setAttachmentUrl(url);
      setAttachmentName(url.split("/").filter(Boolean).pop() || label);
    }
  }

  function handleCapture(accept: string) {
    const input = document.createElement("input");
    input.type = "file";
    if (accept) input.accept = accept;
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        setAttachmentUrl("#simulated-upload");
        setAttachmentName(file.name);
      }
    };
    input.click();
  }

  function applyReusablePost(assignment: ReusableAssignment) {
    const reusableMode = assignment.type === "quiz" ? "quiz" : assignment.type === "question" ? "question" : assignment.type === "material" ? "material" : "assignment";
    setMode(reusableMode);
    setTitle(assignment.title);
    setDescription(assignment.description || "");
    setTopic(assignment.topic || "");
    setPoints(String(assignment.points ?? (reusableMode === "material" ? 0 : 100)));
    setAttachmentUrl(assignment.attachmentUrl || "");
    setAttachmentName(assignment.attachmentName || "");
    setShowReuseDialog(false);
  }

  function resetComposer() {
    setMode(null);
    setTitle("");
    setDescription("");
    setTopic("");
    setPoints("100");
    setDueDate("");
    setAttachmentUrl("");
    setAttachmentName("");
    setQuestionType("short");
    setStudentsCanReply(true);
    setStudentsCanEdit(false);
    setError(null);
  }

  async function submitAssignment(formData: FormData) {
    setIsPending(true);
    setError(null);
    try {
      const result = await createAssignment(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      resetComposer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setIsPending(false);
    }
  }

  if (classes.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          You must be assigned to at least one class to create assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="btn btn--primary inline-flex items-center gap-2 rounded-full px-5"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
        {menuOpen ? (
          <div className="absolute left-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--surface-1)] shadow-2xl">
            <button type="button" onClick={() => openComposer("assignment")} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--surface-2)]">
              <ClipboardList className="h-5 w-5 text-[var(--color-accent)]" />
              Assignment
            </button>
            <button type="button" onClick={() => openComposer("quiz")} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--surface-2)]">
              <CheckSquare className="h-5 w-5 text-[var(--color-accent)]" />
              Quiz assignment
            </button>
            <button type="button" onClick={() => openComposer("question")} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--surface-2)]">
              <FileQuestion className="h-5 w-5 text-[var(--color-accent)]" />
              Question
            </button>
            <button type="button" onClick={() => openComposer("material")} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--surface-2)]">
              <BookOpen className="h-5 w-5 text-[var(--color-accent)]" />
              Material
            </button>
            <button type="button" onClick={() => { setShowReuseDialog(true); setMenuOpen(false); }} className="flex w-full items-center gap-3 border-t border-[var(--color-line)] px-4 py-3 text-left text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--surface-2)]">
              <RefreshCcw className="h-5 w-5 text-[var(--color-accent)]" />
              Reuse post
            </button>
            <button type="button" onClick={() => { setShowTopicDialog(true); setMenuOpen(false); }} className="flex w-full items-center gap-3 border-t border-[var(--color-line)] px-4 py-3 text-left text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--surface-2)]">
              <FolderPlus className="h-5 w-5 text-[var(--color-accent)]" />
              Topic
            </button>
          </div>
        ) : null}
      </div>

      {mode && activeMode ? (
        <form action={submitAssignment} className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--surface-1)] shadow-xl">
          <input type="hidden" name="assignmentType" value={mode === "quiz" ? "quiz" : mode} />
          <input type="hidden" name="topic" value={topic} />
          <input type="hidden" name="attachmentUrl" value={attachmentUrl} />
          <input type="hidden" name="attachmentName" value={attachmentName} />
          {mode === "question" ? (
            <>
              <input type="hidden" name="questionType" value={questionType} />
              <input type="hidden" name="studentsCanReply" value={String(studentsCanReply)} />
              <input type="hidden" name="studentsCanEdit" value={String(studentsCanEdit)} />
            </>
          ) : null}

          <div className="flex items-center gap-3 border-b border-[var(--color-line)] px-4 py-3">
            <button type="button" onClick={resetComposer} className="floating-action h-9 w-9" aria-label="Close composer">
              <X className="h-4 w-4" />
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-green-light)] text-[var(--color-green)]">
              {activeMode.icon}
            </span>
            <h2 className="text-xl font-black text-[var(--color-ink)]">{activeMode.label}</h2>
            <span className="ms-auto text-xs italic text-[var(--color-muted)]">Saved</span>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="btn btn--primary rounded-full px-5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Saving..." : activeMode.submitLabel}
            </button>
          </div>

          {error ? (
            <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
              {error}
            </div>
          ) : null}

          <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
            <main className="space-y-5 bg-[var(--surface-2)] p-4 sm:p-6 lg:p-8">
              <section className="rounded-xl border border-[var(--color-line)] bg-[var(--surface-1)] p-4">
                <div className={`grid gap-4 ${mode === "question" ? "md:grid-cols-[1fr_200px]" : ""}`}>
                  <label className="space-y-1">
                    <span className="sr-only">{activeMode.titlePlaceholder}</span>
                    <input
                      name="title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="input h-14 w-full border-0 border-b-2 border-[var(--color-accent)] bg-[var(--surface-2)] text-base font-semibold"
                      placeholder={activeMode.titlePlaceholder}
                      required
                    />
                    {!title.trim() ? (
                      <span className="text-xs font-semibold text-red-600">*Required</span>
                    ) : null}
                  </label>
                  {mode === "question" ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowQuestionTypes((open) => !open)}
                        className="input flex h-14 w-full items-center justify-between bg-[var(--surface-2)] text-left"
                      >
                        <span>
                          <span className="block text-xs font-bold text-[var(--color-accent)]">Question type</span>
                          <span className="text-sm font-semibold text-[var(--color-ink)]">
                            {questionType === "short" ? "Short answer" : "Multiple choice"}
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      {showQuestionTypes ? (
                        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--surface-1)] shadow-xl">
                          <button type="button" onClick={() => { setQuestionType("short"); setShowQuestionTypes(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--surface-2)]">
                            <AlignLeft className="h-4 w-4" />
                            Short answer
                          </button>
                          <button type="button" onClick={() => { setQuestionType("multiple"); setShowQuestionTypes(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--surface-2)]">
                            <Radio className="h-4 w-4" />
                            Multiple choice
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <textarea
                  name="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="input mt-5 min-h-40 w-full resize-y border-0 border-b border-[var(--color-line)] bg-[var(--surface-2)] py-4 text-sm"
                  placeholder={activeMode.bodyPlaceholder}
                />
                <div className="mt-3 flex items-center gap-4 text-[var(--color-muted)]">
                  <Bold className="h-4 w-4" />
                  <Italic className="h-4 w-4" />
                  <Underline className="h-4 w-4" />
                  <List className="h-4 w-4" />
                  <Trash2 className="h-4 w-4" />
                </div>

                {mode === "quiz" && !attachmentUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentUrl("#blank-quiz");
                      setAttachmentName("Blank Quiz");
                    }}
                    className="mt-4 flex w-full items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--surface-1)] p-3 text-left transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <span>
                      <span className="block text-sm font-bold text-[var(--color-ink)]">Blank Quiz</span>
                      <span className="text-xs text-[var(--color-muted)]">Google Forms-style quiz placeholder</span>
                    </span>
                    <FileText className="h-7 w-7 text-[var(--color-accent)]" />
                  </button>
                ) : null}

                {attachmentUrl ? (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--surface-1)] p-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[var(--color-ink)]">
                        {attachmentName || "Attached file"}
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">Attachment</span>
                    </span>
                    <button type="button" onClick={() => { setAttachmentUrl(""); setAttachmentName(""); }} className="floating-action h-8 w-8">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="rounded-xl border border-[var(--color-line)] bg-[var(--surface-1)] p-5">
                <p className="mb-5 text-sm font-black text-[var(--color-ink)]">Attach</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <AttachButton label="Drive" icon={<FileText className="h-5 w-5" />} onClick={() => setIsDrivePickerOpen(true)} />
                  <AttachButton label="YouTube" icon={<Play className="h-5 w-5" />} onClick={() => handleLink("YouTube")} />
                  <AttachButton label="Create" icon={<PlusCircle className="h-5 w-5" />} onClick={() => handleLink("Created file")} />
                  <AttachButton label="Upload" icon={<Upload className="h-5 w-5" />} onClick={() => handleCapture("")} />
                  <AttachButton label="Link" icon={<LinkIcon className="h-5 w-5" />} onClick={() => handleLink("Link")} />
                </div>
              </section>
            </main>

            <aside className="space-y-5 border-t border-[var(--color-line)] p-4 lg:border-l lg:border-t-0 lg:p-6">
              <label className="space-y-2">
                <span className="text-sm font-bold text-[var(--color-ink)]">For</span>
                <select name="classId" required className="input h-14 w-full bg-[var(--surface-2)]">
                  {classes.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <span className="text-sm font-bold text-[var(--color-ink)]">Assign to</span>
                <button type="button" className="btn btn--outline flex h-12 w-full items-center justify-center gap-2 rounded-full">
                  <Users className="h-4 w-4" />
                  All students
                </button>
              </div>

              {mode !== "material" ? (
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[var(--color-ink)]">Points</span>
                  <input name="points" type="number" min={0} value={points} onChange={(event) => setPoints(event.target.value)} className="input h-14 w-40 bg-[var(--surface-2)]" />
                </label>
              ) : (
                <input type="hidden" name="points" value="0" />
              )}

              {mode !== "material" ? (
                <label className="space-y-2">
                  <span className="text-sm font-bold text-[var(--color-ink)]">Due</span>
                  <input name="dueDate" type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="input h-14 w-full bg-[var(--surface-2)]" />
                  <span className="text-xs text-[var(--color-muted)]">Leave blank for no due date.</span>
                </label>
              ) : (
                <input type="hidden" name="dueDate" value="" />
              )}

              <label className="space-y-2">
                <span className="text-sm font-bold text-[var(--color-ink)]">Topic</span>
                <select value={topic} onChange={(event) => setTopic(event.target.value)} className="input h-14 w-full bg-[var(--surface-2)]">
                  <option value="">No topic</option>
                  {topics.map((existingTopic) => (
                    <option key={existingTopic} value={existingTopic}>
                      {existingTopic}
                    </option>
                  ))}
                </select>
              </label>

              {mode === "assignment" || mode === "quiz" ? (
                <div className="space-y-2">
                  <span className="text-sm font-bold text-[var(--color-ink)]">Rubric</span>
                  <button type="button" onClick={() => handleLink("Rubric")} className="btn btn--outline inline-flex rounded-full">
                    <Plus className="me-2 h-4 w-4" />
                    Rubric
                  </button>
                </div>
              ) : null}

              {mode === "question" ? (
                <div className="space-y-4 pt-2">
                  <label className="flex items-center gap-3 text-sm text-[var(--color-ink)]">
                    <input type="checkbox" checked={studentsCanReply} onChange={(event) => setStudentsCanReply(event.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
                    Students can reply to each other
                  </label>
                  <label className="flex items-center gap-3 text-sm text-[var(--color-ink)]">
                    <input type="checkbox" checked={studentsCanEdit} onChange={(event) => setStudentsCanEdit(event.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
                    Students can edit answer
                  </label>
                </div>
              ) : null}

              <label className="space-y-2">
                <span className="text-sm font-bold text-[var(--color-ink)]">Schedule</span>
                <input name="scheduledAt" type="datetime-local" className="input h-14 w-full bg-[var(--surface-2)]" />
              </label>
            </aside>
          </div>
        </form>
      ) : null}

      {showReuseDialog ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-[var(--surface-1)] shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[var(--color-line)] p-5">
              <button type="button" onClick={() => setShowReuseDialog(false)} className="floating-action h-9 w-9">
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-black text-[var(--color-ink)]">Select post</h2>
            </div>
            <div className="grid grid-cols-[1fr_180px_120px] border-b border-[var(--color-line)] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
              <span>Title</span>
              <span>Teacher</span>
              <span>Post date</span>
            </div>
            <div className="max-h-[48vh] overflow-y-auto">
              {assignments.length === 0 ? (
                <p className="p-8 text-sm text-[var(--color-muted)]">No posts are available to reuse yet.</p>
              ) : (
                assignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    type="button"
                    onClick={() => applyReusablePost(assignment)}
                    className="grid w-full grid-cols-[1fr_180px_120px] items-center gap-3 px-5 py-4 text-left hover:bg-[var(--surface-2)]"
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[var(--color-ink)]">
                          {assignment.title}
                        </span>
                        {assignment.description ? (
                          <span className="block truncate text-xs text-[var(--color-muted)]">
                            {assignment.description}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="text-sm text-[var(--color-muted)]">You</span>
                    <span className="text-sm text-[var(--color-muted)]">
                      {formatPostDate(assignment.createdAt)}
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--color-line)] p-5">
              <label className="flex items-center gap-3 text-sm text-[var(--color-ink)]">
                <input type="checkbox" checked={copyAttachments} onChange={(event) => setCopyAttachments(event.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
                Create new copies of all attachments
              </label>
              <button type="button" disabled className="btn btn--outline opacity-50">
                Reuse
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showTopicDialog ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface-1)] p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[var(--color-ink)]">Add topic</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Topics help organize classwork into modules or units.
            </p>
            <label className="mt-5 block space-y-1">
              <span className="sr-only">Topic</span>
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value.slice(0, 100))}
                className="input h-14 w-full border-b-2 border-[var(--color-accent)] bg-[var(--surface-2)]"
                placeholder="Topic*"
                maxLength={100}
              />
              <span className="flex justify-between text-xs text-[var(--color-muted)]">
                <span>{topic.trim() ? " " : "*Required"}</span>
                <span>{topic.length}/100</span>
              </span>
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowTopicDialog(false)} className="btn btn--outline">
                Cancel
              </button>
              <button type="button" disabled={!topic.trim()} onClick={() => setShowTopicDialog(false)} className="btn btn--primary disabled:opacity-50">
                Add topic
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <GoogleDrivePicker
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelect={(url, name) => {
          setAttachmentUrl(url);
          setAttachmentName(name);
        }}
        lang="en"
      />
    </div>
  );
}

function AttachButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--surface-1)] p-3 text-xs font-bold text-[var(--color-ink)] transition-colors hover:bg-[var(--surface-2)]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-accent)]">
        {icon}
      </span>
      {label}
    </button>
  );
}
