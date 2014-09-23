var userdbControllers = angular.module('userdbControllers', []);

userdbControllers.controller('MemberCtrl', ['$scope', '$routeParams', '$http', '$location', 'userdbService',
  function ($scope, $routeParams, $http, $location, userdbService) {

    // $scope.searching = false;
    // $scope.noresult = false;

    if ($routeParams.memberId) {
      userdbService.getMember($routeParams.memberId)
      .success( function (data, status, headers) {
        console.log(data);
        $scope.member = data;
      }).error( function (data, status) {
        $location.path('/');
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


    $scope.editMember = function(member_id) {
      $location.path(member_id !== undefined ? '/members/' + member_id : '/');
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