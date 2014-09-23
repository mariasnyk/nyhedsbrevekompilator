var userdbControllers = angular.module('userdbControllers', []);

userdbControllers.controller('DashboardCtrl', ['$scope', '$http', 'userdbService',
  function ($scope, $http, userdbService) {

    // $scope.searching = false;
    // $scope.noresult = false;
    
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
      } else {
        $scope.members = [];
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

userdbControllers.controller('MemberDetailCtrl', ['$scope', '$routeParams',
  function ($scope, $routeParams) {
    $scope.phoneId = $routeParams.phoneId;
  }]);