// Capa fina sobre el server local (proxy /api -> 127.0.0.1:8077).

async function req(method, path, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`/api${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Error ${res.status}`);
  }
  return data;
}

export const api = {
  getCatalog: () => req("GET", "/catalog"),
  getCourse: () => req("GET", "/course"),
  getStats: () => req("GET", "/stats"),
  getExercises: (belt, topic) =>
    req("GET", `/exercises?belt=${encodeURIComponent(belt)}&topic=${encodeURIComponent(topic)}`),
  saveExercises: (belt, topic, exercises) =>
    req("PUT", "/exercises", { belt, topic, exercises }),
  nextId: (belt, topic, skill) =>
    req(
      "GET",
      `/next-id?belt=${encodeURIComponent(belt)}&topic=${encodeURIComponent(topic)}&skill=${encodeURIComponent(skill)}`,
    ),
  saveTooltip: (belt, topic, tooltip) =>
    req("PATCH", "/catalog/tooltip", { belt, topic, tooltip }),
  aiGenerate: (payload) => req("POST", "/ai/generate", payload),
  reseed: () => req("POST", "/seed"),
};
