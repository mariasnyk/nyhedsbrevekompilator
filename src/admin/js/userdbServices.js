var userdbServices = angular.module('userdbServices', []);

userdbServices.value('apiVersion', 'v0');

userdbServices.service('userdbService', ['apiVersion', '$http',
  function (apiVersion, $http) {
    var baseUrl = '/' + apiVersion + '/';

    this.get = function (relUrl) {
      return $http({method: 'GET', url: baseUrl + relUrl});
    };

    this.getMember = function (memberId) {
      return $http({method: 'GET', url: baseUrl + 'members/' + memberId});
    };

    this.searchMembers = function (input) {
      return $http({method: 'GET', url: baseUrl + 'search/members?text=' + input});
    };

    this.getAllPublishers = function () {
      return $http({method: 'GET', url: baseUrl + 'publishers'});
    };

    this.getPublisher = function (publisherId) {
      return $http({method: 'GET', url: baseUrl + 'publishers/' + publisherId});
    };

    this.sendTestNewsletter = function (data) {
      //return $http({method: 'POST', url: baseUrl + 'newsletters/tester'})
      return $http.post(baseUrl + 'newsletters/tester', data);
    }
  }]);