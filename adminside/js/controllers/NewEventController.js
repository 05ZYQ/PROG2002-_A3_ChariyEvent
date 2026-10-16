/**
 * NewEventController.js
 * ---------------------------------------------------------------
 * Controller for the admin "New Event" page (new-event.html).
 *
 * New feature:
 *   - an intuitive form to create and submit new charity events
 *   - client-side validation ensures every required field is
 *     filled before anything is sent to the API
 *   - the Save button calls POST /api/events (Part 2) and reports
 *     the new event id on success
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityAdmin")
    .controller("NewEventController", [
      "AdminApi",
      "EventFormHelper",
      "PageState",
      NewEventController,
    ]);

  function NewEventController(AdminApi, EventFormHelper, PageState) {
    var self = this;

    self.categories = [];
    self.orgs = [];
    self.images = EventFormHelper.images;
    self.statusOptions = EventFormHelper.statusOptions;
    self.form = EventFormHelper.blankForm();
    self.errors = {};
    self.state = new PageState();

    activate();

    function activate() {
      self.state.loading = false;

      // Drop-down contents.
      AdminApi.getCategories().then(
        function (categories) {
          self.categories = categories;
        },
        function (error) {
          self.state.error = error.message;
        }
      );

      AdminApi.getOrganisations().then(
        function (orgs) {
          self.orgs = orgs;
        },
        function (error) {
          self.state.error = error.message;
        }
      );
    }

    /** Save button: validate first, then POST to the API. */
    self.save = function () {
      self.state.error = "";
      self.state.success = "";
      self.state.busy = true;

      var result = EventFormHelper.validate(self.form);
      self.errors = result.errors;
      if (!result.valid) {
        self.state.busy = false;
        return;
      }

      AdminApi.createEvent(EventFormHelper.toPayload(self.form))
        .then(function (response) {
          self.state.success =
            response.message + " The new event id is #" + response.event_id + ".";
          // Keep the confirmation on screen but reset the form.
          self.form = EventFormHelper.blankForm();
          self.errors = {};
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.busy = false;
        });
    };
  }
})();
