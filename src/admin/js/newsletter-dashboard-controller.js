app.controller('NewsletterDashboardController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, notifications, loadingSwitch) {

    loadingSwitch.turnOn();
    //var Newsletters = $resource('/newsletters/:name', { name: '@name' });
    var Newsletters = $resource('/newsletters/');
    $scope.newsletters = Newsletters.query(function () {
      loadingSwitch.turnOff();
    });

    $scope.createNewsletter = function (name) {
      Newsletters.save({ name: name }, function () {
        $location.url('/' + name + '/edit' );
      }, function (error) {
        console.log('Create newsletter error:', error)
        if (error.data.message) {
          notifications.showError(error.data.message);  
        } else {
          notifications.showError(error.statusText !== undefined ? error.statusText : 'Unknown error' );
        }
      });
    };

    $scope.createNewsletterKeyUp = function (clickEvent, name) {
      if (clickEvent.keyCode === 13) {
        $scope.createNewsletter(name);
      }
    };

  }]);
