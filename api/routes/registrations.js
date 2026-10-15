/**
 * routes/registrations.js
 * ---------------------------------------------------------------
 * Registration resource - the NEW Assessment 3 feature.
 *
 *   GET    /            all registrations (admin; ?event_id=N filter)
 *   POST   /            register a web user for an event (public page)
 *   DELETE /:id         remove a single registration (admin)
 *
 * The UNIQUE (event_id, email) constraint in the database guarantees
 * that one person can only register once for each event, while
 * still being free to register for many different events. A
 * duplicate attempt is translated into a 409 Conflict response.
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

const express = require("express");
const { runQuery, runCommand } = require("../event_db");
const { DATE_RE, EMAIL_RE, isBlank } = require("./validation");

const router = express.Router();

// ---------------------------------------------------------------
// GET / - all registrations, newest first (admin "Registrations" page)
// Optional ?event_id=N filters the list to a single event.
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  const { event_id } = req.query;

  let sql = `
    SELECT r.registration_id, r.event_id, r.full_name, r.email, r.phone,
           r.registration_date, r.tickets_purchased, r.notes,
           e.event_name, e.event_date
      FROM registration r
      JOIN event e ON e.event_id = r.event_id`;
  const params = [];

  if (event_id !== undefined) {
    if (!/^\d+$/.test(event_id)) {
      return res.status(400).json({ error: "Invalid event_id." });
    }
    sql += " WHERE r.event_id = ?";
    params.push(event_id);
  }

  sql += " ORDER BY r.registration_date DESC, r.registration_id DESC";

  try {
    res.json(await runQuery(sql, params));
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve registrations." });
  }
});

// ---------------------------------------------------------------
// POST / - the registration page "Confirm registration" button
// ---------------------------------------------------------------
router.post("/", async (req, res) => {
  const r = req.body || {};

  // --- server-side validation (mirrors the AngularJS form checks) ---
  const missing = [];
  if (isBlank(r.event_id)) missing.push("event_id");
  if (isBlank(r.full_name)) missing.push("full_name");
  if (isBlank(r.email)) missing.push("email");
  if (isBlank(r.phone)) missing.push("phone");
  if (isBlank(r.registration_date)) missing.push("registration_date");
  if (r.tickets_purchased === undefined || r.tickets_purchased === "")
    missing.push("tickets_purchased");
  if (missing.length > 0) {
    return res
      .status(400)
      .json({ error: `Missing required field(s): ${missing.join(", ")}.` });
  }

  if (!/^\d+$/.test(String(r.event_id))) {
    return res.status(400).json({ error: "Invalid event_id." });
  }
  if (!EMAIL_RE.test(String(r.email).trim())) {
    return res.status(400).json({ error: "Invalid email address." });
  }
  if (!DATE_RE.test(r.registration_date)) {
    return res
      .status(400)
      .json({ error: "Invalid registration_date. Use the YYYY-MM-DD format." });
  }

  const tickets = Number(r.tickets_purchased);
  if (!Number.isInteger(tickets) || tickets < 1 || tickets > 20) {
    return res
      .status(400)
      .json({ error: "tickets_purchased must be a whole number between 1 and 20." });
  }

  try {
    // The event must exist and must not be suspended.
    const event = await runQuery(
      "SELECT event_id, event_date, is_suspended FROM event WHERE event_id = ?",
      [r.event_id]
    );
    if (event.length === 0) {
      return res
        .status(404)
        .json({ error: "The event you are registering for does not exist." });
    }
    if (event[0].is_suspended === 1) {
      return res
        .status(400)
        .json({ error: "This event has been suspended and is not taking registrations." });
    }

    const result = await runCommand(
      `INSERT INTO registration
         (event_id, full_name, email, phone, registration_date, tickets_purchased, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(r.event_id),
        String(r.full_name).trim(),
        String(r.email).trim().toLowerCase(),
        String(r.phone).trim(),
        r.registration_date,
        tickets,
        isBlank(r.notes) ? null : String(r.notes).trim().slice(0, 300),
      ]
    );

    res.status(201).json({
      message: "Registration successful. See you at the event!",
      registration_id: result.insertId,
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error:
          "This email address has already registered for this event. " +
          "Each person may only register once per event.",
      });
    }
    res.status(500).json({ error: "Failed to save the registration." });
  }
});

// ---------------------------------------------------------------
// DELETE /:id - remove one registration (admin)
// Handy when a participant cancels, and required before an event
// with registrations can be deleted.
// ---------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Invalid registration id." });
  }

  try {
    const result = await runCommand(
      "DELETE FROM registration WHERE registration_id = ?",
      [Number(id)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Registration not found." });
    }
    res.json({ message: "Registration deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete the registration." });
  }
});

module.exports = router;
