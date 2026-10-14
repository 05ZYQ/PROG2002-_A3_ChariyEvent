/**
 * app.js
 * ---------------------------------------------------------------
 * AngularJS module, shared services and filters used by every
 * client-side page of the Kindred City Charity website.
 *
 * The website uses AngularJS 1.8 with one controller per page; each
 * page loads this file first and then its own controller file.
 *
 * Services:
 *   ApiService  - Promise wrappers around $http for every RESTful
 *                 endpoint exposed by the Node.js/Express API.
 *   PageState   - tiny helper for loading / error / empty messages.
 *
 * Filters:
 *   fullDate  - "2026-11-07"        -> "7 November 2026"
 *   dateBox   - "2026-11-07"        -> { day: "07", month: "Nov" }
 *   time12    - "19:00:00"         -> "7:00 pm"
 *   price     - 45                  -> "$45.00"  (0 -> "Free entry")
 *   money     - 27350               -> "$27,350"
 *   statusTag - event flags         -> "Upcoming" / "Past" / "Suspended"
 *
 * Author: 05ZYQ (1379209835@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  // Same origin when the Express server serves the client folder;
  // override with a full URL when the pages run on another host
  // (e.g. SCU cPanel) via window.API_BASE_URL before this script.
  var API_BASE = window.API_BASE_URL || "/api";

  var app = angular.module("charityApp", []);

  // -------------------------------------------------------------
  // ApiService - one method per RESTful endpoint
  // -------------------------------------------------------------
  app.factory("ApiService", [
    "$http",
    "$q",
    function ($http, $q) {
      // $http rejects on non-2xx: normalise the error body so every
      // controller receives an Error with the server's message.
      function call(method, url, body) {
        return $http({ method: method, url: API_BASE + url, data: body }).then(
          function (response) {
            return response.data;
          },
          function (response) {
            var message =
              (response.data && response.data.error) ||
              "The request failed (status " + response.status + "). Please try again.";
            return $q.reject(new Error(message));
          }
        );
      }

      return {
        // ---- events (public) ----
        upcomingEvents: function () {
          return call("GET", "/events/upcoming");
        },
        filterEvents: function (criteria) {
          return $http({
            method: "GET",
            url: API_BASE + "/events/filter",
            params: criteria,
          }).then(
            function (r) {
              return r.data;
            },
            function (response) {
              var message =
                (response.data && response.data.error) ||
                "The search failed (status " + response.status + ").";
              return $q.reject(new Error(message));
            }
          );
        },
        getEvent: function (id) {
          return call("GET", "/events/" + id);
        },

        // ---- categories (public) ----
        getCategories: function () {
          return call("GET", "/categories");
        },

        // ---- organisations (public) ----
        getOrganisations: function () {
          return call("GET", "/organisations");
        },

        // ---- registration (public) ----
        createRegistration: function (registration) {
          return call("POST", "/registrations", registration);
        },

        // ---- weather (external Open-Meteo proxy) ----
        getWeather: function (lat, lon, days) {
          return $http({
            method: "GET",
            url: API_BASE + "/weather",
            params: { lat: lat, lon: lon, days: days || 7 },
          }).then(
            function (r) {
              return r.data;
            },
            function (response) {
              var message =
                (response.data && response.data.error) ||
                "The weather service could not be reached.";
              return $q.reject(new Error(message));
            }
          );
        },
      };
    },
  ]);

  // -------------------------------------------------------------
  // PageParams - reads the URL query string of the current page
  // (e.g. event.html?id=3) so controllers can pass the event id
  // between pages without touching $location/html5 mode.
  // -------------------------------------------------------------
  app.factory("PageParams", [
    "$window",
    function ($window) {
      function getParam(name) {
        var params = new URLSearchParams($window.location.search);
        var value = params.get(name);
        return value === null ? "" : value;
      }
      return { getParam: getParam };
    },
  ]);

  // -------------------------------------------------------------
  // PageState - loading / error / success flags used by the views
  // -------------------------------------------------------------
  app.factory("PageState", function () {
    return function PageState() {
      this.loading = true;
      this.error = "";
      this.success = "";
      this.busy = false; // true while a form POST is in flight
    };
  });

  // -------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------
  var MONTHS_FULL = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  var MONTHS_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  app.filter("fullDate", function () {
    return function (isoDate) {
      if (!isoDate) return "";
      var parts = String(isoDate).slice(0, 10).split("-");
      return (
        Number(parts[2]) + " " + MONTHS_FULL[Number(parts[1]) - 1] + " " + parts[0]
      );
    };
  });

  app.filter("dateBox", function () {
    return function (isoDate) {
      if (!isoDate) return "";
      var parts = String(isoDate).slice(0, 10).split("-");
      return parts[2] + " " + MONTHS_SHORT[Number(parts[1]) - 1];
    };
  });

  app.filter("time12", function () {
    return function (sqlTime) {
      if (!sqlTime) return "";
      var bits = String(sqlTime).split(":");
      var hour = Number(bits[0]);
      var suffix = hour >= 12 ? "pm" : "am";
      hour = hour % 12 === 0 ? 12 : hour % 12;
      return hour + ":" + bits[1] + " " + suffix;
    };
  });

  app.filter("price", function () {
    return function (value) {
      var amount = Number(value);
      if (amount === 0) return "Free entry";
      return "$" + amount.toFixed(2);
    };
  });

  app.filter("money", function () {
    return function (value) {
      return (
        "$" +
        Number(value).toLocaleString("en-AU", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      );
    };
  });

  /** Upcoming / Past / Suspended label from the event flags */
  app.filter("statusTag", function () {
    return function (event) {
      if (!event) return "";
      if (Number(event.is_suspended) === 1) return "Suspended";
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(String(event.event_date).slice(0, 10) + "T00:00:00") < today
        ? "Past"
        : "Upcoming";
    };
  });

  /** "07 Nov" -> "07" (the day half of a dateBox string) */
  app.filter("splitDay", function () {
    return function (dateBox) {
      return String(dateBox || "").split(" ")[0] || "";
    };
  });

  /** "07 Nov" -> "Nov" (the month half of a dateBox string) */
  app.filter("splitMonth", function () {
    return function (dateBox) {
      return String(dateBox || "").split(" ")[1] || "";
    };
  });
})();
