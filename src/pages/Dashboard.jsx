
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Headphones,
  LayoutDashboard,
  ListTodo,
  LoaderCircle,
  Menu,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Users,
  X,
  Zap,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "In Progress",
  "Completed",
];

const SOURCE_COLORS = {
  CRM: "#6658e8",
  Helpdesk: "#0d9488",
};

const PRIORITY_COLORS = {
  High: "border-rose-200 bg-rose-50 text-rose-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );
}

function extractTasks(payload) {
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.tasks,
    payload?.data,
    payload?.results,
    payload?.items,
    payload?.data?.tasks,
    payload?.data?.results,
    payload?.data?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function normalizeStatus(value) {
  const status = String(value || "Pending")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();

  if (
    ["completed", "complete", "done", "closed", "resolved"].includes(
      status
    )
  ) {
    return "Completed";
  }

  if (
    [
      "in progress",
      "inprogress",
      "processing",
      "ongoing",
      "working",
    ].includes(status)
  ) {
    return "In Progress";
  }

  return "Pending";
}

function safeUrl(value) {
  if (!value || typeof value !== "string") return "";

  try {
    const url = new URL(value, window.location.origin);

    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function normalizeTask(task, source, index) {
  const deadline = firstValue(
    task.deadline,
    task.dueDate,
    task.due_date,
    task.deadlineDate,
    task.deadline_date,
    task.endDate,
    task.end_date
  );

  const employeeValue = firstValue(
    task.employee,
    task.assignedTo,
    task.assigned_to,
    task.assignee,
    task.owner,
    task.employeeName,
    task.employee_name,
    task.user
  );

  const employee =
    typeof employeeValue === "object" &&
    employeeValue !== null
      ? firstValue(
          employeeValue.name,
          employeeValue.fullName,
          employeeValue.full_name,
          employeeValue.email
        )
      : employeeValue;

  const rawPriority = String(
    firstValue(
      task.priority,
      task.urgency,
      task.severity,
      "Medium"
    )
  ).toLowerCase();

  let priority = "Medium";

  if (
    ["high", "urgent", "critical", "p1", "1"].includes(
      rawPriority
    )
  ) {
    priority = "High";
  } else if (
    ["low", "minor", "p3", "3"].includes(rawPriority)
  ) {
    priority = "Low";
  }

  return {
    ...task,
    id: String(
      firstValue(
        task.id,
        task._id,
        task.taskId,
        task.task_id,
        `${source.toLowerCase()}-${index + 1}`
      )
    ),
    title: String(
      firstValue(
        task.title,
        task.name,
        task.subject,
        task.taskName,
        task.task_name,
        "Untitled task"
      )
    ),
    description: String(
      firstValue(
        task.description,
        task.details,
        task.summary,
        task.ticketDescription,
        ""
      )
    ),
    status: normalizeStatus(
      firstValue(
        task.status,
        task.taskStatus,
        task.task_status
      )
    ),
    priority,
    source,
    employee: String(employee || "Unassigned"),
    deadline: deadline || null,
    sourceUrl: safeUrl(
      firstValue(
        task.sourceUrl,
        task.source_url,
        task.taskUrl,
        task.task_url,
        task.url,
        task.link,
        task.ticketUrl,
        task.ticket_url
      )
    ),
    category: String(
      firstValue(task.category, task.type, task.department, source)
    ),
  };
}

function getDeadlineDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isOverdue(task) {
  if (task.status === "Completed") return false;

  const deadline = getDeadlineDate(task.deadline);

  return deadline
    ? deadline.getTime() < Date.now()
    : false;
}

function isDueSoon(task) {
  if (task.status === "Completed") return false;

  const deadline = getDeadlineDate(task.deadline);

  if (!deadline) return false;

  const remaining = deadline.getTime() - Date.now();

  return remaining >= 0 &&
    remaining <= 24 * 60 * 60 * 1000;
}

function getPriority(task) {
  if (task.status === "Completed") return "Low";

  if (isOverdue(task) || isDueSoon(task)) return "High";

  return task.priority || "Medium";
}

function formatDate(value) {
  const date = getDeadlineDate(value);

  if (!date) return "No deadline";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeLeft(value) {
  const deadline = getDeadlineDate(value);

  if (!deadline) return "No deadline set";

  const diff = deadline.getTime() - Date.now();

  if (diff < 0) {
    const hours = Math.floor(Math.abs(diff) / 3600000);

    return hours < 24
      ? `Overdue by ${Math.max(1, hours)} hour(s)`
      : `Overdue by ${Math.floor(hours / 24)} day(s)`;
  }

  const hours = Math.floor(diff / 3600000);

  if (hours < 1) return "Due in less than an hour";

  if (hours < 24) return `Due in ${hours} hour(s)`;

  return `Due in ${Math.floor(hours / 24)} day(s)`;
}

function getInitials(name) {
  return String(name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

/* Reusable components */

function Card({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    "In Progress": "border-blue-200 bg-blue-50 text-blue-700",
    Pending: "border-slate-200 bg-slate-100 text-slate-600",
  };

  const Icon =
    status === "Completed"
      ? CheckCircle2
      : status === "In Progress"
        ? Activity
        : Clock3;

  return (
    <Badge className={styles[status] || styles.Pending}>
      <Icon size={12} />
      {status}
    </Badge>
  );
}

function PriorityBadge({ priority }) {
  const Icon =
    priority === "High"
      ? ArrowUpRight
      : priority === "Medium"
        ? ArrowRight
        : ArrowDownRight;

  return (
    <Badge
      className={
        PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium
      }
    >
      <Icon size={12} />
      {priority}
    </Badge>
  );
}

function SourceBadge({ source }) {
  const crm = source === "CRM";

  return (
    <Badge
      className={
        crm
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-teal-200 bg-teal-50 text-teal-700"
      }
    >
      {crm ? (
        <BriefcaseBusiness size={12} />
      ) : (
        <Headphones size={12} />
      )}
      {source}
    </Badge>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
            {eyebrow}
          </p>
        )}

        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon = ListTodo,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
      <div className="mb-3 rounded-2xl bg-slate-100 p-4 text-slate-400">
        <Icon size={27} />
      </div>

      <h3 className="font-semibold text-slate-800">{title}</h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  percent,
}) {
  const themes = {
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Card className="group p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={cn(
            "rounded-xl p-3",
            themes[color] || themes.violet
          )}
        >
          <Icon size={21} />
        </div>
      </div>

      {percent !== undefined && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{
              width: `${Math.min(100, Math.max(0, percent))}%`,
            }}
          />
        </div>
      )}
    </Card>
  );
}

