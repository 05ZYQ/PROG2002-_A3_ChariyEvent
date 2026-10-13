/**
 * event_db.js
 * ---------------------------------------------------------------
 * Database connection module for the Kindred City Charity website.
 *
 * Creates a connection pool to the MySQL database "charityevents_db"
 * and exports two promise based helpers:
 *   runQuery(sql, params) -> rows            (SELECT)
 *   runCommand(sql, params) -> result object (INSERT / UPDATE / DELETE)
 *
 * Updated for Assessment 3: the schema now also contains the
 * `registration` table and the event latitude / longitude columns
 * used by the Open-Meteo weather API.
 *
 * PROG2002 Web Development II - Assessment 3
 * Group: 05ZYQ & hahaha135135
 * ---------------------------------------------------------------
 */

const mysql = require("mysql2");

// Pool configuration.
// Values can be overridden with environment variables so the same
// code runs on a local machine and on the SCU cPanel server.
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "charityevents_db",
  // Return DATE/DATETIME columns as plain strings so the client always
  // receives "YYYY-MM-DD" instead of a UTC-shifted JavaScript Date.
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Runs a parameterised SQL statement and resolves with the rows.
 * Placeholder values (?) are escaped by the driver, which protects
 * every endpoint against SQL injection.
 *
 * @param {string} sql      SQL statement with optional ? placeholders
 * @param {Array}  params   values for the placeholders
 * @returns {Promise<Array>} query result rows
 */
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) {
        console.error("[event_db] query failed:", err.message);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

/**
 * Same as runQuery but resolves with the full driver result object,
 * which exposes insertId / affectedRows needed by the C.R.U.D.
 * endpoints (POST, PUT and DELETE).
 *
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<Object>} { insertId, affectedRows, ... }
 */
function runCommand(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) {
        console.error("[event_db] command failed:", err.message);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

module.exports = { runQuery, runCommand, pool };
