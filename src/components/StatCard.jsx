import {
  ListTodo,
  Clock3,
  CircleDashed,
  CircleCheck,
  AlertTriangle
} from "lucide-react";

const icons = {
  total: ListTodo,
  pending: Clock3,
  progress: CircleDashed,
  completed: CircleCheck,
  overdue: AlertTriangle
};

export default function StatCard({ title, value, type, color }) {
  const Icon = icons[type] || ListTodo;

  return (
    <article className="stat-card">
      <div className={`stat-icon ${color || ""}`}>
        <Icon size={21} />
      </div>

      <div className="stat-content">
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
    </article>
  );
}