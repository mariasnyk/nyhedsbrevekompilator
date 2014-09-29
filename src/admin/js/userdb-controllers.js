var userdbControllers = angular.module('userdbControllers', []);

userdbControllers.controller('MemberCtrl', ['$scope', '$routeParams', '$location', 'userdbService',
  function ($scope, $routeParams, $location, userdbService) {

    // $scope.searching = false;
    // $scope.noresult = false;

    if ($routeParams.id) {
      userdbService.getMember($routeParams.id)
      .success( function (data, status, headers) {
        console.log(data);
        $scope.member = data;
      }).error( function (data, status) {
        $location.path('/members');
      });
    }
    
    $scope.searchMembersEvent = function () {
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
    };

    $scope.searchMembersKeyUpEvent = function (event) {
      if (event.keyCode === 13) { /* Enter */
        $scope.searchMembersEvent();
      }
    };


    $scope.editMemberClick = function(memberId) {
      $location.path(memberId !== undefined ? '/members/' + memberId : '/');
    };
  }]);


userdbControllers.controller('PublisherCtrl', ['$scope', '$routeParams', '$location', 'userdbService',
  function ($scope, $routeParams, $location, userdbService) {

    if ($routeParams.id) {
      userdbService.getPublisher($routeParams.id)
      .success( function (data, status, headers) {
        console.log(data);
        $scope.publisher = data;
      }).error( function (data, status) {
        $location.path('/publishers');
      });
    } else {
      userdbService.getAllPublishers()
      .success( function (data, status, headers) {
        console.log(data);
        $scope.publishers = data;
      }).error( function (data, status) {
        $location.path('/');
      });
    }

    $scope.editPublisherClick = function (publisherId) {
      $location.path(publisherId !== undefined ? '/publishers/' + publisherId : '/');
    };

    $scope.editNewsletterClick = function (newsletterId) {
      $location.path(newsletterId !== undefined ? '/newsletters/' + newsletterId : '/');
    };

    $scope.sendNewsletterClick = function (newsletterId) {
      console.log('sendNewsletterClickEvent' + newsletterId);
    };
  }]);


userdbControllers.controller('NewsletterCtrl', ['$scope', '$routeParams', '$location', 'userdbService',
  function ($scope, $routeParams, $location, userdbService) {
    if ($routeParams.id) {
      //userdbService.getNewsletter($routeParams.id)
      userdbService.get('/newsletters/' + $routeParams.id)
      .success( function (data, status, headers) {
        $scope.newsletter = data;
      }).error( function (data, status) {
        $location.path('/newsletters');
      });
    } else {
      userdbService.get('/newsletters')
      .success( function (data, status, headers) {
        $scope.newsletters = data;
      }).error( function (data, status) {
        $location.path('/');
      });
    }

    $scope.editNewsletterClick = function (newsletterId) {
      $location.path(newsletterId !== undefined ? '/newsletters/' + newsletterId : '/');
    };

    $scope.sendNewsletterClick = function (newsletterId) {
      console.log('sendNewsletterClickEvent' + newsletterId);
    };
  }]);


userdbControllers.controller('TesterCtrl', ['$scope', 'userdbService',
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
      $scope.recipients = $scope.recipients.splice(index, 1);
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