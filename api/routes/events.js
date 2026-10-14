/**
 * routes/events.js
 * ---------------------------------------------------------------
 * Event resource - read endpoints for the public website plus the
 * full C.R.U.D. cycle used by the admin-side website.
 *
 *   GET    /                  all events (admin; ?includePast/&includeSuspended)
 *   GET    /upcoming          active, upcoming events (home page)
 *   GET    /filter            search by date, location, category
 *   GET    /:id               event details + registrations (latest first)
 *   POST   /                  insert a new charity event      (admin)
 *   PUT    /:id               update an existing event        (admin)
 *   DELETE /:id                delete an event (blocked when registrations exist)
 *
 * Author: 05ZYQ (1379209835@qq.com)
 * ---------------------------------------------------------------
 */

const express = require("express");
const { runQuery, runCommand } = require("../event_db");
const { DATE_RE, TIME_RE, isBlank, EVENT_COLUMNS, EVENT_FROM } = require("./validation");

const router = express.Router();

// ---------------------------------------------------------------
// GET / - every event regardless of status (admin "List" page)
// Query flags: ?includePast=0 & includeSuspended=0
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  const includePast = req.query.includePast === "0" ? false : true;
  const includeSuspended = req.query.includeSuspended === "0" ? false : true;

  const conditions = ["e.is_active = 1"];
  if (!includePast) conditions.push("e.event_date >= CURDATE()");
  if (!includeSuspended) conditions.push("e.is_suspended = 0");

  // Total tickets / registrations per event, shown on the admin list.
  const sql = `
    SELECT ${EVENT_COLUMNS},
            COALESCE(r.total_tickets, 0) AS total_tickets,
            COALESCE(r.registration_count, 0) AS registration_count
    ${EVENT_FROM}
    LEFT JOIN (
      SELECT event_id,
             SUM(tickets_purchased) AS total_tickets,
             COUNT(*)              AS registration_count
      FROM registration
      GROUP BY event_id
    ) r ON r.event_id = e.event_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY e.event_date ASC`;

  try {
    res.json(await runQuery(sql));
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve the event list." });
  }
});

// ---------------------------------------------------------------
// GET /upcoming - active, upcoming events (home page)
// ---------------------------------------------------------------
router.get("/upcoming", async (req, res) => {
  const sql = `
    SELECT ${EVENT_COLUMNS}
    ${EVENT_FROM}
    WHERE e.is_active = 1
      AND e.is_suspended = 0
      AND e.event_date >= CURDATE()
    ORDER BY e.event_date ASC`;

  try {
    res.json(await runQuery(sql));
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve upcoming events." });
  }
});

// ---------------------------------------------------------------
// GET /filter - search by date, location, category
//   /filter?date=2026-11-01&location=east&category=2
// ---------------------------------------------------------------
router.get("/filter", async (req, res) => {
  const { date, location, category } = req.query;

  if (date && !DATE_RE.test(date)) {
    return res.status(400).json({ error: "Invalid date. Use the YYYY-MM-DD format." });
  }
  if (category && !/^\d+$/.test(category)) {
    return res.status(400).json({ error: "Invalid category. The category id must be a number." });
  }

  const conditions = ["e.is_active = 1", "e.is_suspended = 0", "e.event_date >= CURDATE()"];
  const params = [];

  if (date) {
    conditions.push("e.event_date >= ?");
    params.push(date);
  }
  if (location) {
    conditions.push("(e.location LIKE ? OR e.venue LIKE ?)");
    params.push(`%${location}%`, `%${location}%`);
  }
  if (category) {
    conditions.push("e.category_id = ?");
    params.push(category);
  }

  const sql = `
    SELECT ${EVENT_COLUMNS}
    ${EVENT_FROM}
    WHERE ${conditions.join(" AND ")}
    ORDER BY e.event_date ASC`;

  try {
    res.json(await runQuery(sql, params));
  } catch (err) {
    res.status(500).json({ error: "Failed to search events." });
  }
});

// ---------------------------------------------------------------
// GET /:id
// IMPROVED IN A3: returns the event details AND the complete list
// of registrations for that event, sorted by the latest purchase
// date first. This single call powers the event detail page.
// ---------------------------------------------------------------
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Invalid event id." });
  }

  const eventSql = `
    SELECT ${EVENT_COLUMNS},
           o.org_mission, o.contact_email AS org_email,
           o.contact_phone AS org_phone, o.website AS org_website
    ${EVENT_FROM}
    WHERE e.event_id = ?`;

  try {
    const events = await runQuery(eventSql, [id]);
    if (events.length === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    const registrations = await runQuery(
      `SELECT registration_id, full_name, email, phone,
              registration_date, tickets_purchased, notes
         FROM registration
        WHERE event_id = ?
        ORDER BY registration_date DESC, registration_id DESC`,
      [id]
    );

    res.json({ ...events[0], registrations });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve the event." });
  }
});

