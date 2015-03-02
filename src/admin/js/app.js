//(function(window, angular, undefined) {'use strict';

var app = angular.module('userdb', ['ngRoute', 'ngSanitize', 'ngResource', 'ngCookies', 'ngNotificationsBar']);

app.config(['$routeProvider', function ($routeProvider) {

    $routeProvider
      .when( '/', {
        redirectTo: '/' })
      .when( '/', {
        templateUrl: 'newsletter-dashboard.html',
        controller: 'NewsletterDashboardController' })
      .when( '/emails', {
        templateUrl: 'emails.html',
        controller: 'EmailsController' })
      .when( '/stats', {
        templateUrl: 'stats.html',
        controller: 'StatsController' })
      .when( '/:name', {
        templateUrl: 'newsletter-editor.html',
        controller: 'NewsletterEditorController' })
      .when( '/:name/:operator', {
        templateUrl: 'newsletter-editor.html',
        controller: 'NewsletterEditorController' })
      .otherwise({
        redirectTo: '/' });
  }]);

app.config(['$resourceProvider', function ($resourceProvider) {
  // Don't strip trailing slashes from calculated URLs
  //$resourceProvider.defaults.stripTrailingSlashes = false;
}]);


app.factory('loadingSwitch', ['$rootScope', '$interval', '$timeout', function($rootScope, $interval, $timeout) {
  return {
    turnOn: function (label) {
      $rootScope.$broadcast('loadingIndicator:turnOn', label);

      var timer = $timeout(function () {
        $rootScope.$broadcast('loadingIndicator:turnOff');
        console.log('Loading indicator timeout');
      }, 120000);

      timer.turnOff = function () {
        $rootScope.$broadcast('loadingIndicator:turnOff');
        $timeout.cancel(this);
      }

      return timer;
    }
  };
}]);

app.directive('loadingIndicator', ['$interval', '$timeout', function ($interval, $timeout) {
  return {
    restrict: 'EA',
    template: '<div ng-show="loading" style="background-color: red; display: inline-block; top: 0px; right: 0px; padding: 3px 21px 3px 10px; position: absolute; min-width: 100px;">{{ label }}{{ dots }}</div>',
    link: function (scope, element, attrs) {

      var dots = 0,
          showLoadingIndicators = 0,
          interval;

      scope.$on('loadingIndicator:turnOn', function (event, label) {

        scope.label = label !== undefined ? label : 'Loading';

        if (++showLoadingIndicators === 1) {

          interval = $interval(function () {
            switch (++dots % 4) {
              case 0: scope.dots = '.'; break;
              case 1: scope.dots = '..'; break;
              case 2: scope.dots = '...'; break;
              case 3: scope.dots = '....'; break;
            };
          }, 700);

          scope.loading = true;
        }

      });

      scope.$on('loadingIndicator:turnOff', function (event, id) {
        if (--showLoadingIndicators === 0) {
          scope.loading = false;
          dots = 0;
          $interval.cancel(interval);
        }
      });
    }
  };
}]);
