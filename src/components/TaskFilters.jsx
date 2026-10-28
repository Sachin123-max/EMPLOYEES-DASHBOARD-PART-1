import { Search, SlidersHorizontal } from "lucide-react";

export default function TaskFilters({
  search,
  setSearch,
  employee,
  setEmployee,
  status,
  setStatus,
  source,
  setSource,
  employees
}) {
  return (
    <section className="filters-panel">
      <div className="filter-heading">
        <div>
          <h3>All Tasks</h3>
          <p>Search, filter and prioritize your work</p>
        </div>
        <SlidersHorizontal size={19} />
      </div>

      <div className="filters-grid">
        <label className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
          />
        </label>

        <select
          value={employee}
          onChange={(event) => setEmployee(event.target.value)}
          aria-label="Filter by employee"
        >
          <option value="all">All employees</option>
          {employees.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>

        <select
          value={source}
          onChange={(event) => setSource(event.target.value)}
          aria-label="Filter by source"
        >
          <option value="all">All applications</option>
          <option value="crm">CRM</option>
          <option value="helpdesk">Helpdesk</option>
        </select>
      </div>
    </section>
  );
}