// ---------------------------------------------------------------
// Shared validation for POST and PUT bodies
// ---------------------------------------------------------------
function validateEventBody(e) {
  const missing = [];
  if (isBlank(e.event_name)) missing.push("event_name");
  if (isBlank(e.event_description)) missing.push("event_description");
  if (isBlank(e.event_date)) missing.push("event_date");
  if (isBlank(e.start_time)) missing.push("start_time");
  if (isBlank(e.venue)) missing.push("venue");
  if (isBlank(e.location)) missing.push("location");
  if (isBlank(e.category_id)) missing.push("category_id");
  if (missing.length > 0) {
    return { error: `Missing required field(s): ${missing.join(", ")}.` };
  }
  if (!DATE_RE.test(e.event_date)) {
    return { error: "Invalid event_date. Use the YYYY-MM-DD format." };
  }
  if (!TIME_RE.test(e.start_time)) {
    return { error: "Invalid start_time. Use the HH:MM or HH:MM:SS format." };
  }
  return null;
}

/** Maps the request body onto the INSERT/UPDATE parameter list */
function eventParams(e) {
  return [
    Number(e.org_id) || 1,
    Number(e.category_id),
    String(e.event_name).trim(),
    String(e.event_description).trim(),
    e.event_date,
    e.start_time,
    String(e.venue).trim(),
    String(e.location).trim(),
    e.latitude === "" || e.latitude === undefined ? null : Number(e.latitude),
    e.longitude === "" || e.longitude === undefined ? null : Number(e.longitude),
    Number(e.ticket_price) || 0,
    Number(e.fundraising_goal) || 0,
    Number(e.amount_raised) || 0,
    isBlank(e.event_image) ? "market.svg" : String(e.event_image).trim(),
    e.is_active === 0 || e.is_active === "0" ? 0 : 1,
    e.is_suspended === 1 || e.is_suspended === "1" ? 1 : 0,
  ];
}

const INSERT_SQL = `
  INSERT INTO event
    (org_id, category_id, event_name, event_description, event_date,
     start_time, venue, location, latitude, longitude, ticket_price,
     fundraising_goal, amount_raised, event_image, is_active, is_suspended)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const UPDATE_SQL = `
  UPDATE event SET
    org_id = ?, category_id = ?, event_name = ?, event_description = ?,
    event_date = ?, start_time = ?, venue = ?, location = ?,
    latitude = ?, longitude = ?, ticket_price = ?, fundraising_goal = ?,
    amount_raised = ?, event_image = ?, is_active = ?, is_suspended = ?
  WHERE event_id = ?`;

// ---------------------------------------------------------------
// POST / - create a new charity event (admin "New" page)
// ---------------------------------------------------------------
router.post("/", async (req, res) => {
  const invalid = validateEventBody(req.body || {});
  if (invalid) {
    return res.status(400).json(invalid);
  }

  try {
    const result = await runCommand(INSERT_SQL, eventParams(req.body));
    res.status(201).json({
      message: "Event created successfully.",
      event_id: result.insertId,
    });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ error: "The selected category or organisation does not exist." });
    }
    res.status(500).json({ error: "Failed to create the event." });
  }
});

// ---------------------------------------------------------------
// PUT /:id - update an existing event (admin "Update" page)
// ---------------------------------------------------------------
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Invalid event id." });
  }

  const invalid = validateEventBody(req.body || {});
  if (invalid) {
    return res.status(400).json(invalid);
  }

  try {
    const existing = await runQuery("SELECT event_id FROM event WHERE event_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    await runCommand(UPDATE_SQL, [...eventParams(req.body), Number(id)]);
    res.json({ message: "Event updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update the event." });
  }
});

// ---------------------------------------------------------------
// DELETE /:id - delete an event.
// DATA INTEGRITY: an event that already received registrations
// must NOT be deleted. The attempt is blocked with 409 Conflict.
// ---------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Invalid event id." });
  }

  try {
    const existing = await runQuery("SELECT event_id FROM event WHERE event_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    const registrations = await runQuery(
      "SELECT COUNT(*) AS total FROM registration WHERE event_id = ?",
      [id]
    );

    if (registrations[0].total > 0) {
      return res.status(409).json({
        error:
          `This event cannot be deleted because it already has ` +
          `${registrations[0].total} registration(s). ` +
          `Remove the registrations first or suspend the event instead.`,
      });
    }

    await runCommand("DELETE FROM event WHERE event_id = ?", [Number(id)]);
    res.json({ message: "Event deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete the event." });
  }
});

module.exports = router;
