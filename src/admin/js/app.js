//(function(window, angular, undefined) {'use strict';

var app = angular.module('userdb', ['ngRoute', 'ngSanitize', 'ngCookies', 'ui.bootstrap', 'userdbControllers'])

app.config(['$routeProvider',
  function ($routeProvider) {

  $routeProvider
    .when( '/', {
      templateUrl: 'templates/dashboard.html',
      controller: 'DashboardCtrl' })
    .otherwise({
      redirectTo: '/' });

  //$locationProvider.html5Mode(true);
  //$locationProvider.hashPrefix('!');
  }]);

app.value('apiVersion', 'v0');

app.service('userdbService', ['apiVersion', '$http',
  function (apiVersion, $http) {
    var baseUrl = '/' + apiVersion + '/';

    this.getMember = function (memberId) {
      return $http({method: 'GET', url: baseUrl + 'members/' + memberId});
    }

    this.searchMembers = function (input) {
      return $http({method: 'GET', url: baseUrl + 'search/members?text=' + input});
    }
  }]);
