/**
 * CategoriesController.js
 * ---------------------------------------------------------------
 * Controller for the categories page (categories.html).
 * Lists all categories with their event counts and lets the user
 * drill down into the upcoming events of one category.
 *
 * Author: hahaha135135 (623881354@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityApp")
    .controller("CategoriesController", ["ApiService", "PageState", CategoriesController]);

  function CategoriesController(ApiService, PageState) {
    var self = this;

    self.categories = [];
    self.results = [];
    self.selected = "";
    self.selectedName = "";
    self.state = new PageState();

    activate();

    function activate() {
      ApiService.getCategories()
        .then(function (categories) {
          self.categories = categories;
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.loading = false;
        });
    }

    /** Loads the upcoming events of one category into the results panel. */
    self.searchCategory = function (categoryId) {
      var category = null;
      self.categories.forEach(function (c) {
        if (c.category_id === categoryId) category = c;
      });

      if (!category) return;

      self.selected = String(categoryId);
      self.selectedName = category.category_name;

      ApiService.filterEvents({ category: categoryId })
        .then(function (events) {
          self.results = events;
        })
        .catch(function (error) {
          self.state.error = error.message;
        });
    };
  }
})();
