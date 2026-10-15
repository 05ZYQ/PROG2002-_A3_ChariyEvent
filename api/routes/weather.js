/**
 * routes/weather.js
 * ---------------------------------------------------------------
 * EXTERNAL API INTEGRATION (optional bonus requirement).
 *
 *   GET /api/weather?lat=-33.87&lon=151.21&days=7
 *
 * Proxy for the free Open-Meteo forecast service (open-meteo.com).
 * The server calls the public API, translates the raw weather codes
 * into plain-English descriptions (see the code table in the A3
 * brief) and returns a tidy summary that both the client-side and
 * admin-side websites can display next to an event.
 *
 * The event table stores latitude / longitude so any event page can
 * ask for a venue-specific 7 day forecast.
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

const express = require("express");
const { isBlank } = require("./validation");

const router = express.Router();

// Weather code translation table from the A3 brief.
const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",
  80: "Light rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

router.get("/", async (req, res) => {
  const { lat, lon, days } = req.query;

  if (isBlank(lat) || isBlank(lon)) {
    return res.status(400).json({ error: "Both lat and lon query parameters are required." });
  }
  if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) {
    return res.status(400).json({ error: "lat and lon must be numbers." });
  }

  const forecastDays = Math.min(Math.max(Number(days) || 7, 1), 7);

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
    "&timezone=auto" +
    `&forecast_days=${forecastDays}`;

  try {
    const response = await fetch(url); // Node.js 18+ global fetch
    if (!response.ok) {
      return res.status(502).json({ error: "The weather service is unavailable right now." });
    }
    const data = await response.json();

    const daily = (data.daily.time || []).map((date, i) => ({
      date,
      weather_code: data.daily.weather_code[i],
      description: WEATHER_CODES[data.daily.weather_code[i]] || "Unknown conditions",
      max_temp: data.daily.temperature_2m_max[i],
      min_temp: data.daily.temperature_2m_min[i],
      rain_chance: data.daily.precipitation_probability_max[i],
    }));

    res.json({ source: "Open-Meteo (open-meteo.com)", timezone: data.timezone, daily });
  } catch (err) {
    res.status(502).json({ error: "Could not reach the Open-Meteo weather service." });
  }
});

module.exports = router;
