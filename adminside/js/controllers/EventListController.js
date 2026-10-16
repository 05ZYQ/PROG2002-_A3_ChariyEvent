/**
 * EventListController.js
 * ---------------------------------------------------------------
 * Controller for the admin event list page (events.html).
 *
 * List feature:
 *   - shows every registered event regardless of its status
 *     (Active, Past, Suspended), retrieved via GET /api/events
 *   - key administrative details are shown per event, including
 *     how many registrations / tickets it received
 *   - Delete calls DELETE /api/events/:id and shows clear feedback
 *     when the server blocks the deletion because registrations
 *     exist (HTTP 409)
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityAdmin")
    .controller("EventListController", ["AdminApi", "$window", "PageState", EventListController]);

  function EventListController(AdminApi, $window, PageState) {
    var self = this;

    self.events = [];
    self.showAll = true;
    self.state = new PageState();

    activate();

    function activate() {
      self.reload(true);
    }

    /** Loads the list; showAll=false hides past + suspended events. */
    self.reload = function (showAll) {
      self.showAll = showAll;
      self.state.loading = true;
      self.state.error = "";
      self.state.success = "";

      AdminApi.listEvents(showAll ? {} : { includePast: false, includeSuspended: false })
        .then(function (events) {
          self.events = events;
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.loading = false;
        });
    };

    /**
     * Delete feature: asks for confirmation first, then calls the
     * DELETE endpoint. If the event still has registrations the API
     * refuses with 409 and the message is displayed in red so the
     * staff member knows why nothing was removed.
     */
    self.deleteEvent = function (event) {
      var confirmed = $window.confirm(
        'Delete the event "' + event.event_name + '"?\n\n' +
          "This can only succeed when the event has no registrations yet."
      );
      if (!confirmed) return;

      AdminApi.deleteEvent(event.event_id)
        .then(function (result) {
          self.state.error = "";
          self.state.success = result.message;
          // Remove the row locally so the table updates instantly.
          self.events = self.events.filter(function (e) {
            return e.event_id !== event.event_id;
          });
        })
        .catch(function (error) {
          self.state.success = "";
          self.state.error = error.message;
        });
    };
  }
})();
