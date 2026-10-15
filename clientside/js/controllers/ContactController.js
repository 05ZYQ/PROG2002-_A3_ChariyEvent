/**
 * ContactController.js
 * ---------------------------------------------------------------
 * Controller for the contact page (contact.html).
 * Loads the partner organisations' contact details from the API.
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityApp")
    .controller("ContactController", ["ApiService", "PageState", ContactController]);

  function ContactController(ApiService, PageState) {
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
