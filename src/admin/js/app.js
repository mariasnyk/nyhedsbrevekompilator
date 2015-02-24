//(function(window, angular, undefined) {'use strict';

var app = angular.module('userdb', ['ngRoute', 'ngSanitize', 'ngResource', 'ngCookies', 'ngNotificationsBar']);

app.config(['$routeProvider', function ($routeProvider) {

  $routeProvider
    .when( '/', {
      redirectTo: '/' })
    .when( '/', {
      templateUrl: 'newsletter-dashboard.html',
      controller: 'DashboardController' })
    .when( '/emails', {
      templateUrl: 'emails.html',
      controller: 'EmailsController' })
    .when( '/stats', {
      templateUrl: 'stats.html',
      controller: 'StatsController' })
    .when( '/:name', {
      templateUrl: 'newsletter-editor.html',
      controller: 'NewsletterController' })
    .when( '/:name/:operator', {
      templateUrl: 'newsletter-editor.html',
      controller: 'NewsletterController' })
    .otherwise({
      redirectTo: '/' });
}]);

app.config(['$resourceProvider',
  function ($resourceProvider) {
    // Don't strip trailing slashes from calculated URLs
    //$resourceProvider.defaults.stripTrailingSlashes = false;
  }]);


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


app.controller('NewsletterController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', '$q', 'notifications',
  function ($scope, $routeParams, $location, $resource, $sce, $http, $q, notifications) {

    // Defaulting the schedule with an added 15 minuttes
    $scope.at = new Date(new Date().getTime() + 15*60000);

    var Newsletters = $resource('/newsletters/:name', { name: '@name' });
    var Identities = $resource('/newsletters/identities');
    var Lists = $resource('/newsletters/lists/:list', { list: '@list' });
    var Templates = $resource('/templates/:name', { name: '@name' });

    $scope.edit = $routeParams.operator === 'edit';

    if ($scope.edit) {
      
      $scope.identities = Identities.query();
      $scope.lists = Lists.query();
      $scope.html_templates = Templates.query({filter:'.html'});
      $scope.plain_templates = Templates.query({filter:'.plain'});

      // Waiting for the drop-down data to be fetched before we query the newsletter.
      // This is done so that drop-downs are populated and the equivalent newsletter value is selected in the drop-down.
      $q.all([$scope.identities.$promise, $scope.lists.$promise, $scope.html_templates.$promise, $scope.plain_templates.$promise]).then(function () {
        $scope.newsletter = Newsletters.get({ name: $routeParams.name }, null, resourceErrorHandler);
      });

    } else {

      // If we're not editing the newsletter, we don't need to fetch the dop-down data from e.g. SendGrid
      $scope.newsletter = Newsletters.get({name: $routeParams.name}, function () {
        // Populating the drop downs so newsletter values are visible
        $scope.html_templates = [$scope.newsletter.template_html];
        $scope.plain_templates = [$scope.newsletter.template_plain];
        $scope.identities = [$scope.newsletter.identity];
        $scope.lists = [$scope.newsletter.list];

        // Validating the list still exists in SendGrid
        Lists.query({ list: $scope.newsletter.list}, function (response) {
          if (response[0] === undefined || response[0].list !== $scope.newsletter.list) {
            console.log('Couldn\'t find list ' + $scope.newsletter.list + ' in SendGrid.')
            $scope.lists = ['ERROR'];
          }
        }, resourceErrorHandler);

        updatePreview();
        //updateControlroomIframe();
      }, resourceErrorHandler);
    }


    function resourceErrorHandler (response) {
      console.log('Error fetching ' + $routeParams.name, response);
      if (response.status === 404) {
        $location.url('/');
      }
    }


    $scope.addCategory = function (clickEvent) {
      if ($scope.newsletter.categories == undefined) {
        $scope.newsletter.categories = [];
      }

      if (clickEvent.keyCode === 13) {
        if ($scope.newCategory !== '') {
          $scope.newCategory.split(',').forEach( function (category) {
            category = category.trim();
            if ($scope.newsletter.categories.indexOf(category) === -1 && category !== $scope.newsletter.name) {
              $scope.newsletter.categories.push(category);
            }
          });
          $scope.newCategory = '';
        }
      }
    };


    $scope.removeCategory = function (categoryIndex) {
      $scope.newsletter.categories.splice(categoryIndex, 1);
    };


    $scope.saveNewsletter = function () {
      $http.post('/newsletters', $scope.newsletter)
      .success(function () {
        console.log('Success saving template.');
        $location.url('/' + $scope.newsletter.name );
      }).error(function (data, status) {
        console.log('Error saving template.', data, status);
      });
    };

    $scope.deleteNewsletter = function () {
      Newsletters.delete({ name: $scope.newsletter.name }, function () {
        $location.url('/');
      });
    };

    $scope.updatePreviewClickEvent = function () {
      updatePreview();
    };


    function updatePreview () {
      if ($scope.newsletter.bond_url === undefined) {
        return;
      }

      $scope.loading_previews = true;

      var a = updateHtmlPreview();
      var b = updatePlainPreview();

      $q.all([a,b]).then(function (result) {
        $scope.loading_previews = false;
      },function (reason) {
        $scope.loading_previews = false;
      });
    }


    function updateHtmlPreview () {
      if ($scope.newsletter.template_html === undefined) {
        return;
      }

      $scope.loading_html_preview = true;

      return $http.get('/templates/' + $scope.newsletter.template_html + '?u=' + encodeURIComponent($scope.newsletter.bond_url))
      .success(function (data, status, getHeaders) {
        var headers = getHeaders();
        $scope.newsletter.subject = decodeURIComponent(headers['x-subject-suggestion']);
        $scope.newsletter.checksum = headers['x-content-checksum'];
        $scope.controlroom_url = $sce.trustAsUrl(decodeURIComponent(headers['x-controlroom-url']));
        $scope.newsletter.email_html = data;
        $scope.trusted_html_email_preview = $sce.trustAsHtml(data);
        $scope.loading_html_preview = false;
      })
      .error(function (data, status, headers, config) {
        $scope.loading_html_preview = false;
        $scope.newsletter.email_html = '';
        $scope.trusted_html_email_preview = '<p>Error</p>';
      });
    };


    function updatePlainPreview () {
      if ($scope.newsletter.template_plain === undefined) {
        return;
      }

      $scope.loading_plain_preview = true;

      return $http.get('/templates/' + $scope.newsletter.template_plain + '?u=' + encodeURIComponent($scope.newsletter.bond_url))
      .success(function (data) {
        $scope.newsletter.email_plain = data;
        $scope.loading_plain_preview = false;
      })
      .error(function (data, status, headers, config) {
        $scope.loading_plain_preview = false;
      });
    };


    $scope.sendNewsletter = function () {
      if($scope.at > Date.now()) {
        $scope.newsletter.at = $scope.at.toISOString();
        console.log('Scheduled to', $scope.newsletter.at);
      } else {
        console.log('Sending straight away');
      }

      $http.post('/newsletters/send', $scope.newsletter)
      .success(function (data) {
        notifications.showSuccess('Sendt ' + data.name);
      })
      .error(function (data, status) {
        console.log('Error', status, data);
        notifications.showError('Error: ' + data.message);
      });
    };


    $scope.draftNewsletter = function () {

      $http.post('/newsletters/draft', $scope.newsletter)
      .success(function (data) {
        notifications.showSuccess('Kladde oprettet ' + data.name);
      })
      .error(function (data, status) {
        console.log('Error', status, data);
      });
    };


    function updateControlroomIframe () {
      if ($scope.newsletter.bond_url === undefined) {
        return;
      }

      $http.get('/templates/controlroom?u=' + encodeURIComponent($scope.newsletter.bond_url))
      .success(function (data) {
        $scope.controlroom_url = $sce.trustAsResourceUrl(data.url);
      });
    }
  }]);


