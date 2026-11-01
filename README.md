# Capstone Project — Full-Stack Portfolio & Blog

**Student:** HuHaozhe · **Student ID:** 24998111
**Course:** Web Data Management and Application
**Project type:** Cumulative full-stack capstone (100 marks)

A complete, deployed portfolio website with a blog, user accounts, comments and an
admin dashboard. Two independent applications share one MongoDB Atlas database:

- `server/` — a REST API built with Node.js, Express 5 and Mongoose
- `client/` — a React 19 single page application built with Vite and Tailwind CSS

---

## 1. Live deployment

| Application | URL | Host |
| --- | --- | --- |
| Front end (SPA) | `https://____.vercel.app` | Vercel |
| Back end (API) | `https://____.onrender.com` | Render |
| Database | MongoDB Atlas cluster, database `capstone_portfolio` | MongoDB Atlas |

> **Before submitting:** replace the two addresses above with the deployed URLs
> from Render and Vercel. The API root (`GET /`) returns a JSON index of every
> route, so the back-end link is readable in a browser.

Demo account (created by `npm run seed`):

```
email     huhaozhe@example.com
password  CoursePass123!
```

---

## 2. What the project does

**Public side**

- **Home** (`/`) — hero, live counts of projects and posts, featured projects, latest posts, skills.
- **Projects** (`/projects`) — gallery with server-side search and pagination; every card opens `/projects/:id`.
- **Blog** (`/blog`) — paginated list of posts with author, date, reading time and tags.
- **Blog post** (`/blog/:id`) — full article, comment thread, and a comment box for logged-in readers.
- **Contact** (`/contact`) — validated form that stores a message in MongoDB.
- **Login / Register** (`/login`, `/register`) — controlled forms that receive a JWT.

**Signed-in side**

- **Admin dashboard** (`/admin`, protected) — three panels:
  - *Projects*: create, edit and delete portfolio projects.
  - *Blog posts*: create, edit and delete posts (delete also removes their comments).
  - *Inbox*: read the contact messages and mark them read/unread.

The header is auth-aware: guests see *Log in* / *Sign up*, signed-in users see
*Dashboard* plus a *Log out* button. The token lives in `localStorage`, but the
account object is always re-fetched from `GET /api/users/me`, so an expired
session logs itself out instead of showing a broken signed-in shell.

---

## 3. Technology stack

| Layer | Technology |
| --- | --- |
| Front end | React 19.3, React Router 8, Vite 8, Tailwind CSS 4 |
| Back end | Node.js 22, Express 5, Mongoose 9 |
| Database | MongoDB Atlas (cloud hosted) |
| Auth | bcrypt password hashing, JSON Web Tokens (`jsonwebtoken`) |
| Security | helmet, CORS allow-list, express-rate-limit, 32 KB JSON body limit |
| Tooling | nodemon (dev), npm scripts |

No UI kit and no state library: components, styling and global state are written
by hand, which is what the brief asks for.

---

## 4. Project structure

```
.
├── README.md
├── server/                        REST API (MVC)
│   ├── server.js                  entry point: connect to Atlas, then listen
│   ├── app.js                     express app: middleware → routes → errors
│   ├── config/
│   │   ├── env.js                 reads and validates every environment variable
│   │   └── db.js                  Atlas connection with retries
│   ├── models/                    User, Project, BlogPost, Comment, Message
│   ├── controllers/               one file per resource
│   ├── routes/                    one router per resource
│   ├── middleware/
│   │   ├── auth.js                protect (JWT) + ownerOnly
│   │   ├── validateObjectId.js    rejects malformed ids with 400 instead of 500
│   │   ├── limits.js              rate limiters (auth, contact, api)
│   │   ├── notFound.js            404 for unknown routes
│   │   └── errorHandler.js        the single JSON error writer
│   ├── utils/                     httpError, token, pagination, text helpers
│   ├── scripts/seed.js            demo user + projects + posts + comments
│   ├── checks/                    smoke.js (API test) + run.js (verify wrapper)
│   └── .env.example
└── client/                        React SPA
    ├── index.html
    ├── vercel.json                SPA rewrite so /blog/:id survives a refresh
    ├── src/
    │   ├── main.jsx               providers + router
    │   ├── App.jsx                shell and route table
    │   ├── lib/api.js             the only module that talks to the API
    │   ├── lib/format.js          dates, reading time, initials, excerpts
    │   ├── context/               AuthContext + AuthProvider
    │   ├── components/            Header, Footer, cards, forms, states
    │   ├── components/admin/      project form, post form, inbox
    │   └── pages/                 Home, Projects, Blog, Contact, Login, Admin, 404
    └── .env.example
```

---

## 5. API reference

