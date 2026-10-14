/**
 * validation.js
 * Small shared helpers used by every router.
 * PROG2002 Web Development II - Assessment 3
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** true when the value is undefined, null, empty or whitespace only */
function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

/** column list shared by all event SELECT statements */
const EVENT_COLUMNS = `
  e.event_id, e.event_name, e.event_description, e.event_date,
  e.start_time, e.venue, e.location, e.latitude, e.longitude,
  e.ticket_price, e.fundraising_goal, e.amount_raised, e.event_image,
  e.is_active, e.is_suspended,
  c.category_id, c.category_name,
  o.org_id, o.org_name`;

const EVENT_FROM = `
  FROM event e
  JOIN category c     ON c.category_id = e.category_id
  JOIN organisation o ON o.org_id = e.org_id`;

module.exports = {
  DATE_RE,
  TIME_RE,
  EMAIL_RE,
  isBlank,
  EVENT_COLUMNS,
  EVENT_FROM,
};
