import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.js";
import { formatDate } from "../lib/format.js";
import PageHeader from "../components/PageHeader.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import Alert from "../components/Alert.jsx";
import ProjectForm from "../components/admin/ProjectForm.jsx";
import PostForm from "../components/admin/PostForm.jsx";
import MessageInbox from "../components/admin/MessageInbox.jsx";

const TABS = [
  { id: "projects", label: "Projects" },
  { id: "posts", label: "Blog posts" },
  { id: "inbox", label: "Inbox" },
];

/**
 * Admin dashboard - the protected half of the app.
 *
 * Three panels share one page: projects, blog posts and the contact inbox.
 * Every write sends the JWT, and every write is followed by a reload of the
 * affected collection so the list on screen is always what the database holds.
 */
export default function Admin() {
  const { user, logout } = useAuth();

  const [tab, setTab] = useState("projects");

  const [projects, setProjects] = useState({ loading: true, error: "", items: [] });
  const [posts, setPosts] = useState({ loading: true, error: "", items: [] });
  const [messages, setMessages] = useState({ loading: true, error: "", items: [], unread: 0 });

  const [projectEditor, setProjectEditor] = useState({ open: false, item: null });
  const [postEditor, setPostEditor] = useState({ open: false, item: null });

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [flash, setFlash] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadProjects = useCallback(async () => {
    setProjects((current) => ({ ...current, loading: true, error: "" }));
    try {
      const result = await api.listProjects({ limit: 50 });
      setProjects({ loading: false, error: "", items: result.projects });
    } catch (error) {
      setProjects({ loading: false, error: error.message, items: [] });
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setPosts((current) => ({ ...current, loading: true, error: "" }));
    try {
      const result = await api.listPosts({ limit: 50 });
      setPosts({ loading: false, error: "", items: result.posts });
    } catch (error) {
      setPosts({ loading: false, error: error.message, items: [] });
    }
  }, []);

  const loadMessages = useCallback(async () => {
    setMessages((current) => ({ ...current, loading: true, error: "" }));
    try {
      const result = await api.listMessages({ limit: 50 });
      setMessages({ loading: false, error: "", items: result.messages, unread: result.unread });
    } catch (error) {
      setMessages({ loading: false, error: error.message, items: [], unread: 0 });
    }
  }, []);

  useEffect(() => {
    if (tab === "projects") loadProjects();
    if (tab === "posts") loadPosts();
    if (tab === "inbox") loadMessages();
  }, [tab, loadProjects, loadPosts, loadMessages]);

  function announce(message) {
    setFlash(message);
    setActionError("");
    window.setTimeout(() => setFlash(""), 4000);
  }

  /* ------------------------------ projects ------------------------------- */

  async function saveProject(values) {
    setBusy(true);
    setActionError("");
    try {
      if (projectEditor.item) {
        await api.updateProject(projectEditor.item._id, values);
        announce("Project updated.");
      } else {
        await api.createProject(values);
        announce("Project created.");
      }
      setProjectEditor({ open: false, item: null });
      await loadProjects();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeProject(project) {
    if (!window.confirm(`Delete the project "${project.title}"? This cannot be undone.`)) return;
    setBusyId(project._id);
    setActionError("");
    try {
      await api.deleteProject(project._id);
      announce("Project deleted.");
      if (projectEditor.item?._id === project._id) setProjectEditor({ open: false, item: null });
      await loadProjects();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusyId(null);
    }
  }

  /* -------------------------------- posts -------------------------------- */

  async function savePost(values) {
    setBusy(true);
    setActionError("");
    try {
      if (postEditor.item) {
        await api.updatePost(postEditor.item._id, values);
        announce("Post updated.");
      } else {
        await api.createPost(values);
        announce("Post published.");
      }
      setPostEditor({ open: false, item: null });
      await loadPosts();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function removePost(post) {
    if (!window.confirm(`Delete the post "${post.title}"? Its comments are removed too.`)) return;
    setBusyId(post._id);
    setActionError("");
    try {
      await api.deletePost(post._id);
      announce("Post deleted.");
      if (postEditor.item?._id === post._id) setPostEditor({ open: false, item: null });
      await loadPosts();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusyId(null);
    }
  }

  /* ------------------------------- messages ------------------------------ */

  async function toggleRead(message) {
    setBusyId(message._id);
    setActionError("");
    try {
      await api.markMessageRead(message._id, !message.read);
      await loadMessages();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusyId(null);
    }
  }

  function handleLogout() {
    logout();
  }

  const unread = messages.unread;

  return (
    <div className="container-page py-12">
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        description={`Signed in as @${user?.username ?? ""}. Everything you change here is written straight to MongoDB Atlas through the API.`}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (tab === "projects") loadProjects();
            if (tab === "posts") loadPosts();
            if (tab === "inbox") loadMessages();
          }}
        >
          Refresh
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Log out
        </button>
      </PageHeader>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-2" role="tablist">
        {TABS.map((item) => {
          const active = tab === item.id;
          const count =
            item.id === "projects"
              ? projects.items.length
              : item.id === "posts"
                ? posts.items.length
                : unread;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`btn btn-sm ${active ? "btn-primary" : "btn-ghost"}`}
              onClick={() => {
                setTab(item.id);
                setActionError("");
              }}
            >
              {item.label}
              {count > 0 && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? "bg-white/20" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {flash && (
        <div className="mt-4">
          <Alert tone="success">{flash}</Alert>
        </div>
      )}
      {actionError && (
        <div className="mt-4">
          <Alert>{actionError}</Alert>
        </div>
      )}

      {/* ------------------------------ projects ---------------------------- */}
      {tab === "projects" && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Portfolio projects</h2>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setProjectEditor({ open: true, item: null })}
            >
              + New project
            </button>
          </div>

          {projectEditor.open && (
            <div className="mt-4">
              <ProjectForm
                project={projectEditor.item}
                onSubmit={saveProject}
                onCancel={() => {
                  setProjectEditor({ open: false, item: null });
                  setActionError("");
                }}
                busy={busy}
                error={actionError}
              />
            </div>
          )}

          <div className="mt-4">
            {projects.loading && <Loading label="Loading projects..." />}
            {projects.error && <ErrorState message={projects.error} onRetry={loadProjects} />}
            {!projects.loading && !projects.error && (
              <ul className="space-y-3">
                {projects.items.map((project) => (
                  <li
                    key={project._id}
                    className="card flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{project.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(project.createdAt)}
                        {project.technologies?.length > 0 && <> · {project.technologies.join(", ")}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/projects/${project._id}`} className="btn btn-sm btn-ghost">
                        View
                      </Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setProjectEditor({ open: true, item: project });
                          setActionError("");
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        disabled={busyId === project._id}
                        onClick={() => removeProject(project)}
                      >
                        {busyId === project._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
                {projects.items.length === 0 && (
                  <li className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    No projects yet. Use “New project” to add the first one.
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* -------------------------------- posts ----------------------------- */}
      {tab === "posts" && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Blog posts</h2>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setPostEditor({ open: true, item: null })}
            >
              + New post
            </button>
          </div>

          {postEditor.open && (
            <div className="mt-4">
              <PostForm
                post={postEditor.item}
                onSubmit={savePost}
                onCancel={() => {
                  setPostEditor({ open: false, item: null });
                  setActionError("");
                }}
                busy={busy}
                error={actionError}
              />
            </div>
          )}

          <div className="mt-4">
            {posts.loading && <Loading label="Loading posts..." />}
            {posts.error && <ErrorState message={posts.error} onRetry={loadPosts} />}
            {!posts.loading && !posts.error && (
              <ul className="space-y-3">
                {posts.items.map((post) => (
                  <li
                    key={post._id}
                    className="card flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{post.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(post.createdAt)} · by {post.author?.username || "you"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/blog/${post._id}`} className="btn btn-sm btn-ghost">
                        View
                      </Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setPostEditor({ open: true, item: post });
                          setActionError("");
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        disabled={busyId === post._id}
                        onClick={() => removePost(post)}
                      >
                        {busyId === post._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
                {posts.items.length === 0 && (
                  <li className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    No posts yet. Use “New post” to publish the first one.
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* -------------------------------- inbox ----------------------------- */}
      {tab === "inbox" && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Contact inbox{" "}
              {unread > 0 && <span className="chip-accent ml-1">{unread} new</span>}
            </h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadMessages}>
              Refresh inbox
            </button>
          </div>

          <div className="mt-4">
            {messages.loading && <Loading label="Loading messages..." />}
            {messages.error && <ErrorState message={messages.error} onRetry={loadMessages} />}
            {!messages.loading && !messages.error && (
              <MessageInbox messages={messages.items} onToggleRead={toggleRead} busyId={busyId} />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
