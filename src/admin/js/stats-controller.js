app.controller('StatsController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', '$filter', 'notifications',
  function ($scope, $routeParams, $location, $resource, $sce, $http, $filter, notifications) {
    var Categories = $resource('/newsletters/categories');
    var Stats = $resource('/newsletters/categories/stats');

    $scope.start_date = new Date(Date.now() - 604800000); // 7 days = 1000 * 60 * 60 * 24 * 7  (milliseconds * seconds * minutes * hours * days)
    $scope.end_date = new Date();

    $scope.stats_parameters = {
      aggregated_by: "month", //day|week|month
      categories: []
    }

    $scope.categories = Categories.query();

    $scope.getData = function () {
      if ($scope.stats_parameters.categories.length === 0) {
        $scope.missing_category = true;
        return;
      } else {
        $scope.missing_category = false;
      }
      $scope.loading = true;

      $scope.stats_parameters.start_date = $filter('date')($scope.start_date, "yyyy-MM-dd");
      $scope.stats_parameters.end_date = $filter('date')($scope.end_date, "yyyy-MM-dd");

      console.log($scope.stats_parameters);
      $scope.statsData = [];

      Stats.query($scope.stats_parameters,
      function (data) {
        console.log('data', data);
        data.forEach(function (value) {
          value.stats.forEach(function (stat) {
            $scope.statsData.push({
              date: value.date,
              name: stat.name,
              type: stat.type,
              metrics: stat.metrics
            });
          });
        });
        console.log($scope.statsData);
        $scope.loading = false;
      },
      function (err) {
        console.log('err', err);
        $scope.loading = false;
        notifications.showError(err.statusText);
      });
    };
  }]);
