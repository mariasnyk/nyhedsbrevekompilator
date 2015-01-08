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
