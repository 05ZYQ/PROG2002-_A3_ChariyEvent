/**
 * AboutController.js
 * ---------------------------------------------------------------
 * Controller for the about page (about.html).
 * Loads the partner organisations from the API.
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityApp")
    .controller("AboutController", ["ApiService", "PageState", AboutController]);

  function AboutController(ApiService, PageState) {
    var self = this;

    self.orgs = [];
    self.state = new PageState();

    activate();

    function activate() {
      ApiService.getOrganisations()
        .then(function (orgs) {
          self.orgs = orgs;
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
