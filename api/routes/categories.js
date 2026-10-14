/**
 * routes/categories.js
 * ---------------------------------------------------------------
 * Category resource - read endpoints for the public website plus
 * the C.R.U.D. cycle used by the admin-side website.
 *
 *   GET    /            all categories (with event counts)
 *   POST   /            insert a new category     (admin)
 *   PUT    /:id         update an existing category (admin)
 *   DELETE /:id         delete a category (blocked while events use it)
 *
 * Author: 05ZYQ (1379209835@qq.com)
 * ---------------------------------------------------------------
 */

const express = require("express");
const { runQuery, runCommand } = require("../event_db");
const { isBlank } = require("./validation");

const router = express.Router();

// ---------------------------------------------------------------
// GET / - all categories, including how many events use each one
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT c.category_id, c.category_name, c.category_description,
              COUNT(e.event_id) AS event_count
         FROM category c
         LEFT JOIN event e ON e.category_id = c.category_id
        GROUP BY c.category_id, c.category_name, c.category_description
        ORDER BY c.category_name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve categories." });
  }
});

// ---------------------------------------------------------------
// POST / - create a category (admin)
// ---------------------------------------------------------------
router.post("/", async (req, res) => {
  const c = req.body || {};
  if (isBlank(c.category_name) || isBlank(c.category_description)) {
    return res
      .status(400)
      .json({ error: "Both category_name and category_description are required." });
  }

  try {
    const result = await runCommand(
      "INSERT INTO category (category_name, category_description) VALUES (?, ?)",
      [String(c.category_name).trim(), String(c.category_description).trim()]
    );
    res
      .status(201)
      .json({ message: "Category created successfully.", category_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "A category with that name already exists." });
    }
    res.status(500).json({ error: "Failed to create the category." });
  }
});

// ---------------------------------------------------------------
// PUT /:id - update a category (admin)
// ---------------------------------------------------------------
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Invalid category id." });
  }

  const c = req.body || {};
  if (isBlank(c.category_name) || isBlank(c.category_description)) {
    return res
      .status(400)
      .json({ error: "Both category_name and category_description are required." });
  }

  try {
    const existing = await runQuery(
      "SELECT category_id FROM category WHERE category_id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Category not found." });
    }

    await runCommand(
      "UPDATE category SET category_name = ?, category_description = ? WHERE category_id = ?",
      [String(c.category_name).trim(), String(c.category_description).trim(), Number(id)]
    );
    res.json({ message: "Category updated successfully." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "A category with that name already exists." });
    }
    res.status(500).json({ error: "Failed to update the category." });
  }
});

// ---------------------------------------------------------------
// DELETE /:id - blocked while any event still uses the category
// ---------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Invalid category id." });
  }

  try {
    const inUse = await runQuery(
      "SELECT COUNT(*) AS total FROM event WHERE category_id = ?",
      [id]
    );
    if (inUse[0].total > 0) {
      return res.status(409).json({
        error: `This category is used by ${inUse[0].total} event(s) and cannot be deleted.`,
      });
    }

    const result = await runCommand("DELETE FROM category WHERE category_id = ?", [Number(id)]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found." });
    }
    res.json({ message: "Category deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete the category." });
  }
});

module.exports = router;
