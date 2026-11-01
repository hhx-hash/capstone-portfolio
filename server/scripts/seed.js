/**
 * Seeds the database with a demo owner account, projects, posts and comments.
 *
 *   npm run seed            # only fills an empty database
 *   npm run seed -- --force # wipes the demo collections first, then re-seeds
 *
 * Users are upserted, so running it twice never creates duplicate accounts.
 */
const { connectDB, disconnectDB } = require("../config/db");
const User = require("../models/User");
const Project = require("../models/Project");
const BlogPost = require("../models/BlogPost");
const Comment = require("../models/Comment");
const Message = require("../models/Message");

const OWNER = {
  username: "huhaozhe",
  email: "huhaozhe@example.com",
  password: "CoursePass123!",
};

const READER = {
  username: "reader",
  email: "reader@example.com",
  password: "CoursePass123!",
};

const PROJECTS = [
  {
    title: "Portfolio & Blog API",
    description:
      "The REST API that powers this site. Express 5 with a models / routes / controllers layout, five Mongoose schemas, bcrypt password hashing, JSON Web Token authentication, ownership checks on blog posts and a single central error handler. Deployed separately from the client so both halves can scale and deploy on their own.",
    technologies: ["Node.js", "Express 5", "MongoDB", "JWT"],
    repoUrl: "",
    liveUrl: "",
  },
  {
    title: "Campus Course Planner",
    description:
      "A single page application that turns a semester of courses into a weekly timetable. State lives in React hooks, routing is client side, and the layout reflows from a three column desktop grid to a single column on a phone without a separate mobile build.",
    technologies: ["React", "Vite", "Tailwind CSS"],
    repoUrl: "",
    liveUrl: "",
  },
  {
    title: "Design System Playground",
    description:
      "A small library of buttons, inputs, cards and dialogs built with reusable components and props, so every page of a project shares one visual language. Every component is documented with its states: default, hover, focus, disabled and error.",
    technologies: ["React", "Tailwind CSS", "Accessibility"],
    repoUrl: "",
    liveUrl: "",
  },
];

const POSTS = [
  {
    title: "What building a REST API with Express 5 actually taught me",
    tags: ["Express", "MongoDB", "Back end"],
    content: `The first version of my portfolio API worked, and that was the problem. Every route had its own try/catch, every controller wrote its own error response, and three different files disagreed about whether a failure should be a 400 or a 500. It ran, but nobody could debug it.

The fix was boring and it changed everything: one helper that attaches a status code to an Error, and one middleware that turns any thrown error into the same JSON envelope. Controllers stopped writing responses for failures and started throwing. Express 5 forwards rejected promises from async handlers automatically, so a controller is now just a function that either returns data or throws.

The second lesson was about ownership. Storing an author id on a post is easy; remembering to compare it before every update is not. Pulling that check into a single helper meant the delete route and the update route could not drift apart, and the 403 message stayed identical in both.

The last one is unglamorous: an index on comment.post. Before it, opening a post with a hundred comments took long enough to notice. After it, the query is instant. Schema design is not only about fields.`,
  },
  {
    title: "React Context, without the ceremony",
    tags: ["React", "State", "Front end"],
    content: `I avoided the Context API for a long time because every tutorial made it look like a framework of its own: three files, a reducer, an action type for every click. Then I had a token that six components needed, and props had turned into plumbing.

The version that finally clicked is small. One file creates the context with a null default. A provider holds two pieces of state, the token and the user, reads the token from localStorage on first render, and exposes login and logout. A custom hook wraps useContext and throws a clear error if it is used outside the provider, which turns a confusing undefined into a sentence.

Two details matter more than the abstraction. First, the token is the source of truth, and the user object is fetched from the API instead of being trusted from localStorage, so a stale or expired session cleans itself up on reload. Second, logout clears storage and state in the same tick, so no component can render a half signed-in view.

Context does not replace props. It removes the one prop that every layer had to pass through without using. Everything else still flows down explicitly, and the component tree is easier to read for it.`,
  },
];

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) return existing;
  return User.create(data);
}

async function main() {
  const force = process.argv.includes("--force");

  await connectDB();

  const owner = await upsertUser(OWNER);
  const reader = await upsertUser(READER);
  console.log(`[seed] users ready: ${owner.email}, ${reader.email}`);

  const existingProjects = await Project.countDocuments();
  const existingPosts = await BlogPost.countDocuments();

  if ((existingProjects > 0 || existingPosts > 0) && !force) {
    console.log(
      `[seed] database already has ${existingProjects} project(s) and ${existingPosts} post(s).\n` +
        "[seed] nothing to do. Use `npm run seed -- --force` to replace the demo content."
    );
    await disconnectDB();
    return;
  }

  if (force) {
    await Promise.all([
      Project.deleteMany({}),
      BlogPost.deleteMany({}),
      Comment.deleteMany({}),
      Message.deleteMany({}),
    ]);
    console.log("[seed] demo collections cleared");
  }

  const projects = await Project.insertMany(
    PROJECTS.map((project) => ({ ...project, user: owner._id }))
  );
  console.log(`[seed] inserted ${projects.length} projects`);

  const posts = [];
  for (const post of POSTS) {
    posts.push(await BlogPost.create({ ...post, author: owner._id }));
  }
  console.log(`[seed] inserted ${posts.length} blog posts`);

  const comments = await Comment.insertMany([
    { body: "The one error handler idea is what finally made my controllers readable too.", author: reader._id, post: posts[0]._id },
    { body: "Adding the index on comment.post was a two minute change with an obvious payoff.", author: reader._id, post: posts[0]._id },
    { body: "Fetched user instead of trusting localStorage - that detail saved me a very confusing bug.", author: reader._id, post: posts[1]._id },
  ]);
  console.log(`[seed] inserted ${comments.length} comments`);

  console.log("\n[seed] done. Demo sign in:");
  console.log(`        email    ${OWNER.email}`);
  console.log(`        password ${OWNER.password}`);
  console.log("        (change it from the dashboard before the demo if you like)");

  await disconnectDB();
}

main().catch(async (error) => {
  console.error(`[seed] failed: ${error.message}`);
  await disconnectDB();
  process.exit(1);
});
