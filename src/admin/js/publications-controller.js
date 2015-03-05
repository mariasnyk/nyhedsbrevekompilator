app.controller('PublicationsController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, notifications, loadingSwitch) {
    var Newsletters = $resource('/newsletters/emails/:name', { name: '@name' });
    var Schedules = $resource('/newsletters/emails/schedule/:name', { name: '@name' });

    $scope.newsletters = Newsletters.query(function () {
      // Sorting by id for chronically order
      $scope.newsletters.sort(compare);

      // Getting details for the first ten newsletters
      for (var i = 0; i < 10; i++) {
        //$scope.getNewsletterData($scope.newsletters[i].name, i);
      }
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
      $scope.newsletter = Newsletters.get({ name: name }, function (data) {
        $scope.newsletters[index].subject = data.subject;
        $scope.newsletters[index].identity = data.identity;
        $scope.newsletters[index].total_recipients = data.total_recipients;
        $scope.newsletters[index].date_schedule = data.date_schedule;

        if (data.date_schedule != null) {
          var schedule = Schedules.get({ name: name }, function () {
            if (schedule.date) {
              $scope.newsletters[index].schedule = schedule.date;
            }
          });

          loadingSwitch.watch(schedule);
        }

      }, function (err) {
        notifications.showError(err);
      });

      loadingSwitch.watch($scope.newsletter);
    };

    $scope.deleteSchedule = function (name, index) {
      var deleting = Schedules.delete({ name: name }, function () {
        $scope.newsletters[index].schedule = null;
      }, function (error) {
        console.log('Error', error);
        notifications.showError(error.data.error);
      });

      loadingSwitch.watch(deleting, 'Deleting');
    };

  }]);