Base URL: `http://localhost:3000` in development, the Render URL in production.
Protected routes require the header `Authorization: Bearer <token>`.

### Authentication

| Method | Endpoint | Auth | Purpose | Body |
| --- | --- | --- | --- | --- |
| `POST` | `/api/users/register` | public | Create an account and return a JWT | `{ username, email, password }` |
| `POST` | `/api/users/login` | public | Verify credentials and return a JWT | `{ email, password }` |
| `GET` | `/api/users/me` | bearer | The account behind the token | — |

`register` and `login` both answer with `{ token, user }`. The password hash is
never included in any response.

### Projects

| Method | Endpoint | Auth | Purpose | Body / query |
| --- | --- | --- | --- | --- |
| `GET` | `/api/projects` | public | All projects, newest first | `?page=&limit=&search=` |
| `GET` | `/api/projects/:id` | public | One project | — |
| `POST` | `/api/projects` | bearer | Create a project, owned by the caller | `{ title, description, imageUrl?, repoUrl?, liveUrl?, technologies? }` |
| `PUT` | `/api/projects/:id` | bearer | Update a project | any of the fields above |
| `DELETE` | `/api/projects/:id` | bearer | Delete a project | — |

### Blog posts

| Method | Endpoint | Auth | Purpose | Body / query |
| --- | --- | --- | --- | --- |
| `GET` | `/api/blog` | public | All posts, populated with the author's username | `?page=&limit=&search=` |
| `GET` | `/api/blog/:id` | public | One post with its author and all its comments | — |
| `POST` | `/api/blog` | bearer | Create a post authored by the caller | `{ title, content, tags? }` |
| `PUT` | `/api/blog/:id` | bearer + author | Update a post | `{ title?, content?, tags? }` |
| `DELETE` | `/api/blog/:id` | bearer + author | Delete a post and its comments | — |

A post can only be modified by its author: any other account receives
`403 You can only modify your own posts.`

### Comments

| Method | Endpoint | Auth | Purpose | Body / query |
| --- | --- | --- | --- | --- |
| `GET` | `/api/blog/:postId/comments` | public | Comments of one post, author populated | `?page=&limit=` |
| `POST` | `/api/blog/:postId/comments` | bearer | Add a comment to that post | `{ body }` |

### Contact messages

| Method | Endpoint | Auth | Purpose | Body / query |
| --- | --- | --- | --- | --- |
| `POST` | `/api/contact` | public | Save a contact form submission | `{ name, email, message }` |
| `GET` | `/api/contact` | bearer | The inbox, newest first | `?page=&limit=` |
| `PUT` | `/api/contact/:id/read` | bearer | Mark a message read / unread | `{ read: true }` |

### Utility

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | JSON index of the API |
| `GET` | `/api/health` | `{ status, uptime, database }` — used by the deploy platform |

### Response conventions

- Lists return a **plain JSON array**. Pagination counters are sent as response
  headers so the body stays simple: `X-Total-Count`, `X-Total-Pages`, `X-Page`,
  `X-Page-Limit` (and `X-Unread-Count` for the inbox).
- Errors always use one envelope:

```json
{ "error": { "status": 400, "message": "Validation failed.", "fields": { "title": "Title is required" } } }
```

| Status | When |
| --- | --- |
| `400` | missing/invalid field, malformed JSON, malformed id |
| `401` | missing, invalid or expired token |
| `403` | valid token, but the resource belongs to someone else |
| `404` | unknown route or unknown document |
| `409` | email or username already registered |
| `413` | request body larger than 32 KB |
| `429` | rate limit exceeded |

