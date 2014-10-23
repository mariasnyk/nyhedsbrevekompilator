//var userdbServices = angular.module('userdbServices', []);

app.value('apiVersion', 'v0');

app.service('userdbService', ['apiVersion', '$http',
  function (apiVersion, $http) {
    var baseUrl = '/apis/' + apiVersion + '/';

    this.getBaseUrl = function () {
      return baseUrl;
    };

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

    this.saveNewsletter = function (data) {
      return $http.put(baseUrl + 'newsletters/' + data.nyhedsbrev_id, data);
    };

    this.sendNewsletter = function (newsletterId) {
      return $http.post(baseUrl + 'newsletters/' + newsletterId + '/send');
    };

    this.sendAdhocNewsletter = function (data) {
      return $http.post(baseUrl + 'newsletters/send', data);
    };

    this.draftAdhocNewsletter = function (data) {
      return $http.post(baseUrl + 'newsletters/draft', data);
    };

    this.getNewsletterSubjectSuggestion = function (url) {
      return $http.head(url);
    };

    this.getNewsletterContent = function (url) {
      return $http.get(url);
    };
  }]);

function removeFirstSlash(url) {
  return url.charAt(0) === '/' ? url.slice(1) : url;
}