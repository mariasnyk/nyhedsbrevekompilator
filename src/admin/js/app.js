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


app.controller('NewsletterController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', 'notifications',
  function ($scope, $routeParams, $location, $resource, $sce, $http, notifications) {

    $scope.edit = $routeParams.operator === 'edit';
    console.log('$scope.edit', $scope.edit);

    var Newsletters = $resource('/newsletters/:name', { name: '@name' });
    var Identities = $resource('/newsletters/identities');
    var Lists = $resource('/newsletters/lists');
    var Templates = $resource('/templates/');

    // $scope.newsletter = Newsletters.get({name: $routeParams.name}, function () {
    //   console.log('$scope.newsletter', $scope.newsletter);
    // });

    if ($scope.edit) {
      
      $scope.identities = Identities.query(function (){console.log('identities')});
      $scope.lists = Lists.query(function (){console.log('lists')});
      $scope.html_templates = Templates.query({filter:'.html'}, function (){console.log('html_templates')});
      $scope.plain_templates = Templates.query({filter:'.plain'}, function (){console.log('plain_templates')});

      $scope.$watch('identities', function () {
        console.log ($scope.identities.length, $scope.lists.length, $scope.html_templates.length, $scope.plain_templates.length );
        if ($scope.identities.length > 0 && $scope.lists.length > 0 && $scope.html_templates.length > 0 && $scope.plain_templates.length > 0) {
          $scope.newsletter = Newsletters.get({name: $routeParams.name}, function (){console.log('newsletter')});
        }
      });

      $scope.$watch('lists', function () {
        console.log ($scope.identities.length, $scope.lists.length, $scope.html_templates.length, $scope.plain_templates.length );
        if ($scope.identities.length > 0 && $scope.lists.length > 0 && $scope.html_templates.length > 0 && $scope.plain_templates.length > 0) {
          $scope.newsletter = Newsletters.get({name: $routeParams.name}, function (){console.log('newsletter')});
        }
      });

      $scope.$watch('html_templates', function () {
        console.log ($scope.identities.length, $scope.lists.length, $scope.html_templates.length, $scope.plain_templates.length );
        if ($scope.identities.length > 0 && $scope.lists.length > 0 && $scope.html_templates.length > 0 && $scope.plain_templates.length > 0) {
          $scope.newsletter = Newsletters.get({name: $routeParams.name}, function (){console.log('newsletter')});
        }
      });

      $scope.$watch('plain_templates', function () {
        console.log ($scope.identities.length, $scope.lists.length, $scope.html_templates.length, $scope.plain_templates.length );
        if ($scope.identities.length > 0 && $scope.lists.length > 0 && $scope.html_templates.length > 0 && $scope.plain_templates.length > 0) {
          $scope.newsletter = Newsletters.get({name: $routeParams.name}, function (){console.log('newsletter')});
        }
      });
    } else {
      $scope.newsletter = Newsletters.get({name: $routeParams.name});
    }


    // $scope.$watch('bond_type', function (bond_type) {
    //   $scope.updatePreview();
    // });

    // Todo: 
    $scope.at = new Date();

    // $scope.$watch('bond_type', function (bond_type) {
    //   $scope.updatePreview();
    // });

    // $scope.$watch('bond_id', function (bond_id) {
    //   $scope.updatePreview();
    // });

    // $scope.$watch('template_html', function (template_html) {
    //   $scope.updateHtmlPreview();
    // });

    // $scope.$watch('template_plain', function (template_plain) {
    //   $scope.updatePlainPreview();
    // });

    $scope.addCategory = function (clickEvent) {
      if ($scope.newsletter.categories == undefined) {
        $scope.newsletter.categories = [];
      }

      if (clickEvent.keyCode === 13) {
        // TODO: Split on comma, remove whitespace etc.
        if ($scope.newCategory !== '') {
          $scope.newsletter.categories.push($scope.newCategory);
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
      console.log('UPDATING');
      if ($scope.newsletter.bond_type === undefined ||
          $scope.newsletter.bond_id === undefined) {
        console.log('UPDATING');
        return;
      }

      $scope.previewError = false;

      $scope.updateSubjectPreview();
      $scope.updateHtmlPreview();
      $scope.updatePlainPreview();
    };

    $scope.updateSubjectPreview = function () {
      // Getting the subject suggestion
      $http({method: 'OPTIONS', url: '/templates?' + $scope.newsletter.bond_type + "=" + $scope.newsletter.bond_id})
      .success(function (data, status, getHeaders) {
        var headers = getHeaders();
        $scope.newsletter.subject = decodeURIComponent(headers['x-subject-suggestion']);
        $scope.previewError = false;
      }).error(function (data, status) {
        console.log('Error when heading for subject suggestion', data, status);
        $scope.previewError = true;
        $scope.subject = null;
      });
    };

    $scope.updateHtmlPreview = function () {
      if ($scope.newsletter.template_html === undefined) {
        return;
      }

      $http.get($scope.newsletter.template_html.uri + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id)
      .success(function (data) {
        $scope.newsletter.email_html = data;
      });
    };

    $scope.updatePlainPreview = function () {
      if ($scope.newsletter.template_plain === undefined) {
        return;
      }

      $http.get($scope.newsletter.template_plain.uri + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id)
      .success(function (data) {
        $scope.newsletter.email_plain = data;
      });
    };

    $scope.sendNewsletter = function (draft) {

      console.log($scope.newsletter);
      return;

      if (draft !== undefined) {
        $scope.draft = draft
      }

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
