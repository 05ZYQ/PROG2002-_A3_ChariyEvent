/**
 * app.js (admin-side)
 * ---------------------------------------------------------------
 * AngularJS module, shared services and filters for the staff
 * dashboard of the Kindred City Charity website.
 *
 * The admin-side website exposes the full C.R.U.D. cycle over the
 * events, categories and registrations through the same RESTful
 * API as the public website - it simply calls the POST / PUT /
 * DELETE endpoints as well as the GET ones.
 *
 * Services:
 *   AdminApi  - every RESTful endpoint used by the staff pages
 *   PageState - loading / error / success / busy flags
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  var API_BASE = window.API_BASE_URL || "/api";

  var app = angular.module("charityAdmin", []);

  // -------------------------------------------------------------
  // AdminApi
  // -------------------------------------------------------------
  app.factory("AdminApi", [
    "$http",
    "$q",
    function ($http, $q) {
      function call(method, url, body, params) {
        return $http({
          method: method,
          url: API_BASE + url,
          data: body,
          params: params,
        }).then(
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
        // ---- events (full CRUD) ----
        listEvents: function (opts) {
          var params = {};
          if (opts && opts.includePast === false) params.includePast = 0;
          if (opts && opts.includeSuspended === false) params.includeSuspended = 0;
          return call("GET", "/events", null, params);
        },
        getEvent: function (id) {
          return call("GET", "/events/" + id);
        },
        createEvent: function (event) {
          return call("POST", "/events", event);
        },
        updateEvent: function (id, event) {
          return call("PUT", "/events/" + id, event);
        },
        deleteEvent: function (id) {
          return call("DELETE", "/events/" + id);
        },

        // ---- categories ----
        getCategories: function () {
          return call("GET", "/categories");
        },
        createCategory: function (category) {
          return call("POST", "/categories", category);
        },
        updateCategory: function (id, category) {
          return call("PUT", "/categories/" + id, category);
        },
        deleteCategory: function (id) {
          return call("DELETE", "/categories/" + id);
        },

        // ---- organisations (read only, for the form drop-down) ----
        getOrganisations: function () {
          return call("GET", "/organisations");
        },

        // ---- registrations ----
        getRegistrations: function (eventId) {
          return call("GET", "/registrations", null, eventId ? { event_id: eventId } : {});
        },
        deleteRegistration: function (id) {
          return call("DELETE", "/registrations/" + id);
        },

        // ---- dashboard ----
        getStats: function () {
          return call("GET", "/stats");
        },

        // ---- weather (Open-Meteo proxy) ----
        getWeather: function (lat, lon, days) {
          return call("GET", "/weather", null, { lat: lat, lon: lon, days: days || 7 });
        },
      };
    },
  ]);

  // -------------------------------------------------------------
  // PageState
  // -------------------------------------------------------------
  app.factory("PageState", function () {
    return function PageState() {
      this.loading = true;
      this.error = "";
      this.success = "";
      this.busy = false;
    };
  });

  // -------------------------------------------------------------
  // PageParams - URL query string helper (edit-event.html?id=3)
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
  // Shared date normaliser: AngularJS date inputs bind to Date
  // objects while the API expects plain "YYYY-MM-DD" strings.
  // -------------------------------------------------------------
  app.factory("DateUtil", function () {
    return {
      toISO: function (value) {
        if (value instanceof Date) {
          var month = String(value.getMonth() + 1).padStart(2, "0");
          var day = String(value.getDate()).padStart(2, "0");
          return value.getFullYear() + "-" + month + "-" + day;
        }
        return String(value || "").slice(0, 10);
      },
      fromISO: function (iso) {
        if (!iso) return new Date();
        return new Date(String(iso).slice(0, 10) + "T00:00:00");
      },
    };
  });

  // -------------------------------------------------------------
  // Filters (same set as the client-side app)
  // -------------------------------------------------------------
  var MONTHS_FULL = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  app.filter("fullDate", function () {
    return function (isoDate) {
      if (!isoDate) return "";
      var parts = String(isoDate).slice(0, 10).split("-");
      return Number(parts[2]) + " " + MONTHS_FULL[Number(parts[1]) - 1] + " " + parts[0];
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
      if (amount === 0) return "Free";
      return "$" + amount.toFixed(2);
    };
  });

  app.filter("money", function () {
    return function (value) {
      return "$" + Number(value).toLocaleString("en-AU", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    };
  });

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
})();
