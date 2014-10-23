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
    var Newsletters = $resource('/apis/v0/newsletters/:id', { id: '@id' });
    var Identities = $resource('/apis/v0/sendgrid/identities');
    var Lists = $resource('/apis/v0/sendgrid/lists');
    var Templates = $resource('/templates/');
    
    if ($routeParams.id) {
      Newsletters.get({id: $routeParams.id}, function (newsletter, headers) {
        $scope.newsletter = newsletter;
        // $scope.html_url = '/templates' + $scope.newsletter.template + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id;
        // $scope.iframe_src = $sce.trustAsResourceUrl($scope.html_url);
        $scope.updatePreview();

        $scope.newsletter_post_url = $location.$$protocol + '://' + $location.$$host + ':' + $location.$$port + userdbService.getBaseUrl() + 'newsletters/' + newsletter.nyhedsbrev_id + '/send';
      });
      // userdbService.get('/newsletters/' + $routeParams.id)
      // .success( function (data, status, headers) {
      //   $scope.newsletter = data;
      // }).error( function (data, status) {
      //   $location.path('/newsletters');
      // });
    } else {
      $scope.newsletters = Newsletters.query();
      // userdbService.get('/newsletters')
      // .success( function (data, status, headers) {
      //   $scope.newsletters = data;
      // }).error( function (data, status) {
      //   $location.path('/');
      // });
    }

    $scope.identities = Identities.query();
    $scope.html_templates = Templates.query({filter:'.html'});
    $scope.plain_templates = Templates.query({filter:'.plain'});
    $scope.lists = Lists.query();



    if ($location.path().indexOf('preview') > 0) {
      userdbService.get('/newsletters/' + $routeParams.id + '/subscribers/count')
      .success(function (data) {
        console.log('data', data);
        $scope.subscribersCount = data.count;
      }).error( function (data, status) {
        $location.path('/newsletters/' + $routeParams.id);
      });
    }


    $scope.updatePreview = function () {
      $scope.loadingNewsletter = true;

      updateHtmlPreview();
      updatePlainPreview();

      // Getting the subject suggestion
      userdbService.getNewsletterSubjectSuggestion($scope.html_url)
      .success(function (data, status, getHeaders) {
        var headers = getHeaders();
        $scope.subject = decodeURIComponent(headers['x-subject-suggestion']);
        $scope.loadingNewsletter = false;
      }).error(function (data, status) {
        console.log('Error when heading for subject suggestion', data, status);
        $scope.loadingNewsletter = false;
      });
    };

    function updateHtmlPreview () {
      var template = $scope.html_templates.filter(function (item) {
        return item.name === $scope.newsletter.template_html;
      })[0];

      if (template === undefined) {
        $scope.loadingNewsletter = false;
        return;
      }

      $scope.html_url = template.uri + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id;
      $scope.iframe_html_preview = $sce.trustAsResourceUrl($scope.html_url);
    }

    function updatePlainPreview () {
      var template = $scope.plain_templates.filter(function (item) {
        return item.name === $scope.newsletter.template_plain;
      })[0];

      if (template === undefined) {
        $scope.loadingNewsletter = false;
        return;
      }

      $scope.plain_url = template.uri + '?' + $scope.newsletter.bond_type + '=' + $scope.newsletter.bond_id;
      $scope.iframe_plain_preview = $sce.trustAsResourceUrl($scope.plain_url);
    }

    $scope.save = function () {
      // console.log($scope.newsletter);
      $scope.newsletter.$save();
      // userdbService.saveNewsletter($scope.newsletter);
      notifications.showSuccess('Saved');
      // userdbService.saveNewsletter($scope.newsletter)
      // .success(function (data) {
      //   console.log('savedata', data);
      // }).error( function (data, status) {
      //   $scope.showError = true;
      //   $scope.errorMessage = 'Fejl';
      // });
    };

    $scope.draft = function () {
      var data = {
        identity: $scope.newsletter.identity,
        subject: $scope.subject,
        list: $scope.list,
        html_url: $scope.html_url
      };

      userdbService.draftAdhocNewsletter(data)
      .success(function () {
        notifications.showSuccess('Done');
      });
    };

    $scope.send = function () {
      var data = {
        identity: $scope.newsletter.identity,
        subject: $scope.subject,
        list: $scope.list,
        html_url: $scope.html_url
      };

      userdbService.sendAdhocNewsletter(data)
      .success(function () {
        notifications.showSuccess('Done');
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
