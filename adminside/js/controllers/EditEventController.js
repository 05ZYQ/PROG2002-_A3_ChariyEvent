/**
 * EditEventController.js
 * ---------------------------------------------------------------
 * Controller for the admin "Edit Event" page (edit-event.html).
 *
 * Update feature:
 *   - selects an existing event via the ?id= query string and
 *     fills the form from GET /api/events/:id
 *   - the same response includes the registrations for the event,
 *     which are displayed below the form so staff can see who is
 *     coming while they edit
 *   - the Save button validates the form and calls
 *     PUT /api/events/:id (Part 2)
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityAdmin")
    .controller("EditEventController", [
      "AdminApi",
      "EventFormHelper",
      "PageState",
      "PageParams",
      EditEventController,
    ]);

  function EditEventController(AdminApi, EventFormHelper, PageState, PageParams) {
    var self = this;

    self.event = null;
    self.form = null;
    self.errors = {};
    self.categories = [];
    self.orgs = [];
    self.images = EventFormHelper.images;
    self.statusOptions = EventFormHelper.statusOptions;
    self.state = new PageState();

    activate();

    function activate() {
      var id = PageParams.getParam("id");

      if (!id || !/^\d+$/.test(id)) {
        self.state.loading = false;
        self.state.error = "No event was selected. Please pick one from the event list.";
        return;
      }

      // Load the drop-down contents first, then the event itself so
      // the <select> elements can preselect the saved values.
      AdminApi.getCategories().then(function (categories) {
        self.categories = categories;
      });

      AdminApi.getOrganisations().then(function (orgs) {
        self.orgs = orgs;
      });

      AdminApi.getEvent(id)
        .then(function (event) {
          self.event = event; // includes the registrations array
          self.form = EventFormHelper.fromApi(event);
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.loading = false;
        });
    }

    /** Save button: validate, then PUT the updated record. */
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

      AdminApi.updateEvent(self.event.event_id, EventFormHelper.toPayload(self.form))
        .then(function (response) {
          self.state.success = response.message;
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.busy = false;
        });
    };

    /** Tickets bought for this event across all registrations. */
    self.totalTickets = function () {
      if (!self.event) return 0;
      return self.event.registrations.reduce(function (sum, r) {
        return sum + Number(r.tickets_purchased);
      }, 0);
    };
  }
})();
