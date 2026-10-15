/**
 * RegisterController.js
 * ---------------------------------------------------------------
 * Controller for the NEW registration page (register.html).
 *
 * Flow:
 *   1. Reads the selected event id from the URL query string
 *      (register.html?id=3) and displays the event information so
 *      the user knows exactly what they are registering for.
 *   2. Collects the registration details in a form: full name,
 *      email, phone, registration date, number of tickets and an
 *      optional note.
 *   3. Validates the input client-side; each invalid field shows a
 *      clear message and no request is sent.
 *   4. POSTs the record to /api/registrations. On success a
 *      confirmation panel is shown with a link back to the event
 *      page; on failure the server's error message is displayed
 *      (e.g. "this email already registered for this event").
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityApp")
    .controller("RegisterController", [
      "ApiService",
      "PageState",
      "PageParams",
      RegisterController,
    ]);

  function RegisterController(ApiService, PageState, PageParams) {
    var self = this;

    self.event = null;
    self.state = new PageState();
    self.errors = {};      // per-field validation messages
    self.form = {
      full_name: "",
      email: "",
      phone: "",
      registration_date: new Date(), // date input binds to a Date object
      tickets_purchased: 1,
      notes: "",
    };

    activate();

    function activate() {
      var id = PageParams.getParam("id");

      if (!id || !/^\d+$/.test(id)) {
        self.state.loading = false;
        self.state.error =
          "No event was selected. Please pick an event before registering.";
        return;
      }

      ApiService.getEvent(id)
        .then(function (event) {
          if (Number(event.is_suspended) === 1) {
            throw new Error(
              "This event has been suspended and is not taking registrations."
            );
          }
          self.event = event;
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.loading = false;
        });
    }

    /** Client-side validation; fills self.errors and returns true when valid. */
    function validate() {
      self.errors = {};

      if (!self.form.full_name || !self.form.full_name.trim()) {
        self.errors.full_name = "Please enter your full name.";
      }

      if (!self.form.email) {
        self.errors.email = "Please enter your email address.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(self.form.email.trim())) {
        self.errors.email = "That email address does not look valid.";
      }

      if (!self.form.phone || !self.form.phone.trim()) {
        self.errors.phone = "Please enter a contact phone number.";
      }

      if (!self.form.registration_date) {
        self.errors.registration_date = "Please choose the registration date.";
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizeDate(self.form.registration_date))) {
        self.errors.registration_date = "Please use the YYYY-MM-DD format.";
      }

      var tickets = Number(self.form.tickets_purchased);
      if (self.form.tickets_purchased === "" || self.form.tickets_purchased === null) {
        self.errors.tickets_purchased = "Please say how many tickets you need.";
      } else if (!Number.isInteger(tickets) || tickets < 1 || tickets > 20) {
        self.errors.tickets_purchased = "Tickets must be a whole number between 1 and 20.";
      }

      return Object.keys(self.errors).length === 0;
    }

    /** Submit button: validate, then POST the new registration. */
    self.submit = function () {
      self.state.error = "";
      self.state.success = "";
      self.state.busy = true;

      if (!validate()) {
        self.state.busy = false;
        return;
      }

      ApiService.createRegistration({
        event_id: self.event.event_id,
        full_name: self.form.full_name,
        email: self.form.email,
        phone: self.form.phone,
        registration_date: normalizeDate(self.form.registration_date),
        tickets_purchased: Number(self.form.tickets_purchased),
        notes: self.form.notes,
      })
        .then(function (result) {
          self.state.success = result.message +
            " Registration reference: #" + result.registration_id + ".";
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.busy = false;
        });
    };

    /**
     * AngularJS binds <input type="date"> to a Date object; the API
     * expects the plain "YYYY-MM-DD" string. This helper accepts
     * either and returns the string form.
     */
    function normalizeDate(value) {
      if (value instanceof Date) {
        var month = String(value.getMonth() + 1).padStart(2, "0");
        var day = String(value.getDate()).padStart(2, "0");
        return value.getFullYear() + "-" + month + "-" + day;
      }
      return String(value).slice(0, 10);
    }
  }
})();
