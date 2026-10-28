const STATUS_COMPLETED = ["completed", "done", "resolved", "closed"];

export function getTaskPriority(task) {
  const status = String(task.status || "").toLowerCase();

  if (STATUS_COMPLETED.includes(status)) {
    return "Completed";
  }

  const deadline = task.deadline || task.dueDate || task.due_date;
  const now = Date.now();

  if (deadline) {
    const dueTime = new Date(deadline).getTime();

    if (Number.isFinite(dueTime)) {
      if (dueTime < now) return "Overdue";
      if (dueTime <= now + 24 * 60 * 60 * 1000) {
        return "Due Soon";
      }
    }
  }

  const urgency = String(
    task.urgency || task.priority || "medium"
  ).toLowerCase();

  if (["urgent", "critical", "high"].includes(urgency)) {
    return "High";
  }

  if (urgency === "medium") {
    return "Medium";
  }

  return "Low";
}

const priorityRank = {
  Overdue: 0,
  "Due Soon": 1,
  High: 2,
  Medium: 3,
  Low: 4,
  Completed: 5
};

export function sortTasksByPriority(tasks) {
  return [...tasks].sort((a, b) => {
    const rankDifference =
      priorityRank[getTaskPriority(a)] -
      priorityRank[getTaskPriority(b)];

    if (rankDifference !== 0) return rankDifference;

    const aDue = new Date(
      a.deadline || a.dueDate || a.due_date || "9999-12-31"
    ).getTime();

    const bDue = new Date(
      b.deadline || b.dueDate || b.due_date || "9999-12-31"
    ).getTime();

    return aDue - bDue;
  });
}

export function isCompleted(task) {
  return STATUS_COMPLETED.includes(
    String(task.status || "").toLowerCase()
  );
}

export function isOverdue(task) {
  if (isCompleted(task)) return false;

  const deadline = task.deadline || task.dueDate || task.due_date;
  if (!deadline) return false;

  const dueTime = new Date(deadline).getTime();

  return Number.isFinite(dueTime) && dueTime < Date.now();
}