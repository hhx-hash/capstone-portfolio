/**
 * The only file that knows how to talk to the API.
 *
 * Every request goes through `request()`, which attaches the JWT, normalises
 * the error envelope (`{ error: { message, fields } }`) into an ApiError, and
 * reports "the API is down" as a readable message instead of a network stack.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const TOKEN_KEY = "capstone.token";

export class ApiError extends Error {
  constructor(message, status = 0, fields = undefined) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = tokenStorage.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${BASE_URL}. Is the server running?`,
      0
    );
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      payload?.error?.message || `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, payload?.error?.fields);
  }

  return { payload, headers: response.headers };
}

/** Reads the pagination counters the API exposes as response headers. */
function pagination(headers) {
  const read = (name, fallback) => {
    const value = headers.get(name);
    return value === null ? fallback : Number(value);
  };
  return {
    total: read("x-total-count", 0),
    pages: read("x-total-pages", 1),
    page: read("x-page", 1),
    limit: read("x-page-limit", 10),
  };
}

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

/* --------------------------------- auth --------------------------------- */

export const api = {
  register: async ({ username, email, password }) => {
    const { payload } = await request("/api/users/register", {
      method: "POST",
      body: { username, email, password },
    });
    return payload;
  },

  login: async ({ email, password }) => {
    const { payload } = await request("/api/users/login", {
      method: "POST",
      body: { email, password },
    });
    return payload;
  },

  me: async () => {
    const { payload } = await request("/api/users/me", { auth: true });
    return payload.user;
  },

  /* ------------------------------- projects ------------------------------ */

  listProjects: async ({ page, limit, search } = {}) => {
    const { payload, headers } = await request(`/api/projects${toQuery({ page, limit, search })}`);
    return { projects: payload, ...pagination(headers) };
  },

  getProject: async (id) => {
    const { payload } = await request(`/api/projects/${id}`);
    return payload;
  },

  createProject: async (project) => {
    const { payload } = await request("/api/projects", {
      method: "POST",
      body: project,
      auth: true,
    });
    return payload;
  },

  updateProject: async (id, project) => {
    const { payload } = await request(`/api/projects/${id}`, {
      method: "PUT",
      body: project,
      auth: true,
    });
    return payload;
  },

  deleteProject: async (id) => {
    const { payload } = await request(`/api/projects/${id}`, {
      method: "DELETE",
      auth: true,
    });
    return payload;
  },

  /* --------------------------------- blog -------------------------------- */

  listPosts: async ({ page, limit, search } = {}) => {
    const { payload, headers } = await request(`/api/blog${toQuery({ page, limit, search })}`);
    return { posts: payload, ...pagination(headers) };
  },

  getPost: async (id) => {
    const { payload } = await request(`/api/blog/${id}`);
    return payload;
  },

  createPost: async (post) => {
    const { payload } = await request("/api/blog", { method: "POST", body: post, auth: true });
    return payload;
  },

  updatePost: async (id, post) => {
    const { payload } = await request(`/api/blog/${id}`, {
      method: "PUT",
      body: post,
      auth: true,
    });
    return payload;
  },

  deletePost: async (id) => {
    const { payload } = await request(`/api/blog/${id}`, { method: "DELETE", auth: true });
    return payload;
  },

  /* ------------------------------- comments ------------------------------ */

  listComments: async (postId, { page, limit } = {}) => {
    const { payload, headers } = await request(
      `/api/blog/${postId}/comments${toQuery({ page, limit })}`
    );
    return { comments: payload, ...pagination(headers) };
  },

  createComment: async (postId, body) => {
    const { payload } = await request(`/api/blog/${postId}/comments`, {
      method: "POST",
      body: { body },
      auth: true,
    });
    return payload;
  },

  /* -------------------------------- contact ------------------------------ */

  sendMessage: async ({ name, email, message }) => {
    const { payload } = await request("/api/contact", {
      method: "POST",
      body: { name, email, message },
    });
    return payload;
  },

  listMessages: async ({ page, limit } = {}) => {
    const { payload, headers } = await request(`/api/contact${toQuery({ page, limit })}`, {
      auth: true,
    });
    return {
      messages: payload,
      ...pagination(headers),
      unread: Number(headers.get("x-unread-count") || 0),
    };
  },

  markMessageRead: async (id, read = true) => {
    const { payload } = await request(`/api/contact/${id}/read`, {
      method: "PUT",
      body: { read },
      auth: true,
    });
    return payload;
  },
};

export { BASE_URL };
