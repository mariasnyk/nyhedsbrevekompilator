app.controller('StatsController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', '$filter', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, $filter, notifications, loadingSwitch) {
    var Categories = $resource('/newsletters/categories');
    var Stats = $resource('/newsletters/categories/stats');

    $scope.start_date = new Date(Date.now() - 604800000); // 7 days = 1000 * 60 * 60 * 24 * 7  (milliseconds * seconds * minutes * hours * days)
    $scope.end_date = new Date();

    $scope.stats_parameters = {
      aggregated_by: "month", //day|week|month
      categories: []
    };

    $scope.categories = Categories.query();

    loadingSwitch.watch($scope.categories);

    $scope.getData = function () {
      if ($scope.stats_parameters.categories.length === 0) {
        $scope.missing_category = true;
        return;
      } else {
        $scope.missing_category = false;
      }

      $scope.stats_parameters.start_date = $filter('date')($scope.start_date, "yyyy-MM-dd");
      $scope.stats_parameters.end_date = $filter('date')($scope.end_date, "yyyy-MM-dd");

      console.log($scope.stats_parameters);
      $scope.statsData = [];

      var quering = Stats.query($scope.stats_parameters,
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
      },
      function (err) {
        console.log('err', err);
        notifications.showError(err.statusText);
      });

      loadingSwitch.watch(quering);
    };
  }]);


app.directive('chart', function() {
    return {
      restrict: 'A',
      link: function($scope, $elm, $attr) {
        // Create the data table.
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Topping');
        data.addColumn('number', 'Slices');
        data.addRows([
          ['Mushrooms', 3],
          ['Onions', 1],
          ['Olives', 1],
          ['Zucchini', 1],
          ['Pepperoni', 2]
        ]);

        // Set chart options
        var options = {'title':'How Much Pizza I Ate Last Night',
                       'width':400,
                       'height':300};

        // Instantiate and draw our chart, passing in some options.
        var chart = new google.visualization.PieChart($elm[0]);
        chart.draw(data, options);
      }
  };
});

// google.setOnLoadCallback(function() {
//     angular.bootstrap(document.body, ['myApp']);
// });
google.load('visualization', '1', {packages: ['corechart']});