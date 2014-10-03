//var userdbServices = angular.module('userdbServices', []);

app.value('apiVersion', 'v0');

app.service('userdbService', ['apiVersion', '$http',
  function (apiVersion, $http) {
    var baseUrl = '/' + apiVersion + '/';

    this.get = function (relUrl) {
      return $http({method: 'GET', url: baseUrl + removeFirstSlash(relUrl)});
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

    this.sendNewsletter = function (newsletterId) {
      //return $http({method: 'POST', url: baseUrl + 'newsletters/tester'})
      return $http.post(baseUrl + 'newsletters/' + newsletterId + '/send');
    }

    this.sendTestNewsletter = function (data) {
      //return $http({method: 'POST', url: baseUrl + 'newsletters/tester'})
      return $http.post(baseUrl + 'newsletters/tester', data);
    }
  }]);

function removeFirstSlash(url) {
  return url.charAt(0) === '/' ? url.slice(1) : url;
}