app.controller('NewsletterSenderController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', '$q', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, $q, notifications, loadingSwitch) {

    $scope.currentTab = 'html_tab';

    var Newsletters = $resource('/newsletters/:ident', { ident: '@ident' });
    var Identities = $resource('/newsletters/identities/:identity', { identity: '@identity' });
    var Lists = $resource('/newsletters/lists/:list', { list: '@list' });

    $scope.dirty = false;

    // Defaulting the schedule with an added 15 minuttes
    $scope.schedule_after = 15;
    $scope.schedule_at = moment().add(1, 'hours').startOf('hour');

    // $scope.schedule_date = $scope.schedule_at_specified ? moment($scope.schedule_at).
    setScheduleDateLabel();

    $scope.newsletter_ident = $routeParams.ident;

    // If we're not editing the newsletter, we don't need to fetch the dop-down data from e.g. SendGrid
    $scope.newsletter = Newsletters.get({ident: $routeParams.ident}, function () {

      $scope.original_newsletters_name = $scope.newsletter.name;
      $scope.$parent.page_title = $scope.original_newsletters_name;

      suggestMarketingEmailName();

      getBondDataAndUpdatePreviews();

      getControlroomUrl();

      $scope.safe_bond_url = encodeURIComponent($scope.newsletter.bond_url);

      // Validating the list still exists in SendGrid
      Lists.query({ list: $scope.newsletter.list}, function (response) {
        if (response[0] === undefined || response[0].list !== $scope.newsletter.list) {
          console.log('Couldn\'t find list ' + $scope.newsletter.list + ' in SendGrid.');
          notifications.showError('Afsender fejler');
        }
      }, resourceErrorHandler);

      // Validating the identity still exists in SendGrid
      Identities.get({ identity: $scope.newsletter.identity}, function (response) {
        // Found it and everything is OK.
      }, function (response) {
        console.log('Couldn\'t find identity ' + $scope.newsletter.identity + ' in SendGrid.');
        notifications.showError('Modtagerliste fejler');
      });

    }, resourceErrorHandler);

    loadingSwitch.watch($scope.newsletter);


    function resourceErrorHandler (response) {
      console.log('Error fetching ' + $routeParams.ident, response);
      if (response.status === 404) {
        $location.url('/');
      }
    }

    $scope.setDirty = function () {
      $scope.dirty = true;
    };

    $scope.changeNodeTitle = function () {
      $scope.bonddatadirty = true;
    };

    $scope.moveNode = function (from, to) {
      if (to !== -1) {
        $scope.bonddata.nodes.splice(to, 0, $scope.bonddata.nodes.splice(from,1)[0]);
        $scope.bonddatadirty = true;
      }
    };

    $scope.removeNode = function (index) {
      $scope.bonddata.nodes.splice(index,1);
      $scope.bonddatadirty = true;
    };

    $scope.scheduleChanged = function () {
      suggestMarketingEmailName();
      updatePreviews();
      setScheduleDateLabel();
    };

    $scope.hasCategory = function (category) {
      if ($scope.newsletter.categories === undefined) {
        return false;
      }

      return $scope.newsletter.categories.some(function (cat) {
        if (typeof category === 'string') {
          return cat === category;
        } else if(category instanceof Array) {
          return category.indexOf(cat) > -1;
        } else {
          return false;
        }
      });
    };

    function setScheduleDateLabel () {
      $scope.schedule_date = $scope.schedule_at_specified
        ? moment($scope.schedule_at).format('ddd D MMM YYYY')
        : moment().add($scope.schedule_after, 'minutes').format("ddd D MMM YYYY");
    }

    function suggestMarketingEmailName () {
      //$scope.newsletter.name = $scope.original_newsletters_name + ' ' + moment().add($scope.newsletter.after, 'minutes').format("ddd D MMM YYYY");
      $scope.newsletter.name = $scope.original_newsletters_name + ' ' + ($scope.schedule_at_specified
        ? moment($scope.schedule_at).format('ddd D MMM YYYY')
        : moment().add($scope.schedule_after, 'minutes').format("ddd D MMM YYYY"));
    }

    function getControlroomUrl () {
      var get = $http.get('/templates/controlroom?u=' + $scope.newsletter.bond_url)
      .success(function  (data) {
        $scope.controlroom_url = data.url;
      });
      return get;
    }


    function getBondData () {
      if ($scope.newsletter.bond_url === undefined) {
        notifications.showWarning('Missing BOND Url');
        return;
      }

      var get_bonddata = $http.get('/templates/data?u=' + encodeURIComponent($scope.newsletter.bond_url))
      //var get_bonddata = $http.get('/templates/data?f=bt.json')
      .success(function (data) {
        $scope.bonddata = data;
        $scope.newsletter.subject =  data.subject;
        $scope.newsletter.checksum = data.checksum;
        $scope.bonddatadirty = false;
      })
      .error(function (err) {
        notifications.showError('Failed to get data from ' + $scope.newsletter.bond_url);
      });
      
      loadingSwitch.watch(get_bonddata);
      return get_bonddata;
    }
    $scope.getBondData = getBondData;


    function updatePreviews () {
      var a = updateHtmlPreview();
      var b = updatePlainPreview();
      return $q.all([a,b]);
    }
    $scope.updatePreviews = updatePreviews;


    function getBondDataAndUpdatePreviews () {
      return getBondData().success(function () {

        // This is a hack.
        // We want to set show_body=true as a default value. This is actually already done on ng-init in the template newsletter-sender-html.
        // But because this whole Angularv app is not built using directives that can communicate, we're loading the newsletter preview before our view is fully loaded.

        // See the right way here: https://docs.angularjs.org/guide/directive#creating-directives-that-communicate
        // This approach requires a major refactoring.

        if ($scope.newsletter.categories && $scope.bonddata.nodes[0]) {
          var wantsToShowBodyDefault = $scope.newsletter.categories.some(function (category) {
            return ['Berlingske Morgen'].indexOf(category) > -1;
          });

          if (wantsToShowBodyDefault) {
            $scope.bonddata.nodes[0].show_body = true;
          }
        }
        // Hack end

        updatePreviews();
      });
    }
    $scope.getBondDataAndUpdatePreviews = getBondDataAndUpdatePreviews;


    function updateHtmlPreview () {
      if ($scope.newsletter.template_html === undefined) {
        notifications.showWarning('Missing HTML template');
        return;
      }

      $scope.loading_html_preview = true;

      $scope.bonddata.timestamp = $scope.schedule_at_specified
        ? moment($scope.schedule_at).unix()
        : moment().add($scope.schedule_after, 'minutes').unix();

      var get_html = $http.post('/templates/' + $scope.newsletter.template_html, $scope.bonddata)
      .success(function (data, status, getHeaders) {
        // var headers = getHeaders();
        //$scope.controlroom_url = $sce.trustAsUrl(decodeURIComponent(headers['x-controlroom-url']));
        $scope.newsletter.email_html = data;
        $scope.trusted_html_email_preview = $sce.trustAsHtml(data);
        $scope.loading_html_preview = false;
      })
      .error(function (data, status, headers, config) {
        console.log('updateHtmlPreview error', data);
        if (data.message) {
          notifications.showError(data.message);
        } else {
          notifications.showError('Error');
        }
        $scope.loading_html_preview = false;
        $scope.newsletter.email_html = '';
        $scope.trusted_html_email_preview = '<p>Error</p>';
      });

      $scope.bonddatadirty = false;
      loadingSwitch.watch(get_html);
      return get_html;
    }
    $scope.updateHtmlPreview = updateHtmlPreview;


    function updatePlainPreview () {
      if ($scope.newsletter.template_plain === undefined) {
        notifications.showWarning('Missing Text template');
        return;
      }

      $scope.loading_plain_preview = true;

      var get_plain = $http.post('/templates/' + $scope.newsletter.template_plain, $scope.bonddata)
      .success(function (data) {
        $scope.newsletter.email_plain = data;
        $scope.loading_plain_preview = false;
      })
      .error(function (data, status, headers, config) {
        $scope.loading_plain_preview = false;
      });

      loadingSwitch.watch(get_plain);
      return get_plain;
    }
    $scope.updatePlainPreview = updatePlainPreview;


    $scope.sendNewsletter = function () {

      var note = '';

      if ($scope.schedule_at_specified) {
        var temp = moment($scope.schedule_at);
        $scope.newsletter.at = temp.toISOString();
        note = temp.fromNow();
      } else {
        $scope.newsletter.after = 5;
        note = 'om 5 minutter';
      }

      var sending = $http.post('/newsletters/send', $scope.newsletter)
      .success(function () {
        $scope.newsletter_sent = true;
        notifications.showSuccess('Email ' + $scope.newsletter.name + ' sendes ' + note + '.');
      })
      .error(function (data, status) {
        console.log('Error', status, data);
        var error = data.message ? data.message :
                    data.error ? data.error :
                    data;

        notifications.showError('Error: ' + error);
      });

      loadingSwitch.watch(sending, 'Sender');
    };


    $scope.draftNewsletter = function () {
      var drafting = $http.post('/newsletters/draft', $scope.newsletter)
      .success(function () {
        notifications.showSuccess('Kladde ' + $scope.newsletter.name + ' oprettet');
      })
      .error(function (data, status) {
        console.log('Error', status, data);
      });

      loadingSwitch.watch(drafting, 'Opretter');
    };
  }]);
