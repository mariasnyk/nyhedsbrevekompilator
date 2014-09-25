//(function(window, angular, undefined) {'use strict';

var app = angular.module('userdb', ['ngRoute', 'ngSanitize', 'ngCookies', 'ui.bootstrap', 'userdbControllers'])

app.config(['$routeProvider',
  function ($routeProvider) {

  $routeProvider
    .when( '/', {
      redirectTo: '/members' })
    .when( '/members', {
      templateUrl: 'templates/member-search.html',
      controller: 'MemberCtrl' })
    .when( '/members/:id', {
      templateUrl: 'templates/member-editor.html',
      controller: 'MemberCtrl' })
    .when( '/publishers', {
      templateUrl: 'templates/publisher-dashboard.html',
      controller: 'PublisherCtrl' })
    .when( '/publishers/:id', {
      templateUrl: 'templates/publisher-editor.html',
      controller: 'PublisherCtrl' })
    .otherwise({
      redirectTo: '/' });

  //$locationProvider.html5Mode(true);
  //$locationProvider.hashPrefix('!');
  }]);

app.value('apiVersion', 'v0');

app.service('userdbService', ['apiVersion', '$http',
  function (apiVersion, $http) {
    var baseUrl = '/' + apiVersion + '/';

    this.get = function (relUrl) {
      return $http({method: 'GET', url: baseUrl + relUrl});
    };

    this.getMember = function (memberId) {
      return $http({method: 'GET', url: baseUrl + 'members/' + memberId});
    };

    this.searchMembers = function (input) {
      return $http({method: 'GET', url: baseUrl + 'search/members?text=' + input});
    };

    this.getAllPublishers = function () {
      return $http({method: 'GET', url: baseUrl + 'publishers'});
    };

    this.getPublisher = function (publisherId) {
      return $http({method: 'GET', url: baseUrl + 'publishers/' + publisherId});
    };
  }]);

app.controller('MenuCtrl', ['$scope', '$location', '$rootScope',
  function($scope, $location, $rootScope) {
    $scope.menuitems = [
    {
      name:'Members',
      href:'/members'
    },{
      name:'Publishers',
      href:'/publishers'
    },{
      name:'Newsletters',
      href:'/newsletters'
    }];

    $rootScope.$on('$locationChangeSuccess', setActiveMenuitem);
    setActiveMenuitem();

    function setActiveMenuitem () {
      $scope.menuitems.forEach(function (menuitem) {
        if ($location.path().indexOf(menuitem.href) === 0)
          menuitem.active = true;
        else
          menuitem.active = false;
      });
    }
  }]);
