

var app = angular.module('nyhedsbrevekompilator', ['ngRoute', 'ngSanitize', 'ngResource', 'ngCookies', 'ngNotificationsBar', 'toColorFilter', 'ui.bootstrap.datetimepicker']);

app.config(['$routeProvider', function ($routeProvider) {
  'use strict';

  $routeProvider
    .when( '/', {
      redirectTo: '/' })
    .when( '/', {
      page_title: 'Nyhedsbreve',
      templateUrl: 'partials/newsletter-dashboard.html',
      controller: 'NewsletterDashboardController' })
    .when( '/udsendelser', {
      page_title: 'Udsendte nyhedsbreve',
      templateUrl: 'partials/publications.html',
      controller: 'PublicationsController' })
    .when( '/stats', {
      page_title: 'Statistiker',
      templateUrl: 'partials/stats.html',
      controller: 'StatsController' })
    .when( '/:ident', {
      templateUrl: 'partials/newsletter-sender.html',
      controller: 'NewsletterSenderController' })
    .when( '/:ident/edit', {
      templateUrl: 'partials/newsletter-editor.html',
      controller: 'NewsletterEditorController' })
    .otherwise({
      redirectTo: '/' });
}]);

app.config(['$resourceProvider', function ($resourceProvider) {
  // Don't strip trailing slashes from calculated URLs
  //$resourceProvider.defaults.stripTrailingSlashes = false;
}]);


app.factory('loadingSwitch', ['$rootScope', function($rootScope) {
  'use strict';

  var watchers = 0;

  return {
    watch: function (request, label) {
      // Finding the promise
      var promise = request.$$state !== undefined ? request :
          request.$promise !== undefined ? request.$promise :
           null;

      if (promise !== null) {
        if (++watchers === 1) {
          $rootScope.$broadcast('loadingIndicator:turnOn', label);
        }
        promise.finally(function () {
          if (--watchers === 0) {
            $rootScope.$broadcast('loadingIndicator:turnOff');
          }
        });
      }
    }
  };
}]);

app.directive('loadingIndicator', ['$interval', function ($interval) {
  'use strict';

  return {
    restrict: 'EA',
    template: '<img src="img/jellyfish.gif" ng-show="loading" style="position: absolute; top: 0px; right: 0px;">',
    link: function ($scope, element, attrs) {

      var dots = 0,
          showLoadingIndicators = 0,
          interval;

      $scope.$on('loadingIndicator:turnOn', function (event, label) {

        $scope.label = label !== undefined ? label : 'Loading';

        interval = $interval(function () {
          switch (++dots % 4) {
            case 0: $scope.dots = '.'; break;
            case 1: $scope.dots = '..'; break;
            case 2: $scope.dots = '...'; break;
            case 3: $scope.dots = '....'; break;
          }
        }, 700);

        $scope.loading = true;
      });

      $scope.$on('loadingIndicator:turnOff', function (event, id) {
        $scope.loading = false;
        dots = 0;
        $interval.cancel(interval);
      });
    }
  };
}]);

app.run(['$location', '$rootScope', function($location, $rootScope) {
  $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
    $rootScope.page_title = current.$$route.page_title !== undefined
      ? current.$$route.page_title
      : current.params.ident;
  });
}]);

moment.locale('da');
