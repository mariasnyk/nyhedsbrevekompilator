//(function(window, angular, undefined) {'use strict';

var app = angular.module('userdb', ['ngRoute', 'ngSanitize', 'ngResource', 'ngCookies', 'ui.bootstrap', 'ngNotificationsBar'])

app.config(['$routeProvider', function ($routeProvider) {

  $routeProvider
    .when( '/', {
      redirectTo: '/newsletters' })
    .when( '/members', {
      templateUrl: 'templates/member-dashboard.html',
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
    .when( '/newsletters', {
      templateUrl: 'templates/newsletter-dashboard.html',
      controller: 'NewsletterCtrl' })
    .when( '/newsletters/:id', {
      templateUrl: 'templates/newsletter-editor.html',
      controller: 'NewsletterCtrl' })
    // .when( '/newsletters/:id/preview', {
    //   templateUrl: 'templates/newsletter-preview.html',
    //   controller: 'NewsletterCtrl' })
    .when( '/permissions', {
      templateUrl: 'templates/permission-dashboard.html',
      controller: 'PermissionCtrl' })
    .when( '/permissions/:id', {
      templateUrl: 'templates/permission-editor.html',
      controller: 'PermissionCtrl' })
    .when( '/interests', {
      templateUrl: 'templates/interest-dashboard.html',
      controller: 'InterestCtrl' })
    .when( '/interests/:id', {
      templateUrl: 'templates/interest-editor.html',
      controller: 'InterestCtrl' })
    .when( '/tester', {
      templateUrl: 'templates/tester.html',
      controller: 'TesterCtrl' })
    .otherwise({
      redirectTo: '/' });
}]);

app.config(['$resourceProvider', function ($resourceProvider) {
  // Don't strip trailing slashes from calculated URLs
  //$resourceProvider.defaults.stripTrailingSlashes = false;
}]);

app.controller('MenuCtrl', ['$scope', '$location', '$rootScope', function ($scope, $location, $rootScope) {
    $scope.menuitems = [
    {
    //   name: 'Members',
    //   href: '/members'
    // },{
    //   name: 'Publishers',
    //   href: '/publishers'
    // },{
      name: 'Newsletters',
      href: '/newsletters'
    },{
    //   name: 'Permissions',
    //   href: '/permissions'
    // },{
    //   name: 'Interests',
    //   href: '/interests'
    // },{
      name: 'Smartlinks',
      href: '/smartlinks'
    },{
      name: 'Tester',
      href: '/tester'
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
