//(function(window, angular, undefined) {'use strict';

var app = angular.module('userdb', ['ngRoute', 'ngSanitize', 'ngResource', 'ngCookies', 'ui.bootstrap', 'ngNotificationsBar']);

app.config(['$routeProvider', function ($routeProvider) {

  $routeProvider
    .when( '/', {
      redirectTo: '/' })
    .when( '/', {
      templateUrl: 'newsletter-dashboard.html',
      controller: 'DashboardController' })
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


app.controller('DashboardController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', 'notifications',
  function ($scope, $routeParams, $location, $resource, $sce, $http, notifications) {

    var Newsletters = $resource('/newsletters/:name', { name: '@name' });
    $scope.newsletters = Newsletters.query();

    $scope.createNewsletter = function (name) {
      Newsletters.save({ name: name }, function () {
        $scope.name = '';
        $scope.newsletters = Newsletters.query();
      });
    };

    $scope.deleteNewsletter = function (name) {
      Newsletters.delete({ name: name }, function () {
        $scope.newsletters = Newsletters.query();
      });
    };

    $scope.addCategory = function (clickEvent, name) {
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
    var Lists = $resource('/newsletters/lists');
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
        $scope.identities = [$scope.newsletter.identity];
        $scope.lists = [$scope.newsletter.list];
        $scope.html_templates = [$scope.newsletter.template_html];
        $scope.plain_templates = [$scope.newsletter.template_plain];
        updatePreview();
        updateControlroomIframe();
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
      }).error(function (data, status) {
        console.log('Error saving template.', data, status);
      });
    };


    $scope.updatePreviewClickEvent = function () {
      updatePreview();
    };


    function updatePreview () {
      if ($scope.newsletter.bond_type === undefined ||
          $scope.newsletter.bond_id === undefined) {
        return;
      }

      console.log('Updating previews...');
      $scope.loading_previews = true;

      var a = updateHtmlPreview();
      var b = updatePlainPreview();

      $q.all([a,b]).then(function (result) {
        $scope.loading_previews = false;
        console.log('Updating previews done.');
      },function (reason) {
        $scope.loading_previews = false;
        console.log('====Updating previews done.', reason);
      });
    }


    function updateHtmlPreview () {
      if ($scope.newsletter.template_html === undefined) {
        return;
      }

      console.log('Updating html preview...');
      $scope.loading_html_preview = true;

      return $http.get('/templates/' + $scope.newsletter.template_html + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id)
      .success(function (data, status, getHeaders) {
        var headers = getHeaders();
        $scope.newsletter.subject = decodeURIComponent(headers['x-subject-suggestion']);
        $scope.newsletter.checksum = headers['x-content-checksum'];
        $scope.newsletter.email_html = data;
        $scope.trusted_html_email_preview = $sce.trustAsHtml(data);
        console.log('Updating html preview done.');
        $scope.loading_html_preview = false;
      })
      .error(function (data, status, headers, config) {
        console.log('Updating html preview error.', data);
        $scope.loading_html_preview = false;
      });
    };


    function updatePlainPreview () {
      if ($scope.newsletter.template_plain === undefined) {
        return;
      }

      console.log('Updating text preview...');
      $scope.loading_plain_preview = true;

      return $http.get('/templates/' + $scope.newsletter.template_plain + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id)
      .success(function (data) {
        $scope.newsletter.email_plain = data;
        console.log('Updating text preview done.');
        $scope.loading_plain_preview = false;
      })
      .error(function (data, status, headers, config) {
        console.log('Updating plain preview error.', data);
        $scope.loading_plain_preview = false;
      });
    };


    $scope.sendNewsletter = function () {

      if($scope.at > Date.now()) {
        $scope.newsletter.at = $scope.at;
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
      if ($scope.newsletter.bond_type === undefined ||
          $scope.newsletter.bond_id === undefined) {
        return;
      }

      $http.get('/templates/controlroom?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id)
      .success(function (data) {
        $scope.controlroom_url = $sce.trustAsResourceUrl(data.url);
      });
    }
  }]);
