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

    $scope.searchMembersKeyUpEvent = function (clickEvent) {
      if (clickEvent.keyCode === 13) { /* Enter */
        $scope.searchMembersEvent();
      }
    };


    $scope.editMemberClick = function(memberId) {
      $location.path(memberId !== undefined ? '/members/' + memberId : '/');
    };
    // userdbService.getMember(443765).
    //   success(function (data, status) {
    //     console.log('Daniel Nielsen', status, data);
    //   });
  }]);

// userdbControllers.controller('MemberEditorCtrl', ['$scope', '$routeParams', 'userdbService',
//   function ($scope, $routeParams, userdbService) {
//     $scope.memberId = $routeParams.memberId;

//     if ($routeParams.memberId) {
//       userdbService.getMember($routeParams.memberId)
//       .success( function (data, status, headers) {
//         console.log(data);
//         $scope.member = data;
//       }).error( function (data, status) {
//         $location.path('/');
//       });
//     }
//   }]);

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
  }]);