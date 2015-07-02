app.controller('PublicationsController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, notifications, loadingSwitch) {
    var Emails = $resource('/newsletters/emails/:name', { name: '@name' });
    var Schedules = $resource('/newsletters/emails/schedule/:name', { name: '@name' });

    $scope.emails = Emails.query(function () {

      // Sorting by id for chronically order
      $scope.emails.sort(compare);

      // Getting details for the first x emails
      for (var i = 0; i < 3; i++) {
        if ($scope.emails[i]) {
          $scope.getEmailData($scope.emails[i]);
        }
      }
    });

    loadingSwitch.watch($scope.emails);

    function compare(a,b) {
      if (a.newsletter_id < b.newsletter_id)
         return 1;
      if (a.newsletter_id > b.newsletter_id)
        return -1;
      return 0;
    }

    $scope.getEmailData = function (email) {
      $scope.email = Emails.get({ name: email.name }, function (data) {

        var index = $scope.emails.indexOf(email);

        $scope.emails[index].subject = data.subject;
        $scope.emails[index].identity = data.identity;
        $scope.emails[index].total_recipients = data.total_recipients;

        if (data.date_schedule !== null) {
          var date_schedule = moment(data.date_schedule + '-07:00');

          $scope.emails[index].schedule = date_schedule.format('ddd D/M HH:mm');
          $scope.emails[index].fromnow = moment(date_schedule).fromNow();

          if (moment.utc().diff(date_schedule) < 0 ) {
            $scope.emails[index].scheduled = true;
          }

        }

      }, function (err) {
        notifications.showError(err);
      });

      loadingSwitch.watch($scope.email);
    };

    $scope.deleteSchedule = function (email) {
      var deleting = Schedules.delete({ name: email.name }, function () {

        var index = $scope.emails.indexOf(email);

        $scope.emails[index].schedule = null;
        $scope.emails[index].fromnow = null;
      }, function (error) {
        console.log('Error', error);
        notifications.showError(error.data.error);
      });

      loadingSwitch.watch(deleting, 'Deleting');
    };

  }]);
