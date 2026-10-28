
import { ExternalLink } from "lucide-react";

export default function TaskLink({ task }) {
  if (!task?.sourceUrl) {
    return (
      <span className="text-gray-400 text-sm">
        Link unavailable
      </span>
    );
  }

  return (
    <a
      href={task.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5
        text-blue-600 hover:text-blue-800
        hover:underline font-medium text-sm"
      aria-label={`Open ${task.title} in ${task.source}`}
      title={`Open in ${task.source}`}
    >
      {task.title}
      <ExternalLink size={14} />
    </a>
  );
}
