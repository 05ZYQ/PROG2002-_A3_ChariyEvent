/**
 * routes/stats.js
 * ---------------------------------------------------------------
 * Dashboard statistics for the admin home page.
 *
 *   GET /   { events, registrations, tickets, recent_registrations }
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

const express = require("express");
const { runQuery } = require("../event_db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [events, registrations, tickets, recent] = await Promise.all([
      runQuery(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN event_date >= CURDATE() AND is_suspended = 0 THEN 1 ELSE 0 END), 0) AS upcoming,
                COALESCE(SUM(CASE WHEN event_date <  CURDATE() THEN 1 ELSE 0 END), 0) AS past,
                COALESCE(SUM(CASE WHEN is_suspended = 1 THEN 1 ELSE 0 END), 0) AS suspended
           FROM event`
      ),
      runQuery("SELECT COUNT(*) AS total FROM registration"),
      runQuery("SELECT COALESCE(SUM(tickets_purchased), 0) AS total FROM registration"),
      runQuery(
        `SELECT r.registration_id, r.full_name, r.email, r.registration_date,
                r.tickets_purchased, e.event_name, e.event_id
           FROM registration r
           JOIN event e ON e.event_id = r.event_id
          ORDER BY r.registration_date DESC, r.registration_id DESC
          LIMIT 8`
      ),
    ]);

    res.json({
      events: events[0],
      registrations: registrations[0].total,
      tickets: tickets[0].total,
      recent_registrations: recent,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve statistics." });
  }
});

module.exports = router;
