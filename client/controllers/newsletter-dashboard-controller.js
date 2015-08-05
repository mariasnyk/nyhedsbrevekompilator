app.controller('NewsletterDashboardController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, notifications, loadingSwitch) {

    //var Newsletters = $resource('/newsletters/:name', { name: '@name' });
    var Newsletters = $resource('/newsletters/');
    $scope.newsletters = Newsletters.query();

    loadingSwitch.watch($scope.newsletters);

    $scope.createNewsletter = function (name) {

      if (name === undefined || name === null || name === '') {
        return notifications.showError('Indtast navn');
      }

      var saving = Newsletters.save({ name: name }, function (result) {
        $location.url('/' + result.ident + '/edit' );
      }, function (error) {
        console.log('Create newsletter error:', error);
        if (error.data.message) {
          notifications.showError(error.data.message);
        } else {
          notifications.showError(error.statusText !== undefined ? error.statusText : 'Unknown error' );
        }
      });

      loadingSwitch.watch(saving);
    };

    $scope.createNewsletterKeyUp = function (clickEvent, name) {
      if (clickEvent.keyCode === 13) {
        $scope.createNewsletter(name);
      }
    };

  }]);
