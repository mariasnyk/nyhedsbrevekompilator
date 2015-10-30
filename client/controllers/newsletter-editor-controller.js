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
console.log('$scope.newsletter', $scope.newsletter)
      loadingSwitch.watch($scope.newsletter);
    }).catch(function (error, result) {
      console.log('catch', error, result)
    });
    console.log($q)
    console.log(all)

    loadingSwitch.watch(all);


    function resourceErrorHandler (response) {
      console.log('Error fetching ' + $routeParams.ident, response);
      if (response.status === 404) {
        $location.url('/');
      }
    }


    $scope.addCategory = function (clickEvent, category) {
      if ($scope.newsletter.categories === undefined) {
        $scope.newsletter.categories = [];
      }

      if (category) {
        $scope.newCategory = category
      }

      if (clickEvent.keyCode === 13 || category) {
        if ($scope.newCategory !== '') {
          $scope.newCategory.split(',').forEach( function (category) {
            category = category.trim();
            if ($scope.newsletter.categories.indexOf(category) === -1) {
              $scope.newsletter.categories.push(category);
              $scope.dirty = true;
            }
          });
          $scope.newCategory = '';
        }
      }
    };


    $scope.removeCategory = function (categoryIndex) {
      $scope.newsletter.categories.splice(categoryIndex, 1);
      $scope.dirty = true;
    };


    $scope.saveNewsletter = function () {
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
