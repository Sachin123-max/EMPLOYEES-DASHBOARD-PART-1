
import {
  Sparkles,
  ClipboardCheck,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";

export function AuthShell({ children }) {
  const features = [
    {
      icon: ClipboardCheck,
      text: "Manage CRM and Helpdesk tasks in one dashboard",
    },
    {
      icon: CalendarClock,
      text: "Prioritize deadlines and overdue assignments",
    },
    {
      icon: ShieldCheck,
      text: "One workspace for employee productivity",
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left marketing panel */}
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-10 text-white lg:flex xl:p-14">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-400/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <Sparkles size={23} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              WorkFlow<span className="text-blue-200">.</span>
            </h1>
            <p className="text-xs text-white/65">
              Employee workspace
            </p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Your work, organized
          </span>

          <h2 className="mt-6 text-4xl font-bold leading-tight xl:text-5xl">
            Every task.
            <br />
            Every deadline.
            <br />
            One workspace.
          </h2>

          <p className="mt-5 max-w-md text-sm leading-7 text-white/75 xl:text-base">
            Keep track of your assignments, monitor deadlines and
            manage tasks from CRM and Helpdesk in one place.
          </p>

          <div className="mt-9 space-y-5">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <Icon size={19} />
                </div>
                <p className="text-sm text-white/90">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} WorkFlow Employee Dashboard
        </p>
      </section>

      {/* Form panel */}
      <section className="flex min-h-screen w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <Sparkles size={21} />
            </div>
            <span className="text-xl font-bold text-slate-900">
              WorkFlow<span className="text-blue-600">.</span>
            </span>
          </div>

          {children}
        </div>
      </section>
    </div>
  );
}
