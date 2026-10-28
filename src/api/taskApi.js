
const API_URL = "http://localhost:5000/api";

async function fetchSourceTasks(name, url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${name} API failed: ${response.status}`);
  }

  const result = await response.json();

  // Support common API response formats
  const data = Array.isArray(result)
    ? result
    : result?.data?.tasks ?? result?.data ?? result?.tasks;

  if (!Array.isArray(data)) {
    throw new Error(`${name} API returned an invalid task list`);
  }

  return data.map((task) => ({
    ...task,
    source: task.source || name,
  }));
}

export async function fetchAllTasks() {
  const endpoints = [
    {
      name: "CRM",
      url: `${API_URL}/crm/tasks`,
    },
    {
      name: "Helpdesk",
      url: `${API_URL}/helpdesk/tasks`,
    },
  ];

  const results = await Promise.allSettled(
    endpoints.map(({ name, url }) => fetchSourceTasks(name, url))
  );

  const tasks = [];
  const errors = [];

  results.forEach((result, index) => {
    const source = endpoints[index].name;

    if (result.status === "fulfilled") {
      tasks.push(...result.value);
    } else {
      errors.push({
        source,
        message: result.reason?.message || "Unable to load tasks",
      });
    }
  });

  // Throw only if both APIs fail or return no tasks
  if (tasks.length === 0 && errors.length > 0) {
    throw new Error(
      errors.map((error) => `${error.source}: ${error.message}`).join(" | ")
    );
  }

  return { tasks, errors };
}
