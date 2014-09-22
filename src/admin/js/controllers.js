var userdbControllers = angular.module('userdbControllers', []);

userdbControllers.controller('DashboardCtrl', ['$scope', '$http', 'userdbService',
  function ($scope, $http, userdbService) {
    
    $scope.searchMembersEvent = function () {
      userdbService.searchMembers($scope.searchMembersInput).
        success(function (data, status) {
          $scope.members = data;
        }).
        error(function (data, status, headers, config) {
          console.log('error_data', data);
        });
    };

    $scope.searchMembersKeyUpEvent = function (clickEvent) {
      if (clickEvent.keyCode === 13) { /* Enter */
        $scope.searchMembersEvent();
      } else {
        $scope.members = [];
      }
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