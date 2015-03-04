app.controller('PublicationsController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, notifications, loadingSwitch) {
    var Newsletters = $resource('/newsletters/emails/:name', { name: '@name' });
    $scope.newsletters = Newsletters.query(function () {
      // Sorting by id for chronically order
      $scope.newsletters.sort(compare);
    });

    loadingSwitch.watch($scope.newsletters);

    function compare(a,b) {
      if (a.newsletter_id < b.newsletter_id)
         return 1;
      if (a.newsletter_id > b.newsletter_id)
        return -1;
      return 0;
    }

    $scope.getNewsletterData = function (name, index) {
      $scope.newsletter = Newsletters.get({name: name}, function (data) {
        $scope.newsletters[index].subject = data.subject;
        $scope.newsletters[index].identity = data.identity;
        $scope.newsletters[index].total_recipients = data.total_recipients;
        $scope.newsletters[index].date_schedule = data.date_schedule;
      }, function (err) {
        notifications.showError(err);
      });
      loadingSwitch.watch($scope.newsletter);
    };
  }]);