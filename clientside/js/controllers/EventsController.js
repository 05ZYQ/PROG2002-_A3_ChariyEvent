/**
 * EventsController.js
 * ---------------------------------------------------------------
 * Controller for the browse & search page (events.html).
 * Loads the category drop-down and runs the filtered search
 * against the API. Includes client-side validation of the date
 * filter and a "Clear filters" action.
 *
 * Author: 05ZYQ (1379209835@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityApp")
    .controller("EventsController", ["ApiService", "PageState", EventsController]);

  function EventsController(ApiService, PageState) {
    var self = this;

    self.categories = [];
    self.criteria = { date: "", location: "", category: "" };
    self.results = [];
    self.searched = false;
    self.formError = "";
    self.state = new PageState();

    activate();

    function activate() {
      // Drop-down contents for the category filter.
      ApiService.getCategories()
        .then(function (categories) {
          self.categories = categories;
        })
        .catch(function (error) {
          self.state.error = error.message;
        });

      // Show every upcoming event as the initial list.
      self.search();
    }

    /** Runs the search with the current filter values. */
    self.search = function () {
      self.formError = "";
      self.state.error = "";
      self.state.loading = true;

      // Client-side validation of the date filter.
      if (self.criteria.date && !/^\d{4}-\d{2}-\d{2}$/.test(self.criteria.date)) {
        self.state.loading = false;
        self.formError = "Please use the YYYY-MM-DD date format.";
        return;
      }

      var params = {};
      if (self.criteria.date) params.date = self.criteria.date;
      if (self.criteria.location) params.location = self.criteria.location;
      if (self.criteria.category) params.category = self.criteria.category;

      ApiService.filterEvents(params)
        .then(function (events) {
          self.results = events;
          self.searched = true;
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.loading = false;
        });
    };

    /** Resets all three filters and reloads the full list. */
    self.clearFilters = function () {
      self.criteria = { date: "", location: "", category: "" };
      self.formError = "";
      self.search();
    };
  }
})();
