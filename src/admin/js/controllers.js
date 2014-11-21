//var userdbControllers = angular.module('userdbControllers', []);

app.controller('MemberCtrl', ['$scope', '$routeParams', '$location', 'userdbService', 'notifications',
  function ($scope, $routeParams, $location, userdbService, notifications) {

    $scope.searching = false;
    $scope.noresult = false;

    if ($routeParams.id) {
      userdbService.getMember($routeParams.id)
      .success( function (data, status, headers) {
        $scope.member = data;
        $scope.member.birth_date = new Date($scope.member.birth_date);
      }).error( function (data, status) {
        $location.path('/members');
      });
    } else if ($location.search().q) {
      $scope.searchMembersInput = $location.search().q;
      $scope.searching = true;
      $scope.noresult = false;
      $scope.members = [];

      userdbService.searchMembers($scope.searchMembersInput).
        success(function (data, status) {
          if (data.length === 0)
            $scope.noresult = true;
          $scope.members = data;
          $scope.searching = false;
        }).
        error(function (data, status, headers, config) {
          console.log('error_data', data);
          $scope.searching = false;
        });
    }
    
    $scope.searchMembersEvent = function (event) {
      if ((event.type === 'keyup' && event.keyCode === 13 /* Enter */) || event.type === 'click') {
        $location.search('q', $scope.searchMembersInput);
      }
    };
  }]);


app.controller('PublisherCtrl', ['$scope', '$routeParams', '$location', 'userdbService',
  function ($scope, $routeParams, $location, userdbService) {

    if ($routeParams.id) {
      userdbService.getPublisher($routeParams.id)
      .success( function (data, status, headers) {
        $scope.publisher = data;
      }).error( function (data, status) {
        $location.path('/publishers');
      });
    } else {
      userdbService.getAllPublishers()
      .success( function (data, status, headers) {
        $scope.publishers = data;
      }).error( function (data, status) {
        $location.path('/');
      });
    }
  }]);


app.controller('NewsletterCtrl', ['$scope', '$routeParams', '$location', 'userdbService', '$resource', '$sce', 'notifications',
  function ($scope, $routeParams, $location, userdbService, $resource, $sce, notifications) {

    // A global toggle to show/hide controls in the view
    $scope.adhocNewsletter = $location.path() === '/adhoc'; // This is atupid. Must be done better than hardcoding to $$path. TODO

    var Newsletters = $resource('/apis/v0/newsletters/:id', { id: '@id' });
    var Identities = $resource('/apis/v0/sendgrid/identities');
    var Lists = $resource('/apis/v0/sendgrid/lists');
    var Templates = $resource('/templates/');

    if ($routeParams.id) {
      Newsletters.get({id: $routeParams.id}, function (newsletter, headers) {
        $scope.newsletter = newsletter;
        $scope.updatePreview();

        $scope.newsletter_post_url = $location.$$protocol + '://' + $location.$$host +
          ($location.$$port !== 80 ? ':' + $location.$$port : '')
          + userdbService.getBaseUrl() + 'newsletters/' + newsletter.nyhedsbrev_id + '/send';

          $scope.unsavedChanges = false;
      });
    } else if ($location.path() === '/newsletters') { // Again, this is stupid! TODO: Make this better.
      $scope.newsletters = Newsletters.query();
    }

    $scope.identities = Identities.query();
    $scope.lists = Lists.query();
    $scope.html_templates = Templates.query({filter:'.html'});
    $scope.plain_templates = Templates.query({filter:'.plain'});


    $scope.updatePreview = function () {
      if ($scope.newsletter.bond_type === undefined ||
          $scope.newsletter.bond_id === undefined) {
        return;
      }

      $scope.previewError = false;

      $scope.updateHtmlPreview();
      $scope.updatePlainPreview();

      // Getting the subject suggestion
      userdbService.getNewsletterSubjectSuggestion($scope.newsletter.bond_type, $scope.newsletter.bond_id)
      .success(function (data, status, getHeaders) {
        var headers = getHeaders();
        $scope.previewError = false;
        $scope.newsletter.subject = decodeURIComponent(headers['x-subject-suggestion']);
      }).error(function (data, status) {
        console.log('Error when heading for subject suggestion', data, status);
        $scope.previewError = true;
        $scope.newsletter.subject = null;
        $scope.iframe_html_preview = null;
        $scope.iframe_plain_preview = null;
      });
    };

    $scope.identityChanged = function () {
      $scope.unsavedChanges = true;
    }

    $scope.updateHtmlPreview = function () {
      if ($scope.newsletter.template_html === undefined) {
        return;
      }

      var template = $scope.html_templates.filter(function (item) {
        return item.name === $scope.newsletter.template_html;
      })[0];

      if (template === undefined) {
        return;
      }

      $scope.iframe_html_preview = $sce.trustAsResourceUrl(template.uri + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id);

      $scope.unsavedChanges = true;
    }

    $scope.updatePlainPreview = function () {
      if ($scope.newsletter.template_plain === undefined) {
        return;
      }


      var template = $scope.plain_templates.filter(function (item) {
        return item.name === $scope.newsletter.template_plain;
      })[0];

      if (template === undefined) {
        return;
      }

      $scope.iframe_plain_preview = $sce.trustAsResourceUrl(template.uri + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id);

      $scope.unsavedChanges = true;
    }

    $scope.listChanged = function () {
      $scope.unsavedChanges = true;
    }

    $scope.save = function () {
      // console.log($scope.newsletter);
      $scope.newsletter.$save();
      // userdbService.saveNewsletter($scope.newsletter);
      notifications.showSuccess('Gemt');

      $scope.unsavedChanges = false;
      // userdbService.saveNewsletter($scope.newsletter)
      // .success(function (data) {
      //   console.log('savedata', data);
      // }).error( function (data, status) {
      //   $scope.showError = true;
      //   $scope.errorMessage = 'Fejl';
      // });
    };

    $scope.sendAdhocNewsletterAction = function (draft) {
      if (draft !== undefined) {
        $scope.newsletter.draft = draft
      }

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


    $scope.sendNewsletterAction = function () {
      userdbService.sendNewsletter($scope.newsletter.nyhedsbrev_id)
      .success(function (data) {
        notifications.showSuccess('Sendt ' + data.name);
      })
      .error(function (data, status) {
        notifications.showError('Error');
        console.log('Error', status, data);
      });
    };
  }]);


app.controller('PermissionCtrl', ['$scope', '$routeParams', '$location', 'userdbService',
  function ($scope, $routeParams, $location, userdbService) {
    if ($routeParams.id) {
      userdbService.get('/permissions/' + $routeParams.id)
      .success( function (data, status, headers) {
        $scope.permission = data;
      }).error( function (data, status) {
        $location.path('/permissions');
      });
    } else {
      userdbService.get('/permissions')
      .success( function (data, status, headers) {
        $scope.permissions = data;
      }).error( function (data, status) {
        $location.path('/');
      });
    }
  }]);


app.controller('InterestCtrl', ['$scope', '$routeParams', '$location', 'userdbService',
  function ($scope, $routeParams, $location, userdbService) {
    if ($routeParams.id) {
      userdbService.get('/interests/' + $routeParams.id)
      .success( function (data, status, headers) {
        $scope.interest = data;
      }).error( function (data, status) {
        $location.path('/interests');
      });
    } else {
      userdbService.get('/interests')
      .success( function (data, status, headers) {
        $scope.interests = data;
      }).error( function (data, status) {
        $location.path('/');
      });
    }
  }]);
