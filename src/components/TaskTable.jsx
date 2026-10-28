
import { ExternalLink, CalendarDays } from "lucide-react";
import { getTaskPriority } from "../utils/prioritizeTasks";

// Get task deadline
function getDeadline(task) {
  return task.deadline || task.dueDate || task.due_date || null;
}

// Get employee name
function getEmployee(task) {
  if (typeof task.employee === "string") {
    return task.employee;
  }

  return (
    task.employee?.name ||
    task.assignee?.name ||
    task.assignee ||
    task.assignedTo ||
    task.employeeName ||
    "Unassigned"
  );
}

// Get source application URL
function getTaskLink(task) {
  return (
    task.sourceUrl ||
    task.source_url ||
    task.url ||
    task.link ||
    task.ticketUrl ||
    task.ticket_url ||
    ""
  );
}

// Format date
function formatDate(value) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Normalize status
function normalizeStatus(status = "") {
  const value = String(status).toLowerCase().trim();

  if (
    ["done", "resolved", "closed", "complete", "completed"].includes(value)
  ) {
    return "Completed";
  }

  if (
    ["in_progress", "in-progress", "in progress", "working"].includes(value)
  ) {
    return "In Progress";
  }

  if (["open", "new", "todo", "to do", "pending"].includes(value)) {
    return "Pending";
  }

  if (value === "overdue") return "Overdue";

  return (
    value
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Pending"
  );
}

// Shared badge styles
const badgeBase =
  "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";

function PriorityBadge({ task }) {
  const priority = getTaskPriority(task) || "Medium";
  const value = String(priority).toLowerCase();

  const colors = {
    high: "bg-red-50 text-red-700 ring-1 ring-red-200",
    urgent: "bg-red-100 text-red-800 ring-1 ring-red-200",
    medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    low: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  };

  return (
    <span className={`${badgeBase} ${colors[value] || "bg-gray-100 text-gray-700"}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  const colors = {
    Pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    "In Progress": "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    Overdue: "bg-red-50 text-red-700 ring-1 ring-red-200",
  };

  return (
    <span
      className={`${badgeBase} ${
        colors[normalized] || "bg-gray-100 text-gray-700"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  );
}

function SourceBadge({ source }) {
  const name = String(source || "CRM");
  const isHelpdesk = name.toLowerCase().includes("helpdesk");

  return (
    <span
      className={`${badgeBase} ${
        isHelpdesk
          ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
          : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {name}
    </span>
  );
}

// Clickable link to the source application
function TaskLink({ task }) {
  const url = getTaskLink(task);

  if (!url) {
    return (
      <span className="text-xs text-gray-400">
        Link unavailable
      </span>
    );
  }

  try {
    const parsed = new URL(url, window.location.origin);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return (
        <span className="text-xs text-gray-400">
          Invalid link
        </span>
      );
    }

    return (
      <a
        href={parsed.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${task.title || task.name || "task"} in ${
          task.source || "source application"
        }`}
        title={`Open in ${task.source || "source application"}`}
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-blue-600 transition hover:text-blue-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Open task
        <ExternalLink size={14} aria-hidden="true" />
      </a>
    );
  } catch {
    return (
      <span className="text-xs text-gray-400">
        Invalid link
      </span>
    );
  }
}

// Empty state
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        <CalendarDays size={28} />
      </div>

      <h3 className="text-base font-semibold text-gray-900">
        No tasks found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Try changing your filters or search keywords.
      </p>
    </div>
  );
}

// Main TaskTable component
export default function TaskTable({ tasks = [] }) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="w-full">
      {/* Desktop and tablet table */}
      <div className="hidden w-full overflow-x-auto md:block">
        <table className="w-full min-w-[850px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {[
                "Task",
                "Employee",
                "Source",
                "Deadline",
                "Priority",
                "Status",
                "Action",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {tasks.map((task, index) => (
              <tr
                key={
                  task.id ??
                  task._id ??
                  `${task.source || "task"}-${index}`
                }
                className="transition-colors hover:bg-blue-50/40"
              >
                <td className="px-4 py-4">
                  <div className="flex min-w-[190px] max-w-[280px] flex-col gap-1">
                    <span className="font-semibold text-gray-900">
                      {task.title || task.name || "Untitled task"}
                    </span>

                    <span className="line-clamp-2 text-xs leading-5 text-gray-500">
                      {task.description ||
                        task.subject ||
                        "No description"}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4 text-gray-700">
                  {getEmployee(task)}
                </td>

                <td className="px-4 py-4">
                  <SourceBadge source={task.source} />
                </td>

                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2 whitespace-nowrap text-gray-600">
                    <CalendarDays
                      size={15}
                      className="text-gray-400"
                    />
                    {formatDate(getDeadline(task))}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <PriorityBadge task={task} />
                </td>

                <td className="px-4 py-4">
                  <StatusBadge
                    status={
                      task.effectiveStatus ||
                      task.status ||
                      task.rawStatus
                    }
                  />
                </td>

                <td className="px-4 py-4">
                  <TaskLink task={task} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile task cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {tasks.map((task, index) => (
          <article
            key={
              task.id ??
              task._id ??
              `${task.source || "task"}-${index}`
            }
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SourceBadge source={task.source} />
              <PriorityBadge task={task} />
            </div>

            <h3 className="mt-3 text-sm font-semibold leading-6 text-gray-900">
              {task.title || task.name || "Untitled task"}
            </h3>

            <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500">
              {task.description ||
                task.subject ||
                "No description"}
            </p>

            <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-500">Assigned to</span>
                <span className="text-right font-medium text-gray-700">
                  {getEmployee(task)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-500">Deadline</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
                  <CalendarDays size={13} />
                  {formatDate(getDeadline(task))}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-500">Status</span>
                <StatusBadge
                  status={
                    task.effectiveStatus ||
                    task.status ||
                    task.rawStatus
                  }
                />
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-3">
              <TaskLink task={task} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
