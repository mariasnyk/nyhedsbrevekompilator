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