app.controller('EmailsController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http',
  function ($scope, $routeParams, $location, $resource, $sce, $http) {
    var Newsletters = $resource('/newsletters/emails/:name', { name: '@name' });
    $scope.newsletters = Newsletters.query(function () {
      // Sorting by id for chronically order
      $scope.newsletters.sort(compare);
    });

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
      });
    };
  }]);


app.controller('StatsController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', '$filter',
  function ($scope, $routeParams, $location, $resource, $sce, $http, $filter) {
    var Categories = $resource('/newsletters/categories');
    var Stats = $resource('/newsletters/categories/stats');

    $scope.start_date = new Date(Date.now() - 604800000); // 7 days = 1000 * 60 * 60 * 24 * 7  (milliseconds * seconds * minutes * hours * days)
    $scope.end_date = new Date();

    $scope.stats_parameters = {
      aggregated_by: "month", //day|week|month
      categories: []
    }

    $scope.categories = Categories.query();

    $scope.getData = function () {
      if ($scope.stats_parameters.categories.length === 0) {
        return;
      }

      $scope.stats_parameters.start_date = $filter('date')($scope.start_date, "yyyy-MM-dd");
      $scope.stats_parameters.end_date = $filter('date')($scope.end_date, "yyyy-MM-dd");

      console.log($scope.stats_parameters);
      $scope.statsData = [];

      Stats.query($scope.stats_parameters,
      function (data) {
        console.log('data', data);
        data.forEach(function (value) {
          value.stats.forEach(function (stat) {
            $scope.statsData.push({
              date: value.date,
              name: stat.name,
              type: stat.type,
              metrics: stat.metrics
            });
          });
        });
        console.log($scope.statsData);
      },
      function (err) {
        console.log('err', err);
      });
    };
  }]);
