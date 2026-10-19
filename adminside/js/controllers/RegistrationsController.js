/**
 * RegistrationsController.js
 * ---------------------------------------------------------------
 * Controller for the admin registrations page (registrations.html).
 * Lists all registrations (optionally filtered by one event) and
 * allows staff to delete a registration after confirmation.
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityAdmin")
    .controller("RegistrationsController", [
      "AdminApi",
      "$window",
      "PageState",
      RegistrationsController,
    ]);

  function RegistrationsController(AdminApi, $window, PageState) {
    var self = this;

    self.events = [];
    self.registrations = [];
    self.selectedEventId = "";
    self.state = new PageState();

    /** Loads the registration list, filtered when an event is chosen. */
    self.reload = function () {
      self.state.loading = true;
      self.state.error = "";
      self.state.success = "";

      AdminApi.getRegistrations(self.selectedEventId || null)
        .then(function (registrations) {
          self.registrations = registrations;
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.loading = false;
        });
    };

    /** Deletes one registration after a confirmation dialog. */
    self.deleteRegistration = function (registration) {
      var confirmed = $window.confirm(
        'Delete the registration of "' + registration.full_name + '" for "' +
          registration.event_name + '"?'
      );
      if (!confirmed) return;

      AdminApi.deleteRegistration(registration.registration_id)
        .then(function (result) {
          self.state.error = "";
          self.state.success = result.message;
          self.registrations = self.registrations.filter(function (r) {
            return r.registration_id !== registration.registration_id;
          });
        })
        .catch(function (error) {
          self.state.success = "";
          self.state.error = error.message;
        });
    };

    // Initial load. Placed after self.reload / self.deleteRegistration are
    // defined so the controller does not throw "self.reload is not a function".
    activate();

    function activate() {
      self.state.loading = true;

      AdminApi.listEvents({ includePast: false, includeSuspended: false })
        .then(function (events) {
          self.events = events;
        })
        .catch(function (error) {
          self.state.error = error.message;
        });

      self.reload();
    }
  }
})();
