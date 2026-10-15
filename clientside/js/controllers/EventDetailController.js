/**
 * EventDetailController.js
 * ---------------------------------------------------------------
 * Controller for the event detail page (event.html).
 *
 * A3 improvements:
 *   1. Calls the improved GET /api/events/:id endpoint which now
 *      returns the event details AND its registrations (already
 *      sorted by the latest purchase date first).
 *   2. The Register button links to the real registration page,
 *      passing the event id via the URL query string.
 *   3. Fetches a venue-specific 7 day forecast from the external
 *      Open-Meteo API (through our own /api/weather proxy) using
 *      the latitude / longitude columns added to the event table.
 *
 * Author: 05ZYQ (1379209835@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityApp")
    .controller("EventDetailController", [
      "ApiService",
      "PageState",
      "PageParams",
      EventDetailController,
    ]);

  function EventDetailController(ApiService, PageState, PageParams) {
    var self = this;

    self.event = null;
    self.weather = [];
    self.weatherLoading = false;
    self.weatherError = "";
    self.state = new PageState();

    activate();

    function activate() {
      // The event id arrives through the URL query string:
      //   event.html?id=3
      var id = PageParams.getParam("id");

      if (!id || !/^\d+$/.test(id)) {
        self.state.loading = false;
        self.state.error = "No event was selected. Please choose an event from the list.";
        return;
      }

      ApiService.getEvent(id)
        .then(function (event) {
          self.event = event;
          loadWeather(event);
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.loading = false;
        });
    }

    /** Venue forecast via the Open-Meteo proxy (optional feature). */
    function loadWeather(event) {
      if (!event.latitude || !event.longitude) {
        return; // no coordinates stored for this venue
      }
      self.weatherLoading = true;
      ApiService.getWeather(event.latitude, event.longitude, 7)
        .then(function (data) {
          self.weather = data.daily;
        })
        .catch(function (error) {
          self.weatherError = error.message;
        })
        .finally(function () {
          self.weatherLoading = false;
        });
    }

    /** "Upcoming" / "Past" / "Suspended" label for the tag. */
    self.statusTag = function () {
      if (!self.event) return "";
      if (Number(self.event.is_suspended) === 1) return "Suspended";
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(String(self.event.event_date).slice(0, 10) + "T00:00:00") < today
        ? "Past"
        : "Upcoming";
    };

    /** Percent of the fundraising goal reached (max 100). */
    self.progressPercent = function () {
      if (!self.event) return 0;
      var goal = Number(self.event.fundraising_goal);
      var raised = Number(self.event.amount_raised);
      if (!goal) return 0;
      return Math.min(Math.round((raised / goal) * 100), 100);
    };

    /** One-line summary under the progress bar. */
    self.progressNote = function () {
      var percent = self.progressPercent();
      if (!self.event) return "";
      if (percent >= 100) return "The fundraising goal has been reached - thank you!";
      return percent + "% of the goal has been raised so far.";
    };

    /** Sum of tickets bought for this event. */
    self.totalTickets = function () {
      if (!self.event) return 0;
      return self.event.registrations.reduce(function (sum, r) {
        return sum + Number(r.tickets_purchased);
      }, 0);
    };

    /** Simple emoji icon per Open-Meteo weather code. */
    self.weatherIcon = function (code) {
      if (code === 0 || code === 1) return "\u2600\uFE0F";       // clear / mainly clear
      if (code === 2) return "\u26C5";                            // partly cloudy
      if (code === 3) return "\u2601\uFE0F";                      // overcast
      if (code === 45 || code === 48) return "\uF0F5";            // fog -> mist symbol
      if (code >= 51 && code <= 55) return "\u1F327\uFE0F";       // drizzle
      if (code >= 61 && code <= 65) return "\u1F327\uFE0F";       // rain
      if (code >= 80 && code <= 82) return "\u1F327\uFE0F";       // rain showers
      if (code >= 95) return "\u26C8\uFE0F";                      // thunderstorm
      return "\u2B50";
    };
  }
})();