/* Task details drawer */

function TaskDetailsPanel({
  task,
  onClose,
  onComplete,
}) {
  if (!task) return null;

  const overdue = isOverdue(task);
  const priority = getPriority(task);

  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-details-title"
    >
      <button
        type="button"
        aria-label="Close task details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-slate-950/40 backdrop-blur-[2px]"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
              Workspace / Task
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Task overview and actions
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <div className="mb-5 flex flex-wrap gap-2">
            <SourceBadge source={task.source} />
            <StatusBadge status={task.status} />
            <PriorityBadge priority={priority} />
          </div>

          <h2
            id="task-details-title"
            className="break-words text-2xl font-bold leading-tight text-slate-900"
          >
            {task.title}
          </h2>

          <p className="mt-3 break-words text-sm leading-6 text-slate-600">
            {task.description ||
              "No description has been provided for this task."}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <ListTodo size={16} /> Task ID
              </p>

              <p className="mt-2 break-all font-semibold text-slate-900">
                {task.id}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} /> Assigned employee
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                  {getInitials(task.employee)}
                </span>

                <span className="break-words text-sm font-semibold text-slate-900">
                  {task.employee}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarClock size={16} /> Deadline
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {formatDate(task.deadline)}
              </p>

              <p
                className={cn(
                  "mt-1 text-sm font-medium",
                  overdue ? "text-rose-600" : "text-slate-500"
                )}
              >
                {getTimeLeft(task.deadline)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2 text-violet-600 shadow-sm">
                <Sparkles size={18} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Priority assessment
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {task.status === "Completed"
                    ? "This task has been completed."
                    : overdue
                      ? "This task is overdue. Review it as soon as possible."
                      : isDueSoon(task)
                        ? "The deadline is approaching. Prioritize this task."
                        : priority === "High"
                          ? "Handle this high-priority task before lower-priority work."
                          : priority === "Medium"
                            ? "Keep this task active and finish it before its deadline."
                            : "Complete this task after urgent work."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">
              Task information
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Source</span>
                <SourceBadge source={task.source} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Category</span>
                <span className="text-right font-medium text-slate-800">
                  {task.category}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={task.status} />
              </div>
            </div>
          </div>

          {task.sourceUrl && (
            <a
              href={task.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
            >
              Open original {task.source} task
              <ExternalLink size={16} />
            </a>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          {task.status !== "Completed" && (
            <button
              type="button"
              onClick={() => onComplete(task)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <Check size={17} />
              Mark completed
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

/* Main dashboard */

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const overviewRef = useRef(null);
  const taskSectionRef = useRef(null);
  const analyticsRef = useRef(null);
  const scheduleRef = useRef(null);

  const loadTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrors([]);

    const endpoints = [
      {
        source: "CRM",
        url: `${API_URL}/api/crm/tasks`,
      },
      {
        source: "Helpdesk",
        url: `${API_URL}/api/helpdesk/tasks`,
      },
    ];

    try {
      const results = await Promise.allSettled(
        endpoints.map(async ({ source, url }) => {
          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(
              `${source} API returned ${response.status}`
            );
          }

          const payload = await response.json();

          return extractTasks(payload).map((task, index) =>
            normalizeTask(task, source, index)
          );
        })
      );

      const loadedTasks = [];
      const failedSources = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          loadedTasks.push(...result.value);
        } else {
          failedSources.push(
            `${endpoints[index].source}: ${
              result.reason?.message || "Could not load tasks"
            }`
          );
        }
      });

      setTasks(loadedTasks);
      setErrors(failedSources);

      if (isRefresh) {
        setNotice(
          failedSources.length
            ? "Refresh finished, but some task data could not load."
            : "Tasks refreshed successfully."
        );
      }
    } catch (error) {
      setErrors([error.message || "Could not load tasks."]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(
      () => setNotice(""),
      3500
    );

    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!selectedTask) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedTask(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedTask]);

  const employees = useMemo(
    () =>
      [
        ...new Set(
          tasks
            .map((task) => task.employee)
            .filter(
              (employee) =>
                employee && employee !== "Unassigned"
            )
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [tasks]
  );

  const stats = useMemo(() => {
    const completed = tasks.filter(
      (task) => task.status === "Completed"
    ).length;

    const inProgress = tasks.filter(
      (task) => task.status === "In Progress"
    ).length;

    const pending = tasks.filter(
      (task) => task.status === "Pending"
    ).length;

    const overdue = tasks.filter(isOverdue).length;

    const highPriority = tasks.filter(
      (task) =>
        getPriority(task) === "High" &&
        task.status !== "Completed"
    ).length;

    return {
      total: tasks.length,
      completed,
      inProgress,
      pending,
      overdue,
      highPriority,
      completionRate: tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        [
          task.title,
          task.description,
          task.id,
          task.employee,
          task.source,
          task.category,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      return (
        matchesSearch &&
        (statusFilter === "All" ||
          task.status === statusFilter) &&
        (sourceFilter === "All" ||
          task.source === sourceFilter) &&
        (employeeFilter === "All" ||
          task.employee === employeeFilter) &&
        (priorityFilter === "All" ||
          getPriority(task) === priorityFilter)
      );
    });
  }, [
    tasks,
    search,
    statusFilter,
    sourceFilter,
    employeeFilter,
    priorityFilter,
  ]);

  const priorityTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.status !== "Completed")
        .sort((a, b) => {
          const rank = {
            High: 0,
            Medium: 1,
            Low: 2,
          };

          const difference =
            rank[getPriority(a)] - rank[getPriority(b)];

          if (difference !== 0) return difference;

          const dateA =
            getDeadlineDate(a.deadline)?.getTime() ?? Infinity;

          const dateB =
            getDeadlineDate(b.deadline)?.getTime() ?? Infinity;

          return dateA - dateB;
        })
        .slice(0, 5),
    [tasks]
  );

  const statusChartData = useMemo(
    () => [
      {
        name: "Pending",
        value: stats.pending,
        color: "#94a3b8",
      },
      {
        name: "In Progress",
        value: stats.inProgress,
        color: "#6658e8",
      },
      {
        name: "Completed",
        value: stats.completed,
        color: "#10b981",
      },
    ],
    [stats]
  );

  const sourceChartData = useMemo(
    () => [
      {
        name: "CRM",
        tasks: tasks.filter((task) => task.source === "CRM")
          .length,
      },
      {
        name: "Helpdesk",
        tasks: tasks.filter(
          (task) => task.source === "Helpdesk"
        ).length,
      },
    ],
    [tasks]
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("All");
    setSourceFilter("All");
    setEmployeeFilter("All");
    setPriorityFilter("All");
  }, []);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "All" ||
    sourceFilter !== "All" ||
    employeeFilter !== "All" ||
    priorityFilter !== "All";

  const completeTask = useCallback((task) => {
    setTasks((current) =>
      current.map((item) =>
        item.source === task.source && item.id === task.id
          ? { ...item, status: "Completed" }
          : item
      )
    );

    setSelectedTask((current) =>
      current &&
      current.source === task.source &&
      current.id === task.id
        ? { ...current, status: "Completed" }
        : current
    );

    setNotice(
      "Task marked completed in this dashboard session."
    );
  }, []);

  const navigateToSection = useCallback(
    (section) => {
      setActiveSection(section);
      setMobileMenu(false);

      if (section === "tasks") {
        clearFilters();
        setFiltersOpen(false);
      }

      const targets = {
        overview: overviewRef,
        tasks: taskSectionRef,
        analytics: analyticsRef,
        schedule: scheduleRef,
      };

      const target = targets[section]?.current;

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    },
    [clearFilters]
  );

  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "tasks",
      label: "My Tasks",
      icon: ListTodo,
      count: stats.total,
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: CalendarDays,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: Activity,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      {/* Fixed desktop sidebar */}
      <aside
        className="
          fixed inset-y-0 left-0 z-40 hidden
          h-screen w-[230px] flex-col
          overflow-y-auto overflow-x-hidden
          border-r border-slate-200 bg-white
          px-3 py-3 lg:flex
        "
      >
        {/* Brand */}
        <button
          type="button"
          onClick={() => navigateToSection("overview")}
          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
            <Zap size={19} />
          </div>

          <div className="min-w-0">
            <p className="text-base font-extrabold tracking-tight">
              WorkFlow
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              Employee workspace
            </p>
          </div>
        </button>

        {/* Navigation */}
        <div className="mt-5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToSection(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-violet-50 font-semibold text-violet-700"
                      : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>

                  {item.count !== undefined && (
                    <span
                      className={cn(
                        "ml-auto rounded-md px-2 py-0.5 text-xs",
                        active
                          ? "bg-violet-100 text-violet-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Connected apps */}
        <div className="mt-5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Connected apps
          </p>

          {[
            {
              name: "CRM",
              icon: BriefcaseBusiness,
              color: "bg-violet-50 text-violet-600",
            },
            {
              name: "Helpdesk",
              icon: Headphones,
              color: "bg-teal-50 text-teal-600",
            },
          ].map((app) => {
            const Icon = app.icon;

            return (
              <div
                key={app.name}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    app.color
                  )}
                >
                  <Icon size={16} />
                </span>

                <span className="text-sm font-medium text-slate-600">
                  {app.name}
                </span>

                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
              </div>
            );
          })}
        </div>

        {/* Compact sidebar footer */}
        <div className="mt-auto pt-5">
          <div className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 p-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={17} />
              <p className="text-sm font-semibold">
                Stay productive
              </p>
            </div>

            <p className="mt-1 text-xs leading-5 text-violet-100">
              Focus on urgent tasks and manage your deadlines.
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2.5 border-t border-slate-100 pt-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
              EM
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                Employee
              </p>
              <p className="text-xs text-slate-400">
                Task workspace
              </p>
            </div>

            <button
              type="button"
              aria-label="Settings"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content offset keeps sidebar fixed */}
      <main className="min-w-0 lg:ml-[230px]">
        {/* Sticky header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 xl:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileMenu((value) => !value)
                }
                className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
                aria-label="Toggle navigation"
                aria-expanded={mobileMenu}
              >
                {mobileMenu ? (
                  <X size={19} />
                ) : (
                  <Menu size={19} />
                )}
              </button>

              <div className="min-w-0">
                <p className="hidden text-xs text-slate-400 sm:block">
                  Workspace /{" "}
                  {navItems.find(
                    (item) => item.id === activeSection
                  )?.label || "Overview"}
                </p>

                <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                  Employee dashboard
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 sm:flex">
                <CalendarDays
                  size={15}
                  className="text-slate-400"
                />
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>

              <button
                type="button"
                onClick={() => loadTasks(true)}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60 sm:px-4"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>

              <button
                type="button"
                aria-label="Notifications"
                className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
              >
                <Bell size={18} />

                {stats.overdue > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
                )}
              </button>

              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 sm:flex">
                EM
              </div>
            </div>
          </div>
        </header>

        {/* Mobile navigation */}
        {mobileMenu && (
          <div className="border-b border-slate-200 bg-white p-3 lg:hidden">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      navigateToSection(item.id)
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                      active
                        ? "bg-violet-50 font-semibold text-violet-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}

                    {item.count !== undefined && (
                      <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-2 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600">
                <BriefcaseBusiness size={18} />
                CRM
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600">
                <Headphones size={18} />
                Helpdesk
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        )}

        {/* Dashboard content */}
        <div className="mx-auto max-w-[1550px] space-y-6 px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
          {notice && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} />
                {notice}
              </span>

              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>
                  <h3 className="font-semibold text-amber-900">
                    Some task data could not be loaded
                  </h3>

                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-amber-800">
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>

                  <p className="mt-2 text-xs text-amber-700">
                    Check that your backend is running and both
                    API endpoints are available.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[55vh] flex-col items-center justify-center">
              <LoaderCircle
                size={36}
                className="animate-spin text-violet-600"
              />

              <p className="mt-4 font-semibold text-slate-700">
                Loading your dashboard...
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Fetching CRM and Helpdesk tasks
              </p>
            </div>
          ) : (
            <>
              {/* Overview */}
              <section
                ref={overviewRef}
                id="overview"
                className="scroll-mt-24"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                      Your productivity hub
                    </p>

                    <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                      Good work starts here.
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      Track your workload, prioritize important
                      tasks and stay on top of deadlines.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:self-auto">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    CRM + Helpdesk connected
                  </div>
                </div>
              </section>

              {/* Summary metrics */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                <MetricCard
                  title="Total tasks"
                  value={stats.total}
                  subtitle="Across connected applications"
                  icon={ListTodo}
                  color="violet"
                  percent={100}
                />

                <MetricCard
                  title="Pending"
                  value={stats.pending}
                  subtitle="Waiting to be started"
                  icon={Clock3}
                  color="amber"
                  percent={
                    stats.total
                      ? (stats.pending / stats.total) * 100
                      : 0
                  }
                />

                <MetricCard
                  title="In progress"
                  value={stats.inProgress}
                  subtitle="Currently being worked on"
                  icon={Activity}
                  color="blue"
                  percent={
                    stats.total
                      ? (stats.inProgress / stats.total) * 100
                      : 0
                  }
                />

                <MetricCard
                  title="Overdue"
                  value={stats.overdue}
                  subtitle="Past deadline and unfinished"
                  icon={AlertTriangle}
                  color="rose"
                  percent={
                    stats.total
                      ? (stats.overdue / stats.total) * 100
                      : 0
                  }
                />
              </section>

              {/* Progress and status chart */}
              <section className="grid grid-cols-1 gap-5 2xl:grid-cols-5">
                <Card className="overflow-hidden p-5 sm:p-6 2xl:col-span-3">
                  <SectionHeading
                    eyebrow="Performance"
                    title="Your progress"
                    subtitle="Completion status across all tasks"
                  />

                  <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div
                      className="flex h-36 w-36 shrink-0 items-center justify-center self-center rounded-full border-[10px] border-violet-50 sm:self-auto"
                      style={{
                        background: `conic-gradient(#6658e8 ${stats.completionRate}%, #ede9fe ${stats.completionRate}% 100%)`,
                      }}
                    >
                      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                        <span className="text-3xl font-extrabold">
                          {stats.completionRate}%
                        </span>

                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Completed
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-slate-900">
                        {stats.completed} of {stats.total} tasks done
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Focus on approaching deadlines and
                        finish urgent tasks first.
                      </p>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-violet-600 transition-all"
                          style={{
                            width: `${stats.completionRate}%`,
                          }}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Pending
                          </p>
                          <p className="mt-1 text-xl font-bold">
                            {stats.pending}
                          </p>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3">
                          <p className="text-xs text-blue-600">
                            Active
                          </p>
                          <p className="mt-1 text-xl font-bold text-blue-700">
                            {stats.inProgress}
                          </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-600">
                            Done
                          </p>
                          <p className="mt-1 text-xl font-bold text-emerald-700">
                            {stats.completed}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card
                  ref={undefined}
                  className="p-5 sm:p-6 2xl:col-span-2"
                >
                  <SectionHeading
                    eyebrow="Breakdown"
                    title="Task status"
                    subtitle="Distribution by current status"
                  />

                  {stats.total === 0 ? (
                    <EmptyState
                      title="No task data"
                      description="Tasks will appear once an API returns data."
                    />
                  ) : (
                    <>
                      <div className="h-48">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <PieChart>
                            <Pie
                              data={statusChartData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={48}
                              outerRadius={72}
                              paddingAngle={4}
                            >
                              {statusChartData.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={entry.color}
                                  stroke="none"
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-3">
                        {statusChartData.map((entry) => (
                          <div
                            key={entry.name}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="flex items-center gap-2 text-slate-600">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor: entry.color,
                                }}
                              />
                              {entry.name}
                            </span>

                            <span className="font-bold text-slate-900">
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              </section>

              {/* Priority inbox */}
              <section>
                <SectionHeading
                  eyebrow="Smart prioritization"
                  title="Focus on what matters"
                  subtitle="Unfinished tasks ranked by urgency and deadline."
                  action={
                    <Badge className="border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700">
                      <Zap size={12} />
                      {stats.highPriority} high priority
                    </Badge>
                  }
                />

                <Card className="overflow-hidden">
                  {priorityTasks.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title="You're all caught up"
                      description="There are no unfinished tasks in your current task list."
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {priorityTasks.map((task, index) => (
                        <div
                          key={`${task.source}-${task.id}`}
                          className="flex flex-col gap-4 p-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-5"
                        >
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                              getPriority(task) === "High"
                                ? "bg-rose-50 text-rose-600"
                                : getPriority(task) === "Medium"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-emerald-50 text-emerald-600"
                            )}
                          >
                            {getPriority(task) === "High" ? (
                              <AlertTriangle size={19} />
                            ) : (
                              <Timer size={19} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Priority #{index + 1}
                              </span>

                              <SourceBadge source={task.source} />
                              <PriorityBadge
                                priority={getPriority(task)}
                              />
                            </div>

                            <h3 className="mt-2 break-words font-semibold text-slate-900">
                              {task.title}
                            </h3>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <Users size={13} />
                                {task.employee}
                              </span>

                              <span
                                className={cn(
                                  "flex items-center gap-1.5",
                                  isOverdue(task) &&
                                    "font-semibold text-rose-600"
                                )}
                              >
                                <Clock3 size={13} />
                                {getTimeLeft(task.deadline)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className="inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 sm:self-center"
                          >
                            Details <ArrowRight size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </section>

              {/* Analytics */}
              <section
                ref={analyticsRef}
                id="analytics"
                className="scroll-mt-24"
              >
                <Card className="p-5 sm:p-6">
                  <SectionHeading
                    eyebrow="Connected applications"
                    title="Tasks by source"
                    subtitle="Compare workload from CRM and Helpdesk."
                  />

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-center">
                    <div className="space-y-4">
                      {sourceChartData.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center gap-3"
                        >
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `${SOURCE_COLORS[entry.name]}15`,
                              color: SOURCE_COLORS[entry.name],
                            }}
                          >
                            {entry.name === "CRM" ? (
                              <BriefcaseBusiness size={18} />
                            ) : (
                              <Headphones size={18} />
                            )}
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                              {entry.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Tasks loaded
                            </p>
                          </div>

                          <p className="text-xl font-bold">
                            {entry.tasks}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="h-56 lg:col-span-2">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={sourceChartData}
                          margin={{
                            top: 10,
                            right: 12,
                            left: -18,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e2e8f0"
                          />

                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                          />

                          <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                          />

                          <Tooltip />

                          <Bar
                            dataKey="tasks"
                            name="Tasks"
                            radius={[7, 7, 0, 0]}
                            maxBarSize={72}
                          >
                            {sourceChartData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={SOURCE_COLORS[entry.name]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Schedule */}
              <section
                ref={scheduleRef}
                id="schedule"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow="Upcoming deadlines"
                  title="Schedule"
                  subtitle="Your next deadlines, ordered by date."
                />

                <Card className="overflow-hidden">
                  {tasks.filter(
                    (task) =>
                      task.status !== "Completed" &&
                      getDeadlineDate(task.deadline)
                  ).length === 0 ? (
                    <EmptyState
                      icon={CalendarDays}
                      title="No upcoming deadlines"
                      description="Tasks with deadlines will appear here."
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {[...tasks]
                        .filter(
                          (task) =>
                            task.status !== "Completed" &&
                            getDeadlineDate(task.deadline)
                        )
                        .sort(
                          (a, b) =>
                            getDeadlineDate(a.deadline).getTime() -
                            getDeadlineDate(b.deadline).getTime()
                        )
                        .slice(0, 8)
                        .map((task) => (
                          <button
                            key={`${task.source}-${task.id}`}
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 sm:px-5"
                          >
                            <span
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                isOverdue(task)
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-violet-50 text-violet-600"
                              )}
                            >
                              <CalendarClock size={18} />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-900">
                                {task.title}
                              </span>
                              <span className="mt-1 block text-xs text-slate-500">
                                {formatDate(task.deadline)}
                              </span>
                            </span>

                            <span className="hidden text-xs text-slate-500 sm:block">
                              {getTimeLeft(task.deadline)}
                            </span>

                            <ArrowRight
                              size={16}
                              className="shrink-0 text-slate-400"
                            />
                          </button>
                        ))}
                    </div>
                  )}
                </Card>
              </section>

              {/* All tasks */}
              <section
                ref={taskSectionRef}
                id="my-tasks"
                className="scroll-mt-24"
              >
                <SectionHeading
                  eyebrow="Task management"
                  title="All Tasks"
                  subtitle={`${filteredTasks.length} task(s) match your current filters.`}
                  action={
                    <button
                      type="button"
                      onClick={() =>
                        setFiltersOpen((open) => !open)
                      }
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                        filtersOpen
                          ? "border-violet-200 bg-violet-50 text-violet-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <SlidersHorizontal size={15} />
                      Filters

                      <ChevronDown
                        size={15}
                        className={cn(
                          "transition-transform",
                          filtersOpen && "rotate-180"
                        )}
                      />
                    </button>
                  }
                />

                <Card className="overflow-hidden">
                  {/* Search */}
                  <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="relative w-full sm:max-w-md">
                      <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                        placeholder="Search by task, employee or ID..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {filteredTasks.length} results
                      </span>

                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-sm font-semibold text-violet-600 hover:text-violet-800"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filters */}
                  {filtersOpen && (
                    <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
                      <label className="text-xs font-semibold text-slate-600">
                        Status

                        <select
                          value={statusFilter}
                          onChange={(event) =>
                            setStatusFilter(event.target.value)
                          }
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-xs font-semibold text-slate-600">
                        Source

                        <select
                          value={sourceFilter}
                          onChange={(event) =>
                            setSourceFilter(event.target.value)
                          }
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                        >
                          <option value="All">All sources</option>
                          <option value="CRM">CRM</option>
                          <option value="Helpdesk">Helpdesk</option>
                        </select>
                      </label>

                      <label className="text-xs font-semibold text-slate-600">
                        Employee

                        <select
                          value={employeeFilter}
                          onChange={(event) =>
                            setEmployeeFilter(event.target.value)
                          }
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                        >
                          <option value="All">All employees</option>

                          {employees.map((employee) => (
                            <option key={employee} value={employee}>
                              {employee}
                            </option>
                          ))}

                          {tasks.some(
                            (task) =>
                              task.employee === "Unassigned"
                          ) && (
                            <option value="Unassigned">
                              Unassigned
                            </option>
                          )}
                        </select>
                      </label>

                      <label className="text-xs font-semibold text-slate-600">
                        Priority

                        <select
                          value={priorityFilter}
                          onChange={(event) =>
                            setPriorityFilter(event.target.value)
                          }
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-violet-400"
                        >
                          <option value="All">All priorities</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-slate-50/80 text-[10px] uppercase tracking-[0.15em] text-slate-400">
                        <tr>
                          <th className="px-5 py-4 font-bold">
                            Task
                          </th>
                          <th className="px-4 py-4 font-bold">
                            Source
                          </th>
                          <th className="px-4 py-4 font-bold">
                            Assignee
                          </th>
                          <th className="px-4 py-4 font-bold">
                            Priority
                          </th>
                          <th className="px-4 py-4 font-bold">
                            Deadline
                          </th>
                          <th className="px-4 py-4 font-bold">
                            Status
                          </th>
                          <th className="px-4 py-4 text-right font-bold">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredTasks.map((task) => (
                          <tr
                            key={`${task.source}-${task.id}`}
                            className="transition hover:bg-violet-50/30"
                          >
                            <td className="max-w-[290px] px-5 py-4">
                              <p className="break-words font-semibold text-slate-900">
                                {task.title}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-400">
                                ID: {task.id}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <SourceBadge source={task.source} />
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                  {getInitials(task.employee)}
                                </span>

                                <span className="max-w-[150px] truncate text-sm text-slate-700">
                                  {task.employee}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <PriorityBadge
                                priority={getPriority(task)}
                              />
                            </td>

                            <td className="px-4 py-4">
                              <p
                                className={cn(
                                  "whitespace-nowrap text-sm",
                                  isOverdue(task)
                                    ? "font-semibold text-rose-600"
                                    : "text-slate-700"
                                )}
                              >
                                {formatDate(task.deadline)}
                              </p>

                              {task.deadline &&
                                task.status !== "Completed" && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    {getTimeLeft(task.deadline)}
                                  </p>
                                )}
                            </td>

                            <td className="px-4 py-4">
                              <StatusBadge status={task.status} />
                            </td>

                            <td className="px-4 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTask(task)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                              >
                                Details <ArrowRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredTasks.length === 0 && (
                      <EmptyState
                        title="No tasks found"
                        description="Try changing your search or clearing the selected filters."
                        icon={Search}
                      />
                    )}
                  </div>

                  {/* Responsive mobile cards */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {filteredTasks.map((task) => (
                      <div
                        key={`${task.source}-${task.id}`}
                        className="space-y-3 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words font-semibold text-slate-900">
                              {task.title}
                            </h3>

                            <p className="mt-1 break-all text-xs text-slate-400">
                              ID: {task.id}
                            </p>
                          </div>

                          <SourceBadge source={task.source} />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={task.status} />
                          <PriorityBadge
                            priority={getPriority(task)}
                          />
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
                            <Users
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                            {task.employee}
                          </p>

                          <p
                            className={cn(
                              "flex items-start gap-2",
                              isOverdue(task) &&
                                "font-medium text-rose-600"
                            )}
                          >
                            <CalendarDays
                              size={15}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />

                            <span>
                              {formatDate(task.deadline)}

                              {task.deadline &&
                                task.status !== "Completed" && (
                                  <span className="mt-0.5 block text-xs">
                                    {getTimeLeft(task.deadline)}
                                  </span>
                                )}
                            </span>
                          </p>
                        </div>

                        <div className="flex justify-end border-t border-slate-100 pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                          >
                            Details <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredTasks.length === 0 && (
                      <EmptyState
                        title="No tasks found"
                        description="Try changing your search or clearing the selected filters."
                        icon={Search}
                      />
                    )}
                  </div>
                </Card>
              </section>

              {/* Footer */}
              <footer className="flex flex-col gap-2 pb-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {filteredTasks.length} of {tasks.length} loaded tasks
                </p>

                <p className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Employee task workspace · CRM + Helpdesk
                </p>
              </footer>
            </>
          )}
        </div>
      </main>

      {/* Task details drawer */}
      {selectedTask && (
        <TaskDetailsPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={completeTask}
        />
      )}
    </div>
  );
}
