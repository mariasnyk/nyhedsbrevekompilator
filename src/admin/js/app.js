//(function(window, angular, undefined) {'use strict';

var app = angular.module('userdb', ['ngRoute', 'ngSanitize', 'ngResource', 'ngCookies', 'ui.bootstrap', 'ngNotificationsBar'])

// app.config(['$routeProvider', function ($routeProvider) {

//   $routeProvider
//     .when( '/', {
//       redirectTo: '/newsletters' })
//     .when( '/members', {
//       templateUrl: 'templates/member-dashboard.html',
//       controller: 'MemberCtrl' })
//     .when( '/members/:id', {
//       templateUrl: 'templates/member-editor.html',
//       controller: 'MemberCtrl' })
//     .when( '/publishers', {
//       templateUrl: 'templates/publisher-dashboard.html',
//       controller: 'PublisherCtrl' })
//     .when( '/publishers/:id', {
//       templateUrl: 'templates/publisher-editor.html',
//       controller: 'PublisherCtrl' })
//     .when( '/newsletters', {
//       templateUrl: 'templates/newsletter-dashboard.html',
//       controller: 'NewsletterCtrl' })
//     .when( '/newsletters/:id', {
//       templateUrl: 'templates/newsletter-editor.html',
//       controller: 'NewsletterCtrl' })
//     .when( '/adhoc', {
//       templateUrl: 'templates/newsletter-editor.html',
//       controller: 'NewsletterCtrl',
//       reloadOnSearch: false })
//     // .when( '/newsletters/:id/preview', {
//     //   templateUrl: 'templates/newsletter-preview.html',
//     //   controller: 'NewsletterCtrl' })
//     .when( '/permissions', {
//       templateUrl: 'templates/permission-dashboard.html',
//       controller: 'PermissionCtrl' })
//     .when( '/permissions/:id', {
//       templateUrl: 'templates/permission-editor.html',
//       controller: 'PermissionCtrl' })
//     .when( '/interests', {
//       templateUrl: 'templates/interest-dashboard.html',
//       controller: 'InterestCtrl' })
//     .when( '/interests/:id', {
//       templateUrl: 'templates/interest-editor.html',
//       controller: 'InterestCtrl' })
//     .otherwise({
//       redirectTo: '/' });
// }]);

app.config(['$resourceProvider',
  function ($resourceProvider) {
    // Don't strip trailing slashes from calculated URLs
    //$resourceProvider.defaults.stripTrailingSlashes = false;
  }]);

// app.controller('MenuCtrl', ['$scope', '$location', '$rootScope',
//   function ($scope, $location, $rootScope) {
//     $scope.menuitems = [
//     {
//     //   name: 'Members',
//     //   href: '/members'
//     // },{
//     //   name: 'Publishers',
//     //   href: '/publishers'
//     // },{
//       name: 'Adhoc',
//       href: '/adhoc'
//     },{
//       name: 'Newsletters',
//       href: '/newsletters'
//     // },{
//     //   name: 'Permissions',
//     //   href: '/permissions'
//     // },{
//     //   name: 'Interests',
//     //   href: '/interests'
//     // },{
//       // name: 'Smartlinks',
//       // href: '/smartlinks'
//     }];

//     $rootScope.$on('$locationChangeSuccess', setActiveMenuitem);
//     setActiveMenuitem();

//     function setActiveMenuitem () {
//       $scope.menuitems.forEach(function (menuitem) {
//         if ($location.path().indexOf(menuitem.href) === 0)
//           menuitem.active = true;
//         else
//           menuitem.active = false;
//       });
//     }
//   }]);