Example request:

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"huhaozhe@example.com","password":"CoursePass123!"}'
```

---

## 6. Data models

| Model | Fields |
| --- | --- |
| `User` | `username` (unique, ≥3), `email` (unique, valid), `password` (≥6, bcrypt hash, never selected by default), timestamps |
| `Project` | `title`, `description`, `imageUrl`, `repoUrl`, `liveUrl`, `technologies[]`, `user` → `User` (required), timestamps |
| `BlogPost` | `title`, `content`, `author` → `User` (required), `tags[]`, timestamps, virtuals `excerpt` and `readingTime` |
| `Comment` | `body`, `author` → `User` (required), `post` → `BlogPost` (required), timestamps |
| `Message` | `name`, `email`, `message`, `read`, timestamps |

Indexes: unique indexes on `User.email` / `User.username`, plus
`{ createdAt: -1 }` on projects and posts and `{ post: 1, createdAt: -1 }` on
comments, because those are the queries the pages actually run.

Relationships are resolved with `populate()`:

```js
BlogPost.find().populate("author", "username")   // list: usernames only
Comment.find({ post }).populate("author", "username")
Project.find().populate("user", "username")
```

Only the username is selected, so a populated document can never leak an email
address or a password hash.

---

## 7. Security

- **Passwords** are hashed with bcrypt (10 salt rounds) in a `pre("save")` hook and
  compared with `bcrypt.compare` on login. The field is `select: false` and is
  deleted in `toJSON`.
- **JWT** is signed with `JWT_SECRET`, expires in `JWT_EXPIRES_IN` (7 days) and is
  verified by the `protect` middleware, which loads the user and rejects tokens
  whose account no longer exists.
- **helmet** sets CSP, `X-Content-Type-Options`, `X-Frame-Options` and friends.
- **CORS** accepts only the origins listed in `CLIENT_ORIGIN` (comma separated, so
  local development and the deployed domain can both be listed).
- **Rate limits**: 10 authentication attempts and 5 contact messages per IP per
  15 minutes, 600 API requests per IP per 15 minutes as a backstop.
- **Input handling**: every body value passes through a type-checking helper before
  it reaches Mongoose, so `{"email": {"$ne": null}}` is a `400`, not a query
  operator. Ids are validated before a query runs, and the JSON body is capped at
  32 KB.
- **Secrets** live in `.env` only; `.env` and `.env.*` are in both `.gitignore`
  files and are not part of the submitted archive.

---

## 8. Run it locally

Requirements: **Node.js 22+**, npm, and a MongoDB Atlas connection string.

### 8.1 Back end

```bash
cd server
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Edit `server/.env`:

| Variable | Meaning |
| --- | --- |
| `PORT` | default `3000` |
| `MONGO_URI` | Atlas connection string, database name `capstone_portfolio` |
| `JWT_SECRET` | at least 32 characters; generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | token lifetime, default `7d` |
| `CLIENT_ORIGIN` | comma separated allowed browser origins, e.g. `http://localhost:5173,http://localhost:4173` |
| `TRUST_PROXY` | `0` locally, `1` when running behind Render |
| `NODE_ENV` | `development` or `production` |

Then:

```bash
npm run seed     # demo account + 3 projects + 2 posts + 3 comments
npm start        # http://localhost:3000
```

`npm run verify` starts the API on port 3100 with the rate limiter disabled, runs
the 60 checks in `checks/smoke.js` and shuts it down again.

### 8.2 Front end

```bash
cd client
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

`client/.env` holds one variable:

```
VITE_API_URL=http://localhost:3000
```

Then:

```bash
npm run dev       # http://localhost:5173
npm run build     # production build into client/dist
npm run preview   # serve the build on http://localhost:4173
```

**How the two halves connect:** the client never hard-codes the API host. Every
request goes through `client/src/lib/api.js`, which prefixes `VITE_API_URL`. Local
development points it at `http://localhost:3000`; the deployed build points it at
the Render URL. Because the value is baked in at build time, changing it means
rebuilding (or, on Vercel, redeploying) the front end.

---

## 9. Deployment

The two applications deploy separately; the database is shared.

1. **MongoDB Atlas** — create the cluster (or reuse an existing one) and allow
   access from anywhere (`0.0.0.0/0`) so the API host can connect.
2. **Render** — new *Web Service* from the repository, root directory `server`,
   build command `npm install`, start command `npm start`. Environment variables:
   `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (the Vercel URL, comma separated if
   you also want localhost), `TRUST_PROXY=1`, `NODE_ENV=production`. Render injects
   `PORT`.
3. **Vercel** — import the same repository, root directory `client`, framework
   *Vite*. Environment variable `VITE_API_URL` = the Render URL from step 2.
4. Copy both URLs into section 1 of this README.

The free Render tier sleeps after 15 minutes of inactivity, so the first request
after a quiet period takes up to a minute.

---

## 10. Testing

- `server/checks/smoke.js` — 60 automated checks over the whole API: public reads,
  registration and login rules, the token guard, both CRUD surfaces, the
  author-only rule (403 for another account), comment creation, the contact
  inbox, helmet headers, CORS behaviour and the 32 KB body limit.
- The client was verified end to end in headless Edge against the production
  build: 54 checks covering every route, the auth flow, dashboard create / edit /
  delete for projects and posts, comment posting, the contact form, the inbox,
  logout, the 404 page and a 390 px mobile viewport.
- `client/src/lib/api.js` is the only place that knows the API URL, so a single
  environment variable switches the whole SPA between local and deployed.

---

## 11. Notes and limitations

- Uploading images is out of scope; `imageUrl` takes a URL and the UI falls back to
  a generated gradient tile when it is empty.
- The contact form stores messages instead of sending email, which is what the
  brief asks for; the inbox lives in the dashboard.
- Rate-limit counters are kept in memory, so they reset when the API restarts.
- The site is a single-owner portfolio: any registered account can manage the
  portfolio content, while blog posts remain editable only by their author.
