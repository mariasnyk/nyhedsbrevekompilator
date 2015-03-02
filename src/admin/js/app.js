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
  var showLoadingIndicators = [];

  return {
    turnOn: function (label) {

      $rootScope.$broadcast('loadingIndicator:turnOn');

      var a = $interval(function () {
        console.log('a interval');
        }, 1000);

      a.turnOff = function () {
        $interval.cancel(a);
        console.log(showLoadingIndicators.length, showLoadingIndicators);
        //$rootScope.$broadcast('loadingIndicator:turnOff');

      }

      showLoadingIndicators.push(a);

      return a;

      // var id = (Math.floor(Math.random() * 128));

      // return {
      //   turnOff: function () {
      //     $rootScope.$broadcast('loadingIndicator:turnOff', id);
      //   }
      // }
    }
  };
}]);

app.directive('loadingIndicator', ['$interval', '$timeout', function ($interval, $timeout) {
  return {
    restrict: 'EA',
    template: '<div ng-show="loading" style="background-color: red; display: inline-block; top: 0px; right: 0px; padding: 3px 21px 3px 10px; position: absolute; min-width: 94px;">{{ label }}{{dots}}</div>',
    link: function (scope, element, attrs) {

      var dots = 0;
      var a, b;
      scope.label = 'Loading';

      scope.$on('loadingIndicator:turnOn', function (event, id) {
        a = $interval(function () {
          ++dots;
          console.log('dots', dots, dots % 4);
          switch (dots % 4) {
            case 0: scope.dots = ''; break;
            case 1: scope.dots = '.'; break;
            case 2: scope.dots = '..'; break;
            case 3: scope.dots = '...'; break;
          };
        }, 1000);

        b = $timeout(function () {
          dots = 0;
          $interval.cancel(a);
          scope.loading = false;
        }, 60000);

        scope.loading = true;
      });

      scope.$on('loadingIndicator:turnOff', function (event, id) {
        dots = 0;
        $interval.cancel(a);
        $timeout.cancel(b);
        scope.loading = false;
      });

      // function d () {
      //   switch (++dots % 4) {
      //     case 0: return '';
      //     case 1: return '.';
      //     case 2: return '..';
      //     case 3: return '...';
      //   };
      // }

      // function c () {
      //   return $interval(function () {
      //     ++dots;
      //     console.log('dots', dots, dots % 4);
      //     switch (dots % 4) {
      //       case 0: return scope.dots = '';
      //       case 1: return scope.dots = '.';
      //       case 2: return scope.dots = '..';
      //       case 3: return scope.dots = '...';
      //     };
      //   }, 700);
      // }
    }
  };
}]);
