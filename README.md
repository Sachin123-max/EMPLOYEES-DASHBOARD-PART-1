# Employee Task Dashboard

A responsive employee task management dashboard built with React and Vite that consolidates tasks from CRM and Helpdesk systems into a single interface. It helps employees track their workload, prioritize urgent tasks, monitor deadlines, and navigate directly to the original task source.

## 1. Technology Stack

- **Frontend:** React.js, Vite, JavaScript
- **Icons:** Lucide React
- **Backend:** Node.js and Express.js
- **Integration:** REST APIs
- **Styling:** CSS / Tailwind CSS

## 2. API Integration

The dashboard fetches tasks independently from the following backend endpoints:

| System | API Endpoint |
|---|---|
| CRM | `GET /api/crm/tasks` |
| Helpdesk | `GET /api/helpdesk/tasks` |

**Backend base URL:** `http://localhost:5000`

The existing backend remains unchanged. Task fetching and response normalization are handled by the frontend service layer.

## 3. Installation and Setup

### Install Dependencies

```bash
npm install
npm install lucide-react
```

To create a new Vite project:

```bash
npm create vite@latest employee-dashboard -- --template react
cd employee-dashboard
npm install
npm install lucide-react
```

Copy the provided frontend files into the project's `src/` directory.

### Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000
```

If an `.env.example` file is provided, copy it to `.env` and update the backend URL as required.

**Important:** Restart the Vite development server after changing environment variables.

### Start the Application

```bash
npm run dev
```

Ensure your existing backend is running on port `5000`.

## 4. Supported API Response Formats

Both endpoints support the following response formats, provided the frontend service is configured to normalize them.

### Format A — Direct Array

```json
[
  {
    "id": "1",
    "title": "Complete customer follow-up",
    "status": "Pending",
    "priority": "High",
    "dueDate": "2026-10-30T12:00:00Z",
    "assignedTo": "Aman",
    "url": "https://example.com/task/1"
  }
]
```

### Format B — Tasks Object

```json
{
  "tasks": [
    {
      "id": "1",
      "title": "Resolve support ticket"
    }
  ]
}
```

### Format C — Nested Data Object

```json
{
  "data": {
    "tasks": [
      {
        "id": "1",
        "title": "Prepare sales report"
      }
    ]
  }
}
```

The frontend normalizes supported response formats into a consistent task structure.

## 5. Automatic Field Mapping

| Standard Field | Supported Alternatives |
|---|---|
| Task title | `title`, `taskName`, `subject` |
| Assigned employee | `assignedTo`, `assignee`, `employee` |
| Due date | `dueDate`, `deadline`, `due_date` |
| Task link | `url`, `link`, `sourceUrl` |
| Task status | `status` |
| Priority | `priority` |

Additional mappings can be added in `src/services/taskService.js` if the backend uses different field names.

## 6. Core Features

- **Unified Task View:** Combines CRM and Helpdesk tasks in one dashboard.
- **Task Analytics:** Displays total, pending, in-progress, completed, and overdue task counts.
- **Smart Task Prioritization:** Sorts tasks based on deadline urgency and priority.
- **Task Filtering:** Filters tasks by employee, status, and priority.
- **Direct Task Navigation:** Opens the original task when a valid source URL is available.
- **Independent API Handling:** Keeps successfully fetched tasks available if the other API fails.
- **Responsive Design:** Supports desktop, tablet, and mobile devices.
- **Error Handling:** Handles failed requests and unavailable data gracefully.

## 7. Task Links and Navigation

The API must provide a valid absolute URL beginning with `http://` or `https://` for a task to open in its source application.

The frontend does not invent CRM or Helpdesk URLs. Tasks without valid source URLs remain visible but cannot navigate to an external task page.

## 8. Error Handling and Data Processing

- CRM and Helpdesk requests are handled independently.
- Successfully retrieved tasks remain available if the other endpoint fails.
- API responses are normalized before combining tasks.
- Filtering and sorting are performed locally on the combined task list.
- Missing or invalid fields should be handled using appropriate fallback values.
- Deadline calculations should account for valid dates and time-zone differences.

## 9. Important Implementation Notes

### Task Status Updates

Changing a task's status in the frontend is local-only unless an existing backend update endpoint is connected. Changes may be lost when the page refreshes.

### Deadline Handling

Task ordering is calculated in the frontend using available priority and deadline fields. Consistent date formats and time-zone handling are important for accurate prioritization.

### Environment Configuration

Variables prefixed with `VITE_` are exposed to frontend code. Never store passwords, database credentials, or private API secrets in these variables.

### Backend Compatibility

The existing backend does not need to be modified if it already supports the configured API endpoints and returns a supported response format.

## 10. Future Enhancements

- Persistent task status updates through existing backend APIs.
- Automatic task refresh and real-time notifications.
- Pagination for large task lists.
- Employee-specific dashboards and role-based access.
- Task search and date-range filters.
- Performance metrics and task completion reports.

## Expected Outcome

A centralized, responsive employee dashboard that integrates CRM and Helpdesk tasks, improves visibility into workload and deadlines, and helps employees focus on the most urgent work without requiring changes to the existing backend.
