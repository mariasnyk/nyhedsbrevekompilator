app.controller('DashboardController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http',
  function ($scope, $routeParams, $location, $resource, $sce, $http) {

    var Newsletters = $resource('/newsletters/:name', { name: '@name' });
    $scope.newsletters = Newsletters.query();

    $scope.createNewsletter = function (name) {
      Newsletters.save({ name: name }, function () {
        $scope.name = '';
        $scope.newsletters = Newsletters.query();
      });
    };

    $scope.createNewsletterKeyUp = function (clickEvent, name) {
      if (clickEvent.keyCode === 13) {
        $scope.createNewsletter(name);
      }
    };

  }]);
