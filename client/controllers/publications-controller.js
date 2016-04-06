app.controller('PublicationsController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, notifications, loadingSwitch) {
    var Emails = $resource('/newsletters/emails/:name', { name: '@name' });
    var Schedules = $resource('/newsletters/emails/schedule/:name', { name: '@name' });

    var page_size = 30;

    var all_emails = Emails.query(function () {

      // Sorting by id for chronically order
      all_emails.sort(compare);

      $scope.page_count = new Array(Math.floor(all_emails.length / page_size) + 1);

      paginateEmails();

      // Getting details for the first x emails
      for (var i = 0; i < 3; i++) {
        if ($scope.emails[i]) {
          $scope.getEmailData($scope.emails[i]);
        }
      }
    });

    loadingSwitch.watch(all_emails);

    function compare(a,b) {
      if (a.newsletter_id < b.newsletter_id)
         return 1;
      if (a.newsletter_id > b.newsletter_id)
        return -1;
      return 0;
    }

    function paginateEmails (page_index) {
      if (page_index === undefined) {
        page_index = 0;
      }

      var page_start = page_index * page_size;
      var page_end = page_start + page_size;
      $scope.emails = all_emails.slice(page_start, page_end);

      // Just a simple way to display page count on the navigator
      $scope.page_index = page_index + 1;
    }
    $scope.paginateEmails = paginateEmails;

    $scope.searchEmails = function (clickEvent) {
      if ($scope.emailFilter === '') {
        $scope.searchEnabled = false;
        paginateEmails();
      } else if (clickEvent.keyCode === 13) {
        $scope.searchEnabled = true;
        $scope.emails = all_emails.filter(function (email) {
          return email.name.toLowerCase().indexOf($scope.emailFilter.toLowerCase()) > -1;
        });
      }
    };

    $scope.getEmailData = function (email) {
      $scope.email = Emails.get({ name: email.name }, function (data) {

        var index = $scope.emails.indexOf(email);

        $scope.emails[index].subject = data.subject;
        $scope.emails[index].identity = data.identity;
        $scope.emails[index].total_recipients = data.total_recipients;
        $scope.emails[index].html = data.html;

        if (data.date_schedule !== null) {
          // data_schedule from SendGrid is Pacific Time Zone / Pacific Standard Time (PST)
          var date_schedule;
          if (moment(data.date_schedule).isDST()) {
            date_schedule = moment.utc(data.date_schedule + '-07:00');
          } else {
            date_schedule = moment.utc(data.date_schedule + '-08:00');
          }
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
