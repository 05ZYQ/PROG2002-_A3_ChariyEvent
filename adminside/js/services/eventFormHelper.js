/**
 * eventFormHelper.js
 * ---------------------------------------------------------------
 * Shared factory used by both the "New event" and "Edit event"
 * admin pages: a blank form template, the artwork drop-down list,
 * the validation rules and the Date-object conversions AngularJS
 * needs for <input type="date"> and <input type="time">.
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular.module("charityAdmin").factory("EventFormHelper", ["DateUtil", EventFormHelper]);

  function EventFormHelper(DateUtil) {
    var IMAGES = [
      "funrun.svg", "gala.svg", "auction.svg", "concert.svg",
      "quiz.svg", "market.svg", "trailrun.svg", "brunch.svg",
      "choir.svg", "art.svg",
    ];

    var STATUS_OPTIONS = [
      { value: 0, label: "Active" },
      { value: 1, label: "Suspended (hidden from the public)" },
    ];

    return {
      images: IMAGES,
      statusOptions: STATUS_OPTIONS,

      /** A blank event form with sensible defaults. */
      blankForm: function () {
        return {
          event_name: "",
          event_description: "",
          event_date: new Date(),
          start_time: new Date(2000, 0, 1, 18, 0, 0),
          venue: "",
          location: "",
          category_id: null,
          org_id: null,
          ticket_price: 0,
          fundraising_goal: 0,
          latitude: null,
          longitude: null,
          event_image: "market.svg",
          is_suspended: 0,
        };
      },

      /**
       * Validates the form and returns { errors, valid }.
       * Every required field must be present; the date must not be
       * blank (the API rejects empty dates with a clear message).
       */
      validate: function (form) {
        var errors = {};

        if (!form.event_name || !String(form.event_name).trim())
          errors.event_name = "Please enter the event name.";
        if (!form.event_description || !String(form.event_description).trim())
          errors.event_description = "Please describe the event.";
        if (!form.event_date) errors.event_date = "Please choose the event date.";
        if (!form.start_time) errors.start_time = "Please choose the start time.";
        if (!form.venue || !String(form.venue).trim())
          errors.venue = "Please enter the venue.";
        if (!form.location || !String(form.location).trim())
          errors.location = "Please enter the location (suburb).";
        if (form.category_id === null || form.category_id === "" || form.category_id === undefined)
          errors.category_id = "Please select a category.";
        if (form.org_id === null || form.org_id === "" || form.org_id === undefined)
          errors.org_id = "Please select the hosting organisation.";

        return { errors: errors, valid: Object.keys(errors).length === 0 };
      },

      /**
       * Converts the AngularJS form (Date objects for the date and
       * time inputs) into the plain JSON payload the API expects.
       */
      toPayload: function (form) {
        var time = form.start_time;
        var hh = String(time.getHours()).padStart(2, "0");
        var mm = String(time.getMinutes()).padStart(2, "0");

        return {
          event_name: form.event_name,
          event_description: form.event_description,
          event_date: DateUtil.toISO(form.event_date),
          start_time: hh + ":" + mm + ":00",
          venue: form.venue,
          location: form.location,
          category_id: form.category_id,
          org_id: form.org_id,
          ticket_price: Number(form.ticket_price) || 0,
          fundraising_goal: Number(form.fundraising_goal) || 0,
          amount_raised: Number(form.amount_raised) || 0,
          latitude: form.latitude === null || form.latitude === undefined ? "" : form.latitude,
          longitude: form.longitude === null || form.longitude === undefined ? "" : form.longitude,
          event_image: form.event_image,
          is_suspended: Number(form.is_suspended) || 0,
        };
      },

      /**
       * Fills an AngularJS form from the JSON the API returned:
       * strings become Date objects for the date/time inputs.
       */
      fromApi: function (event) {
        var timeBits = String(event.start_time || "18:00:00").split(":");
        return {
          event_name: event.event_name,
          event_description: event.event_description,
          event_date: DateUtil.fromISO(event.event_date),
          start_time: new Date(2000, 0, 1, Number(timeBits[0]), Number(timeBits[1])),
          venue: event.venue,
          location: event.location,
          category_id: Number(event.category_id),
          org_id: Number(event.org_id),
          ticket_price: Number(event.ticket_price),
          fundraising_goal: Number(event.fundraising_goal),
          amount_raised: Number(event.amount_raised),
          latitude: event.latitude === null ? null : Number(event.latitude),
          longitude: event.longitude === null ? null : Number(event.longitude),
          event_image: event.event_image,
          is_suspended: Number(event.is_suspended),
        };
      },
    };
  }
})();
