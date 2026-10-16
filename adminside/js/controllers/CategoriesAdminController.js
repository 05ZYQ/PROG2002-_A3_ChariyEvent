/**
 * CategoriesAdminController.js
 * ---------------------------------------------------------------
 * Controller for the admin categories page (categories.html).
 * Extra C.R.U.D. beyond the required event CRUD: staff can create,
 * update and delete categories; deletion is blocked by the API
 * while events still reference the category.
 *
 * Author: 05ZYQ (1379209835@qq.com)
 * ---------------------------------------------------------------
 */

(function () {
  "use strict";

  angular
    .module("charityAdmin")
    .controller("CategoriesAdminController", [
      "AdminApi",
      "$window",
      "PageState",
      CategoriesAdminController,
    ]);

  function CategoriesAdminController(AdminApi, $window, PageState) {
    var self = this;

    self.categories = [];
    self.newCategory = { category_name: "", category_description: "" };
    self.edit = null; // category currently being edited inline
    self.state = new PageState();

    activate();

    function activate() {
      self.reload();
    }

    function reload() {
      self.state.loading = true;
      AdminApi.getCategories()
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

    /** Creates the category typed into the "Add" form. */
    self.createCategory = function () {
      self.state.error = "";
      self.state.success = "";
      self.state.busy = true;

      if (!self.newCategory.category_name.trim() ||
          !self.newCategory.category_description.trim()) {
        self.state.busy = false;
        self.state.error = "Both the name and description are required.";
        return;
      }

      AdminApi.createCategory(self.newCategory)
        .then(function (result) {
          self.state.success = result.message;
          self.newCategory = { category_name: "", category_description: "" };
          reload();
        })
        .catch(function (error) {
          self.state.error = error.message;
        })
        .finally(function () {
          self.state.busy = false;
        });
    };

    /** Inline edit helpers. */
    self.isEditing = function (category) {
      return self.edit !== null && self.edit.category_id === category.category_id;
    };

    self.startEdit = function (category) {
      self.edit = {
        category_id: category.category_id,
        category_name: category.category_name,
        category_description: category.category_description,
      };
    };

    self.cancelEdit = function () {
      self.edit = null;
    };

    self.saveEdit = function () {
      self.state.error = "";
      self.state.success = "";

      if (!self.edit.category_name.trim() || !self.edit.category_description.trim()) {
        self.state.error = "Both the name and description are required.";
        return;
      }

      AdminApi.updateCategory(self.edit.category_id, self.edit)
        .then(function (result) {
          self.state.success = result.message;
          self.edit = null;
          reload();
        })
        .catch(function (error) {
          self.state.error = error.message;
        });
    };

    /** Deletes a category; the API blocks categories still in use. */
    self.deleteCategory = function (category) {
      var confirmed = $window.confirm(
        'Delete the category "' + category.category_name + '"?'
      );
      if (!confirmed) return;

      self.state.error = "";
      self.state.success = "";

      AdminApi.deleteCategory(category.category_id)
        .then(function (result) {
          self.state.success = result.message;
          reload();
        })
        .catch(function (error) {
          self.state.error = error.message;
        });
    };
  }
})();
