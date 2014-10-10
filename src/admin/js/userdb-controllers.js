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
    var Newsletters = $resource('/v0/newsletters/:id', {id: '@id'});
    
    if ($routeParams.id) {
      $scope.newsletter = Newsletters.get({id: $routeParams.id}, function (newsletter) {
        $scope.newsletter = newsletter;
        $scope.iframe_src = $sce.trustAsResourceUrl(newsletter.html_url);
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

    if ($location.path().indexOf('preview') > 0) {
      userdbService.get('/newsletters/' + $routeParams.id + '/subscribers/count')
      .success(function (data) {
        console.log('data', data);
        $scope.subscribersCount = data.count;
      }).error( function (data, status) {
        $location.path('/newsletters/' + $routeParams.id);
      });
    }

    $scope.save = function () {
      $scope.newsletter.$save();
      notifications.showSuccess('Saved');
      // userdbService.saveNewsletter($scope.newsletter)
      // .success(function (data) {
      //   console.log('savedata', data);
      // }).error( function (data, status) {
      //   $scope.showError = true;
      //   $scope.errorMessage = 'Fejl';
      // });
    };

    $scope.sendNewsletterClick = function (newsletterId) {
      userdbService.sendNewsletter(newsletterId);
      notifications.showSuccess('Done');
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


app.controller('TesterCtrl', ['$scope', 'userdbService',
  function ($scope, userdbService) {
    // Just to prefill
    $scope.recipients = ['dako@berlingskemedia.dk'];
    $scope.from_email = 'kommunikation@berlingskemedia.dk';
    $scope.from_name = 'Berlingske Media';
    $scope.subject = 'Super sejt nyhedsbrev';
    $scope.html_url = 'http://nodeweekly.com/issues/52';

    $scope.addRecipientsKeyUp = function(event) {
      if (event.keyCode === 13) { /* Enter */
        $scope.addRecipientClick();
      }
    }

    $scope.addRecipientClick = function () {
      if ($scope.new_recipient !== undefined) {
        $scope.recipients.unshift($scope.new_recipient);
        $scope.new_recipient = undefined;
      }
    }

    $scope.removeRecipientClick = function (index) {
      $scope.recipients.splice(index, 1);
    }

    $scope.sendTestNewsletterEventClick = function () {
      var data = {
        from_email: $scope.from_email,
        from_name: $scope.from_name,
        subject: $scope.subject,
        html_url: $scope.html_url,
        recipients: $scope.recipients
      };

      userdbService.sendTestNewsletter(data)
    };
  }]);