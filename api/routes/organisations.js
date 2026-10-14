/**
 * routes/organisations.js
 * ---------------------------------------------------------------
 * Organisation resource - read-only endpoints used by the public
 * "About" and "Contact" pages and the admin event form drop-down.
 *
 *   GET /   all hosting organisations
 *
 * Author: 05ZYQ (1379209835@qq.com)
 * ---------------------------------------------------------------
 */

const express = require("express");
const { runQuery } = require("../event_db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT org_id, org_name, org_mission, contact_email,
              contact_phone, website
         FROM organisation
        ORDER BY org_name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve organisations." });
  }
});

module.exports = router;