app.controller('NewsletterController', ['$scope', '$routeParams', '$location', 'userdbService', '$resource', '$sce', 'notifications',
  function ($scope, $routeParams, $location, userdbService, $resource, $sce, notifications) {

    //var Newsletters = $resource('/apis/v0/newsletters/:id', { id: '@id' });
    var Identities = $resource('/apis/v0/sendgrid/identities');
    var Lists = $resource('/apis/v0/sendgrid/lists');
    var Templates = $resource('/templates/');

    // if ($routeParams.id) {
    //   Newsletters.get({id: $routeParams.id}, function (newsletter, headers) {
    //     $scope.newsletter = newsletter;
    //     $scope.updatePreview();

    //     $scope.newsletter_post_url = $location.$$protocol + '://' + $location.$$host +
    //       ($location.$$port !== 80 ? ':' + $location.$$port : '')
    //       + userdbService.getBaseUrl() + 'newsletters/' + newsletter.nyhedsbrev_id + '/send';

    //   });
    // } else if ($location.path() === '/newsletters') { // Again, this is stupid! TODO: Make this better.
    //   $scope.newsletters = Newsletters.query();
    // }

    $scope.identities = Identities.query();
    $scope.lists = Lists.query();
    $scope.html_templates = Templates.query({filter:'.html'});
    $scope.plain_templates = Templates.query({filter:'.plain'});


    $scope.$watch(function () { return $location.search(); }, function () {
      var temp = $location.search();
      $scope.identity = temp['identity'] || '';
      $scope.bond_type = temp['bond_type'] || '';
      $scope.bond_id = temp['bond_id'] || '';
      $scope.template_html = temp['template_html'] || '';
      $scope.template_plain = temp['template_plain'] || '';
      $scope.list = temp['list'] || '';
    });

    // $scope.$watch('identity', function (identity) {
    //    setQuerystring('identity', identity);
    // });

    // $scope.$watch('bond_type', function (bond_type) {
    //   setQuerystring('bond_type', bond_type);
    //   $scope.updatePreview();
    // });

    // $scope.$watch('bond_id', function (bond_id) {
    //   setQuerystring('bond_id', bond_id);
    //   $scope.updatePreview();
    // });

    // $scope.$watch('template_html', function (template_html) {
    //   setQuerystring('template_html', template_html);
    //   $scope.updateHtmlPreview();
    // });

    // $scope.$watch('template_plain', function (template_plain) {
    //   setQuerystring('template_plain', template_plain);
    //   $scope.updatePlainPreview();
    // });

    // $scope.$watch('list', function (list) {
    //   setQuerystring('list', list);
    // });

    // function setQuerystring (field, value) {
    //   $location.search(field, encodeURIComponent(value));
    // }

    bindFieldToSearch('identity');
    bindFieldToSearch('bond_type');
    bindFieldToSearch('bond_id');
    bindFieldToSearch('template_html');
    bindFieldToSearch('template_plain');
    bindFieldToSearch('list');

    function bindFieldToSearch (field) {
      $scope.$watch(field, function (value) {
        $location.search(field, value);
      });
    }

    $scope.updatePreview = function () {
      console.log('UPDATING');
      if ($scope.bond_type === undefined ||
          $scope.bond_id === undefined) {
        return;
      }

      $scope.previewError = false;

      $scope.updateHtmlPreview();
      $scope.updatePlainPreview();
      $scope.updateSubjectPreview();
    };

    $scope.updateSubjectPreview = function () {
      // Getting the subject suggestion
      userdbService.getNewsletterSubjectSuggestion($scope.bond_type, $scope.bond_id)
      .success(function (data, status, getHeaders) {
        var headers = getHeaders();
        $scope.subject = decodeURIComponent(headers['x-subject-suggestion']);
        $scope.previewError = false;
      }).error(function (data, status) {
        console.log('Error when heading for subject suggestion', data, status);
        $scope.previewError = true;
        $scope.subject = null;
        $scope.iframe_html_preview = null;
        $scope.iframe_plain_preview = null;
      });
    };

    $scope.updateHtmlPreview = function () {
      if ($scope.template_html === undefined) {
        return;
      }

      var template = $scope.html_templates.filter(function (item) {
        return item.name === $scope.template_html;
      })[0];

      if (template === undefined) {
        return;
      }

      $scope.iframe_html_preview = $sce.trustAsResourceUrl(template.uri + '?' + $scope.bond_type + '=' + $scope.bond_id);
    }

    $scope.updatePlainPreview = function () {
      if ($scope.template_plain === undefined) {
        return;
      }


      var template = $scope.plain_templates.filter(function (item) {
        return item.name === $scope.template_plain;
      })[0];

      if (template === undefined) {
        return;
      }

      $scope.iframe_plain_preview = $sce.trustAsResourceUrl(template.uri + '?' + $scope.bond_type + '=' + $scope.bond_id);
    }

    $scope.sendAdhocNewsletterAction = function (draft) {
      if (draft !== undefined) {
        $scope.draft = draft
      }

      // TODO: Update the data that we send
      userdbService.sendAdhocNewsletter($scope.newsletter)
      .success(function (data) {
        if (draft)
          notifications.showSuccess('Kladde oprettet ' + data.name);
        else
          notifications.showSuccess('Sendt ' + data.name);
      })
      .error(function (data, status) {
        console.log('Error', status, data);
      });
    };
  }]);
