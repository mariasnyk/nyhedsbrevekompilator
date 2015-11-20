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
        $scope.emails[index].html = data.html;

        if (data.date_schedule !== null) {
          var date_schedule = moment.utc(data.date_schedule + '-08:00');
          date_schedule.local();

          $scope.emails[index].schedule = date_schedule.format('ddd D/M HH:mm');
          $scope.emails[index].fromnow = date_schedule.fromNow();

          if (data.can_edit === true) {
            $scope.emails[index].scheduled = true;
          }
        } else {
          if (data.can_edit === true) {
            $scope.emails[index].draft = true;
          } else {
            $scope.emails[index].unknown_schedule = true;
          }
        }

      }, function (err) {
        notifications.showError(err);
      });

      loadingSwitch.watch($scope.email);
    };

    $scope.showEmailHtml = function (html) {
      var preview = window.open();
      preview.document.open();
      preview.document.write(html);
      preview.document.close();
    };

    $scope.deleteSchedule = function (email) {
      var deleting = Schedules.delete({ name: email.name }, function () {

        var index = $scope.emails.indexOf(email);

        $scope.emails[index].schedule = null;
        $scope.emails[index].fromnow = null;
        $scope.emails[index].draft = true;
        $scope.emails[index].scheduled = false;

      }, function (error) {
        console.log('Error', error);
        notifications.showError(error.data.error);
      });

      loadingSwitch.watch(deleting, 'Deleting');
    };

    $scope.deleteEmail = function (email) {
      var deleting = Emails.delete({ name: email.name }, function () {

        var index = $scope.emails.indexOf(email);
        $scope.emails.splice(index, 1);

        $scope.emails[index].schedule = null;

      }, function (error) {
        console.log('Error', error);
        notifications.showError(error.data.error);
      });

      loadingSwitch.watch(deleting, 'Deleting');
    };

  }]);
