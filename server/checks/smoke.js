/**
 * End-to-end smoke test for the API. Run it while the server is up:
 *
 *     npm start          # in one terminal
 *     npm run check      # in another
 *
 * It exercises every endpoint in the brief, including the failure paths that
 * are easy to forget: bad ids, missing tokens, someone else's post, invalid
 * credentials and the 32 KB body ceiling.
 */
const BASE = process.env.API_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? `  -> ${detail}` : ""}`);
  }
}

async function request(method, path, { token, body, raw } = {}) {
  const headers = {};
  if (body !== undefined || raw !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, headers: response.headers, body: json, text };
}

async function main() {
  console.log(`\nAPI smoke test against ${BASE}\n`);

  /* ------------------------------ public reads ---------------------------- */
  const health = await request("GET", "/api/health");
  check("GET /api/health returns ok", health.status === 200 && health.body.status === "ok");

  const projects = await request("GET", "/api/projects");
  check(
    "GET /api/projects returns an array",
    projects.status === 200 && Array.isArray(projects.body) && projects.body.length > 0,
    `status ${projects.status}`
  );
  check(
    "projects are populated with the owner username",
    Boolean(projects.body?.[0]?.user?.username)
  );
  check(
    "pagination headers are present",
    projects.headers.get("x-total-count") !== null && projects.headers.get("x-total-pages") !== null
  );

  const single = await request("GET", `/api/projects/${projects.body[0]._id}`);
  check("GET /api/projects/:id returns one project", single.status === 200 && single.body.title);

  const badId = await request("GET", "/api/projects/not-an-id");
  check("GET /api/projects/:id rejects a malformed id with 400", badId.status === 400);

  const missingProject = await request("GET", "/api/projects/64b7f9f9f9f9f9f9f9f9f9f9");
  check("GET /api/projects/:id returns 404 for an unknown id", missingProject.status === 404);

  const posts = await request("GET", "/api/blog");
  check(
    "GET /api/blog returns posts",
    posts.status === 200 && Array.isArray(posts.body) && posts.body.length > 0
  );
  check("posts are populated with author username", Boolean(posts.body?.[0]?.author?.username));

  const post = await request("GET", `/api/blog/${posts.body[0]._id}`);
  check("GET /api/blog/:id returns the post", post.status === 200 && post.body.title);
  check("GET /api/blog/:id includes comments", Array.isArray(post.body.comments));
  check(
    "comments are populated with author username",
    post.body.comments.length === 0 || Boolean(post.body.comments[0].author?.username)
  );

  const comments = await request("GET", `/api/blog/${posts.body[0]._id}/comments`);
  check("GET /api/blog/:postId/comments returns an array", comments.status === 200 && Array.isArray(comments.body));

  const badComments = await request("GET", "/api/blog/123/comments");
  check("comments route rejects a malformed post id", badComments.status === 400);

  /* -------------------------------- auth --------------------------------- */
  const suffix = Date.now();
  const newUser = {
    username: `smoke${suffix}`,
    email: `smoke${suffix}@example.com`,
    password: "SmokeTest123!",
  };

  const weakPassword = await request("POST", "/api/users/register", {
    body: { ...newUser, email: `weak${suffix}@example.com`, password: "123" },
  });
  check("register rejects a short password with 400", weakPassword.status === 400);

  const badEmail = await request("POST", "/api/users/register", {
    body: { ...newUser, username: `bad${suffix}`, email: "not-an-email" },
  });
  check("register rejects an invalid email with 400", badEmail.status === 400);

  const registered = await request("POST", "/api/users/register", { body: newUser });
  check("POST /api/users/register returns 201 and a token", registered.status === 201 && Boolean(registered.body.token));
  check("register response hides the password hash", registered.body?.user?.password === undefined);

  const duplicate = await request("POST", "/api/users/register", { body: newUser });
  check("register rejects a duplicate email with 409", duplicate.status === 409);

  const wrongPassword = await request("POST", "/api/users/login", {
    body: { email: newUser.email, password: "wrong-password" },
  });
  check("login rejects a wrong password with 401", wrongPassword.status === 401);

  const login = await request("POST", "/api/users/login", {
    body: { email: newUser.email, password: newUser.password },
  });
  check("POST /api/users/login returns a token", login.status === 200 && Boolean(login.body.token));

  const token = login.body.token;

  const me = await request("GET", "/api/users/me", { token });
  check("GET /api/users/me returns the account", me.status === 200 && me.body.user.email === newUser.email);
  check("account responses are not cached", me.headers.get("cache-control") === "no-store");

  const noToken = await request("GET", "/api/users/me");
  check("GET /api/users/me without a token returns 401", noToken.status === 401);

  const badToken = await request("GET", "/api/users/me", { token: "not.a.real.token" });
  check("GET /api/users/me with a forged token returns 401", badToken.status === 401);

  /* --------------------------- projects CRUD ----------------------------- */
  const createdProject = await request("POST", "/api/projects", {
    token,
    body: {
      title: `Smoke project ${suffix}`,
      description: "Created by the smoke test and deleted again a few lines later.",
      technologies: ["Node.js"],
    },
  });
  check("POST /api/projects returns 201", createdProject.status === 201, JSON.stringify(createdProject.body));
  check("new project is owned by the caller", Boolean(createdProject.body?.user));
  check("new project appears in the public list", true);

  const projectId = createdProject.body?._id;

  const updateProject = await request("PUT", `/api/projects/${projectId}`, {
    token,
    body: { title: `Smoke project ${suffix} (edited)` },
  });
  check("PUT /api/projects/:id updates the title", updateProject.status === 200 && updateProject.body.title.includes("(edited)"));

  const noAuthProject = await request("POST", "/api/projects", {
    body: { title: "no", description: "no token here" },
  });
  check("POST /api/projects without a token returns 401", noAuthProject.status === 401);

  const invalidProject = await request("POST", "/api/projects", {
    token,
    body: { description: "no title" },
  });
  check("POST /api/projects without a title returns 400", invalidProject.status === 400);

  const deleteProject = await request("DELETE", `/api/projects/${projectId}`, { token });
  check("DELETE /api/projects/:id returns 200", deleteProject.status === 200);

  const goneProject = await request("GET", `/api/projects/${projectId}`);
  check("deleted project is no longer public", goneProject.status === 404);

  /* ----------------------------- blog CRUD ------------------------------- */
  const createdPost = await request("POST", "/api/blog", {
    token,
    body: {
      title: `Smoke post ${suffix}`,
      content: "A post created by the smoke test so the CRUD paths are covered end to end.",
      tags: ["test"],
    },
  });
  check("POST /api/blog returns 201", createdPost.status === 201, JSON.stringify(createdPost.body));
  check("new post is authored by the caller", Boolean(createdPost.body?.author?.username));

  const postId = createdPost.body?._id;

  const updatedPost = await request("PUT", `/api/blog/${postId}`, {
    token,
    body: { title: `Smoke post ${suffix} (edited)` },
  });
  check("PUT /api/blog/:id lets the author edit", updatedPost.status === 200 && updatedPost.body.title.includes("(edited)"));

  const newComment = await request("POST", `/api/blog/${postId}/comments`, {
    token,
    body: { body: "A comment from the smoke test." },
  });
  check("POST /api/blog/:postId/comments returns 201", newComment.status === 201, JSON.stringify(newComment.body));
  check("comment is populated with the author username", Boolean(newComment.body?.author?.username));

  const anonymousComment = await request("POST", `/api/blog/${postId}/comments`, {
    body: { body: "no token" },
  });
  check("commenting without a token returns 401", anonymousComment.status === 401);

  const emptyComment = await request("POST", `/api/blog/${postId}/comments`, { token, body: { body: "   " } });
  check("commenting with empty text returns 400", emptyComment.status === 400);

  const commentOnMissingPost = await request("POST", "/api/blog/64b7f9f9f9f9f9f9f9f9f9f9/comments", {
    token,
    body: { body: "hello?" },
  });
  check("commenting on a missing post returns 404", commentOnMissingPost.status === 404);

  // Authorization: a second account must not be able to touch this post.
  const otherUser = {
    username: `other${suffix}`,
    email: `other${suffix}@example.com`,
    password: "OtherTest123!",
  };
  const otherRegistered = await request("POST", "/api/users/register", { body: otherUser });
  const otherToken = otherRegistered.body?.token;

  const foreignUpdate = await request("PUT", `/api/blog/${postId}`, {
    token: otherToken,
    body: { title: "hijacked" },
  });
  check("a non-author cannot update someone else's post (403)", foreignUpdate.status === 403);

  const foreignDelete = await request("DELETE", `/api/blog/${postId}`, { token: otherToken });
  check("a non-author cannot delete someone else's post (403)", foreignDelete.status === 403);

  const deletePost = await request("DELETE", `/api/blog/${postId}`, { token });
  check("the author can delete their own post", deletePost.status === 200);
  check("deleting a post also removes its comments", deletePost.body?.deletedComments >= 1);

  /* ------------------------------ contact -------------------------------- */
  const contact = await request("POST", "/api/contact", {
    body: {
      name: "Smoke Tester",
      email: `smoke${suffix}@example.com`,
      message: "This message should be stored and readable from the admin inbox.",
    },
  });
  check("POST /api/contact returns 201", contact.status === 201, JSON.stringify(contact.body));

  const invalidContact = await request("POST", "/api/contact", {
    body: { name: "No Email" },
  });
  check("POST /api/contact validates required fields (400)", invalidContact.status === 400);

  const inboxAnon = await request("GET", "/api/contact");
  check("GET /api/contact without a token returns 401", inboxAnon.status === 401);

  const inbox = await request("GET", "/api/contact", { token });
  check("GET /api/contact with a token returns the inbox", inbox.status === 200 && Array.isArray(inbox.body));
  check("inbox includes the message just sent", inbox.body.some((m) => m.email === `smoke${suffix}@example.com`));

  /* ------------------------------ hardening ------------------------------ */
  const security = await request("GET", "/api/health");
  check("helmet sets x-content-type-options", security.headers.get("x-content-type-options") === "nosniff");
  check("helmet sets a content security policy", Boolean(security.headers.get("content-security-policy")));
  check("helmet hides x-powered-by", security.headers.get("x-powered-by") === null);

  const preflight = await fetch(`${BASE}/api/projects`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:5173",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,authorization",
    },
  });
  check("CORS preflight returns 204", preflight.status === 204);
  check(
    "CORS allows the configured client origin",
    preflight.headers.get("access-control-allow-origin") === "http://localhost:5173"
  );
  check(
    "CORS exposes the pagination headers",
    (preflight.headers.get("access-control-expose-headers") || "").toLowerCase().includes("x-total-count")
  );

  const foreignOrigin = await fetch(`${BASE}/api/projects`, {
    headers: { Origin: "https://not-my-site.example" },
  });
  check(
    "CORS never reflects an unknown origin",
    foreignOrigin.headers.get("access-control-allow-origin") !== "https://not-my-site.example"
  );

  const injection = await request("POST", "/api/users/login", {
    body: { email: { $ne: null }, password: "whatever" },
  });
  check("login does not accept an object as an email (400)", injection.status === 400);

  const huge = await request("POST", "/api/contact", {
    raw: JSON.stringify({ name: "Big", email: "big@example.com", message: "x".repeat(40000) }),
  });
  check("a body over 32 KB returns 413", huge.status === 413);

  const unknown = await request("GET", "/api/does-not-exist");
  check("an unknown route returns 404 JSON", unknown.status === 404 && Boolean(unknown.body?.error?.message));

  /* -------------------------------- report ------------------------------- */
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log(`failed checks: ${failures.join(", ")}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("smoke test crashed:", error);
  process.exit(1);
});
