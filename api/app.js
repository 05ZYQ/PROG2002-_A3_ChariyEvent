/**
 * app.js
 * ---------------------------------------------------------------
 * RESTful API for the Kindred City Charity dynamic website.
 * Built with Node.js + ExpressJS (PROG2002 Web Development II, A3).
 *
 * The server wires up the middleware, serves the two front-ends and
 * mounts the RESTful routers that live in ./routes:
 *
 *   /api/events         -> routes/events.js        (read + full CRUD)
 *   /api/categories      -> routes/categories.js    (read + CRUD)
 *   /api/organisations   -> routes/organisations.js (read only)
 *   /api/registrations   -> routes/registrations.js (register feature)
 *   /api/stats           -> routes/stats.js         (admin dashboard)
 *   /api/weather         -> routes/weather.js       (Open-Meteo proxy)
 *
 * Team: 05ZYQ  - server core, events & categories CRUD, client site
 *       hahaha135135 - registration feature, admin site, weather API
 * ---------------------------------------------------------------
 */

const path = require("path");
const express = require("express");

const eventsRouter = require("./routes/events");
const categoriesRouter = require("./routes/categories");
const organisationsRouter = require("./routes/organisations");
const registrationsRouter = require("./routes/registrations");
const statsRouter = require("./routes/stats");
const weatherRouter = require("./routes/weather");

const app = express();
const PORT = process.env.PORT || 3030;

// ---------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------
app.use(express.json());

// CORS: the client-side and admin-side websites may be served from
// a different origin (e.g. VS Code Live Server or the SCU cPanel),
// so every endpoint is reachable from the browser.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Serve both front-ends so the whole project can be opened from a
// single address:  http://localhost:3030  (client)  /admin  (staff)
app.use(express.static(path.join(__dirname, "..", "clientside")));
app.use("/admin", express.static(path.join(__dirname, "..", "adminside")));

// Simple request logger - helps demonstrate the request/response flow.
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  next();
});

// ---------------------------------------------------------------
// Service welcome message
// ---------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    service: "Kindred City Charity API",
    assessment: "PROG2002 Web Development II - Assessment 3",
    version: "3.0.0",
    team: ["05ZYQ", "hahaha135135"],
    documentation: "See README.md for the full endpoint list.",
  });
});

// ---------------------------------------------------------------
// Mount the RESTful routers
// ---------------------------------------------------------------
app.use("/api/events", eventsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/organisations", organisationsRouter);
app.use("/api/registrations", registrationsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/weather", weatherRouter);

// ---------------------------------------------------------------
// Fallback handlers
// ---------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

app.use((err, req, res, next) => {
  console.error("[api] unexpected error:", err.message);
  res.status(500).json({ error: "Unexpected server error." });
});

// ---------------------------------------------------------------
// Start the server (developed and tested on Node.js 18.20.8)
// ---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Kindred City Charity API is running on http://localhost:${PORT}`);
  console.log(`Client website:   http://localhost:${PORT}`);
  console.log(`Admin website:    http://localhost:${PORT}/admin`);
});
