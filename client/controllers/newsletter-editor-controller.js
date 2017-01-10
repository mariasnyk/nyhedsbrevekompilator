app.controller('NewsletterEditorController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', '$q', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, $q, notifications, loadingSwitch) {

    var Newsletters = $resource('/newsletters/:ident', { ident: '@ident' });
    var Identities = $resource('/newsletters/identities');
    var Categories = $resource('/newsletters/categories');
    var Lists = $resource('/newsletters/lists/:list', { list: '@list' });
    var Templates = $resource('/templates/:name', { name: '@name' });

    $scope.dirty = false;

    $scope.identities = Identities.query();
    $scope.categories = Categories.query();
    $scope.lists = Lists.query();
    $scope.html_templates = Templates.query({filter:'.html'});
    $scope.plain_templates = Templates.query({filter:'.plain'});

    // Waiting for the drop-down data to be fetched before we query the newsletter.
    // This is done so that drop-downs are populated and the equivalent newsletter value is selected in the drop-down.
    var all = $q.all([$scope.identities.$promise, $scope.categories.$promise, $scope.lists.$promise, $scope.html_templates.$promise, $scope.plain_templates.$promise]).then(function () {
      $scope.newsletter = Newsletters.get({ ident: $routeParams.ident }, function () { /* All OK. */ }, resourceErrorHandler);
      loadingSwitch.watch($scope.newsletter);
    }).catch(function (error, result) {
      console.log('catch', error, result)
    });

    loadingSwitch.watch(all);


    function resourceErrorHandler (response) {
      console.log('Error fetching ' + $routeParams.ident, response);
      if (response.status === 404) {
        $location.url('/');
      }
    }


    $scope.addCategory = function (clickEvent, category) {
      console.log('dfdfd', category);
      addItemToArray(clickEvent, 'categories', 'newCategory', category);
    };

    $scope.addTag = function (clickEvent, tag) {
      addItemToArray(clickEvent, 'tags', 'newTag', tag);
    };

    function addItemToArray (clickEvent, item_array, item_scope, itemClickedWithMouse) {
      if ($scope.newsletter[item_array] === undefined) {
        $scope.newsletter[item_array] = [];
      }

      var enterWasPressed = clickEvent.originalEvent instanceof KeyboardEvent && clickEvent.keyCode === 13;
      var mouseWasClicked = clickEvent.originalEvent instanceof MouseEvent;

      if (enterWasPressed || mouseWasClicked) {
        // If the items was clicked with a mouse, then we use that.
        // Insted we take the value that the user has entered in the input-element (scope)
        var item = itemClickedWithMouse ? itemClickedWithMouse : $scope[item_scope];
        item = item.trim();
        if (item.length > 0) {
          if ($scope.newsletter[item_array].indexOf(item) === -1) {
            $scope.newsletter[item_array].push(item);
            $scope.dirty = true;
            $scope[item_scope] = '';
          }
        }
      }
    }

    $scope.removeCategory = function (categoryIndex) {
      $scope.newsletter.categories.splice(categoryIndex, 1);
      $scope.dirty = true;
    };

    $scope.removeTag = function (tagIndex) {
      $scope.newsletter.tags.splice(tagIndex, 1);
      $scope.dirty = true;
    };

    $scope.saveNewsletter = function () {

      // We're not allowing changing the ident at this time.
      delete $scope.newsletter.ident;

      var saving = Newsletters.save({ ident: $routeParams.ident }, $scope.newsletter, function (success) {
        notifications.showSuccess('Gemt');
        console.log('Success saving template.');
        $scope.dirty = false;
      });
      loadingSwitch.watch(saving, 'Saving');
    };


    $scope.closeNewsletterEditor = function () {
      if ($scope.dirty === false || confirm("Sikker på du vil lukke uden at gemme dine ændringer?")) {
        $location.url('/' + $routeParams.ident);
      }
    };


    $scope.deleteNewsletter = function () {
      if (confirm("Er du sikker på du ønsker at slette dette nyhedsbrev?\nDenne handling kan ikke fortrydes!")) {
        var deleting = Newsletters.delete({ ident: $routeParams.ident }, function () {
          $location.url('/');
        });
        loadingSwitch.watch(deleting, 'Deleting');
      }
    };

    $scope.setDirty = function () {
      $scope.dirty = true;
    };
  }]);
