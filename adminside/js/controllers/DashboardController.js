/**
 * DashboardController.js
 * ---------------------------------------------------------------
 * Controller for the admin home page (index.html).
 * Shows live statistics and the eight most recent registrations.
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityAdmin")
    .controller("DashboardController", ["AdminApi", "PageState", DashboardController]);

  function DashboardController(AdminApi, PageState) {
    var self = this;

    self.stats = null;
    self.state = new PageState();

    activate();

    function activate() {
      AdminApi.getStats()
        .then(function (stats) {
          self.stats = stats;
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
