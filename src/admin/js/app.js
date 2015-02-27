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


app.factory('loadingSwitch', ['$rootScope', function($rootScope) {
  var showLoadingIndicater = false;

  return {
    turnOn: function () {
      $rootScope.$broadcast('loadingIndicator:turnOn', 'turnOn');
    },
    turnOff: function () {
      $rootScope.$broadcast('loadingIndicator:turnOff', 'turnOff');
    }
  };
}]);

app.directive('loadingIndicator', ['$interval', '$timeout', function ($interval, $timeout) {
  return {
    restrict: 'EA',
    template: '<div ng-show="loading" style="background-color: red; display: inline-block; top: 0px; right: 0px; padding: 3px 21px 3px 10px; position: absolute; min-width: 94px;">Loading{{dots}}</div>',
    link: function (scope, element, attrs) {

      var dots = 0;
      var a;

      scope.$on('loadingIndicator:turnOn', function (event, data) {
        dots = 0;
        a = c();
        scope.loading = true;
      });

      scope.$on('loadingIndicator:turnOff', function (event, data) {
        $interval.cancel(a);
        scope.loading = false;
      });

      function d () {
        switch (++dots % 4) {
          case 0: return '';
          case 1: return '.';
          case 2: return '..';
          case 3: return '...';
        };
      }

      function c () {
        return $interval(function () {
          scope.dots = d();
        }, 600);
      }
    }
  };
}]);
