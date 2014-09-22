//(function(window, angular, undefined) {'use strict';
console.log('APP')
var app = angular.module('userdb', ['ngRoute', 'ngSanitize', 'ngCookies', 'slugifier'])

.config(function ( $routeProvider, $locationProvider ) {

  $routeProvider
    .when( '/', {
      templateUrl: 'templates/dashboard.html',
      controller: 'DashboardCtrl' })
    // .when( '/members/', {
    //   templateUrl: 'article-editor/article-editor.html',
    //   controller: 'ArticleEditorCtrl' })
    // .when( '/members/:memberId', {
    //   templateUrl: 'article-editor/article-editor.html',
    //   controller: 'ArticleEditorCtrl' })
    .otherwise({
      redirectTo: '/' });

  //$locationProvider.html5Mode(true);
  //$locationProvider.hashPrefix('!');
});

function DashboardCtrl ( Settings, $scope, $http, $location ) {

  // $scope.apibase = Settings.apibase;
  // $scope.setApibase = function() {
  //   Settings.setApibase($scope.apibase);
  // }

  // $scope.loadArticles = function () {
  //   var query = Settings.apibase + 'search/articles';
  //   if ($scope.showDeleted) {
  //     query += '?deleted=true';
  //   }

  //   $http.get( query ).success(function ( data ) {
  //     $scope.articles = data.reverse();
  //   }).error(function(){
  //     $scope.noConnection = true;
  //   });
  // }
  // $scope.loadArticles();

  // $scope.openArticleEditor = function (_id) {
  //   $location.path(_id === undefined ? '/edit/articles' : '/edit/articles/' + _id);
  // };

  // $scope.loadLists = function () {
  //   $http.get( Settings.apibase + 'search/lists' ).success(function ( data ) {
  //     $scope.lists = data.reverse();
  //   }).error(function(){
  //     $scope.noConnection = true;
  //   });
  // }
  // $scope.loadLists();

  // $scope.openListEditor = function (_id) {
  //   $location.path('/edit/lists/' + _id);
  // };

  // $scope.createNewList = function (clickEvent) {
  //   if ( clickEvent.keyCode === 13 ) {
  //     $http.post( Settings.apibase + 'lists/', { description: $scope.newListDescription })
  //     .success(function (data, status, headers, config) {
  //       $scope.lists.unshift(data);
  //       $scope.newListDescription = '';
  //     })
  //     .error(function (data, status, headers, config) {
  //       console.log(data);
  //       $scope.notifications.push({ text: 'Error', type: 'warning' });
  //     });
  //   }
  // };
}
