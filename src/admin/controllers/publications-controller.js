app.controller('PublicationsController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, notifications, loadingSwitch) {
    var Newsletters = $resource('/newsletters/emails/:name', { name: '@name' });
    var Schedules = $resource('/newsletters/emails/schedule/:name', { name: '@name' });

    $scope.newsletters = Newsletters.query(function () {
      // Sorting by id for chronically order
      $scope.newsletters.sort(compare);

      // Getting details for the first x newsletters
      for (var i = 0; i < 3; i++) {
        if ($scope.newsletters[i]) {
          $scope.getNewsletterData($scope.newsletters[i].name, i);
        }
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

        if (data.date_schedule !== null) {
          var date_schedule = moment(data.date_schedule + '-07:00');

          if (moment.utc().diff(date_schedule) < 0 ) {
            $scope.newsletters[index].schedule = date_schedule.format('dddd D-MM HH:mm');
            $scope.newsletters[index].fromnow = moment(date_schedule).fromNow();

            // var schedule = Schedules.get({ name: name }, function () {
            //   if (schedule.date) {
            //     console.log(moment.utc(schedule.date));
            //     $scope.newsletters[index].schedule = schedule.date;
            //     $scope.newsletters[index].fromnow = moment(schedule.date).fromNow();
            //   }
            // });

            // loadingSwitch.watch(schedule);
          }

        }

      }, function (err) {
        notifications.showError(err);
      });

      loadingSwitch.watch($scope.newsletter);
    };

    $scope.deleteSchedule = function (name, index) {
      var deleting = Schedules.delete({ name: name }, function () {
        $scope.newsletters[index].schedule = null;
        $scope.newsletters[index].fromnow = null;
      }, function (error) {
        console.log('Error', error);
        notifications.showError(error.data.error);
      });

      loadingSwitch.watch(deleting, 'Deleting');
    };

  }]);
