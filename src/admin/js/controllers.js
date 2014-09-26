var userdbControllers = angular.module('userdbControllers', []);

userdbControllers.controller('MemberCtrl', ['$scope', '$routeParams', '$http', '$location', 'userdbService',
  function ($scope, $routeParams, $http, $location, userdbService) {

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


userdbControllers.controller('PublisherCtrl', ['$scope', '$routeParams', '$http', '$location', 'userdbService',
  function ($scope, $routeParams, $http, $location, userdbService) {

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
        $location.path('/publishers');
      });
    }

    $scope.editPublisherClick = function (publisherId) {
      $location.path(publisherId !== undefined ? '/publishers/' + publisherId : '/');
    };

    $scope.sendNewsletterClickEvent = function (subscriptionId) {
      console.log('sendNewsletterClickEvent' + subscriptionId);
    };
  }]);


userdbControllers.controller('TesterCtrl', ['$scope',
  function ($scope) {
    $scope.recepients = [];

    $scope.addRecepientsKeyUp = function(event) {
      if (event.keyCode === 13) { /* Enter */
        $scope.addRecepientClick();
      }
    }

    $scope.addRecepientClick = function () {
      if ($scope.new_recepient !== undefined) {
        $scope.recepients.unshift($scope.new_recepient);
        $scope.new_recepient = undefined;
      }
    }

    $scope.removeRecepientClick = function (index) {
      $scope.recepients = $scope.recepients.splice(index, 1);
    }

    $scope.sendTestNewsletterEventClick = function () {
      console.log($scope.from_email, $scope.from_name, $scope.subject, $scope.html_url);


    };
  }]);