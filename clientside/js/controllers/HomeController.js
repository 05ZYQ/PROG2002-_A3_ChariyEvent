/**
 * HomeController.js
 * ---------------------------------------------------------------
 * Controller for the home page (index.html).
 * Loads the active, upcoming events from the API and exposes them
 * to the view together with loading / error flags.
 *
 * Author: 05ZYQ (1379209835@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityApp")
    .controller("HomeController", ["ApiService", "PageState", HomeController]);

  function HomeController(ApiService, PageState) {
    var self = this;

    self.events = [];
    self.state = new PageState();

    activate();

    function activate() {
      ApiService.upcomingEvents()
        .then(function (events) {
          self.events = events;
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.loading = false;
        });
    }
  }
})();
