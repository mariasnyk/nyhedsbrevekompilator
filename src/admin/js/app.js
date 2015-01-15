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

    $scope.edit = $routeParams.operator === 'edit';

    $scope.at = new Date();

    var Newsletters = $resource('/newsletters/:name', { name: '@name' });
    var Identities = $resource('/newsletters/identities');
    var Lists = $resource('/newsletters/lists');
    var Templates = $resource('/templates/');

    if ($scope.edit) {
      
      $scope.identities = Identities.query();
      $scope.lists = Lists.query();
      $scope.html_templates = Templates.query({filter:'.html'});
      $scope.plain_templates = Templates.query({filter:'.plain'});

      // Waiting for the drop-down data to be fetched before we query the newsletter.
      // This is done so that drop-downs are populated and the equivalent newsletter value is selected in the drop-down.
      $q.all([$scope.identities.$promise, $scope.lists.$promise, $scope.html_templates.$promise, $scope.plain_templates.$promise]).then(function () {
        $scope.newsletter = Newsletters.get({name: $routeParams.name}, function () {

          // Pre-selecting the templates ind the drop downs.
          // This has be done by direct assignment because Angular won't automatically match the Objects - like it's able to do on String e.g. identity.
          $scope.newsletter.template_plain = $scope.plain_templates.filter(function (template) {
            return template.name === $scope.newsletter.template_plain.name;
          })[0];

          $scope.newsletter.template_html = $scope.html_templates.filter(function (template) {
            return template.name === $scope.newsletter.template_html.name;
          })[0];
        });
      });


    } else {

      // If we're not editing the newsletter, we don't need to fetch the dop-down data from e.g. SendGrid
      $scope.newsletter = Newsletters.get({name: $routeParams.name}, function () {
        // Populating the drop downs so newsletter values are visible
        $scope.identities = [$scope.newsletter.identity];
        $scope.lists = [$scope.newsletter.list];
        $scope.html_templates = [$scope.newsletter.template_html];
        $scope.plain_templates = [$scope.newsletter.template_plain];
        $scope.updatePreview();
      });
    }

    // Todo: 
    //$scope.at = new Date();

    $scope.addCategory = function (clickEvent) {
      if ($scope.newsletter.categories == undefined) {
        $scope.newsletter.categories = [];
      }

      if (clickEvent.keyCode === 13) {
        if ($scope.newCategory !== '') {
          $scope.newCategory.split(',').forEach( function (category) {
            category = category.trim();
            if ($scope.newsletter.categories.indexOf(category) === -1) {
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

    $scope.updatePreview = function () {
      if ($scope.newsletter.bond_type === undefined ||
          $scope.newsletter.bond_id === undefined) {
        return;
      }

      updateSubjectPreview();
      updateHtmlPreview();
      updatePlainPreview();
    };

    function updateSubjectPreview () {
      console.log("Update subject preview.");
      // Getting the subject suggestion
      $http({method: 'OPTIONS', url: '/templates?' + $scope.newsletter.bond_type + "=" + $scope.newsletter.bond_id})
      .success(function (data, status, getHeaders) {
        var headers = getHeaders();
        $scope.newsletter.subject = decodeURIComponent(headers['x-subject-suggestion']);
        console.log("Update subject preview done.");
      }).error(function (data, status) {
        console.log('Error when heading for subject suggestion', data, status);
        $scope.subject = null;
      });
    };

    function updateHtmlPreview () {
      if ($scope.newsletter.template_html === undefined) {
        return;
      }

      console.log("Update html preview.");

      $http.get($scope.newsletter.template_html.uri + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id)
      .success(function (data) {
        $scope.newsletter.email_html = data;
        console.log("Update html preview done.");
      });
    };

    function updatePlainPreview () {
      if ($scope.newsletter.template_plain === undefined) {
        return;
      }

      console.log("Update text preview.");

      $http.get($scope.newsletter.template_plain.uri + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id)
      .success(function (data) {
        $scope.newsletter.email_plain = data;
        console.log("Update text preview done.");
      });
    };

    $scope.sendNewsletter = function (draft) {

      console.log($scope.newsletter);
      console.log($scope.at);
      $scope.draft = draft === true;
      console.log($scope.draft);
      return;

      // if (draft !== undefined) {
      //   $scope.draft = draft
      // }

      // TODO:
      // $http.post('/newsletters/send', data)
      // .success(function (data) {
      //   if (draft)
      //     notifications.showSuccess('Kladde oprettet ' + data.name);
      //   else
      //     notifications.showSuccess('Sendt ' + data.name);
      // })
      // .error(function (data, status) {
      //   console.log('Error', status, data);
      // });
    };
  }]);
