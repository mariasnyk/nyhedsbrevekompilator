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
      } else {
        notifications.showError('Fejl ved indlæsning af nyhedsbrev');
      }
    }

    $scope.changeNodeTitle = function () {
      $scope.bonddatadirty = true;
      suggestMarketingEmailSubject();
    };

    $scope.moveNode = function (from, to) {
      if (to !== -1) {
        $scope.bonddata.nodes.splice(to, 0, $scope.bonddata.nodes.splice(from,1)[0]);
        $scope.bonddatadirty = true;
        suggestMarketingEmailSubject();
      }
    };

    $scope.removeNode = function (index) {
      $scope.bonddata.nodes.splice(index,1);
      $scope.bonddatadirty = true;
      suggestMarketingEmailSubject();
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

    function suggestMarketingEmailSubject () {
      var maxLength = 255;

      if (!$scope.newsletter_subject_dirty || $scope.newsletter.subject === '') {

        // In case the subject was cleared manually to get a fresh suggestion
        $scope.newsletter_subject_dirty = false;

        if ($scope.bonddata === null) {
          $scope.newsletter.subject = '';
        } else if ($scope.bonddata.type === 'nodequeue' || $scope.bonddata.type === 'latest_news') {
          var temp = [];
          for (var i = 0; i < 3; i++) {
            if ($scope.bonddata.nodes[i] && $scope.bonddata.nodes[i].title) {
              temp.push($scope.bonddata.nodes[i].title);
            }
          }
          $scope.newsletter.subject = temp.join(' | ').substring(0, maxLength);
        } else if ($scope.bonddata.type === 'node') {
          $scope.newsletter.subject = $scope.bonddata.title.substring(0, maxLength);
        } else {
          $scope.newsletter.subject = '';
        }
      }
    }

    function suggestMarketingEmailName () {
      if (!$scope.newsletter_name_dirty || $scope.newsletter.name === '') {
        // In case the name was cleared manually to get a fresh suggestion
        $scope.newsletter_name_dirty = false;

        //$scope.newsletter.name = $scope.original_newsletters_name + ' ' + moment().add($scope.newsletter.after, 'minutes').format("ddd D MMM YYYY");
        $scope.newsletter.name = $scope.original_newsletters_name + ' ' + ($scope.schedule_at_specified
          ? moment($scope.schedule_at).format('ddd D MMM YYYY')
          : moment().add($scope.schedule_after, 'minutes').format("ddd D MMM YYYY"));
      }
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

      // This is a simple way to prevent the caching issue on BOND.
      // By adding a simple query parameter, BOND caching doesn't know the URL.
      var bond_url_with_caching_prevention = $scope.newsletter.bond_url + '&cache=' + Date.now();

      var get_bonddata = $http.get('/templates/data?u=' + encodeURIComponent(bond_url_with_caching_prevention)).then(function (response) {
        $scope.bonddata = response.data;
        $scope.newsletter.checksum = response.data.checksum;
        $scope.bonddatadirty = false;
        suggestMarketingEmailSubject();

        // This is a hack.
        // We want to set show_body=true as a default value. This is actually already done on ng-init in the template newsletter-sender-html.
        // But because this whole Angularv app is not built using directives that can communicate, we're loading the newsletter preview before our view is fully loaded.

        // See the right way here: https://docs.angularjs.org/guide/directive#creating-directives-that-communicate
        // This approach requires a major refactoring.

        if ($scope.newsletter.categories && $scope.bonddata.nodes[0]) {
          var wantsToShowBodyDefault = $scope.newsletter.categories.some(function (category) {
            return ['Business Morgen'].indexOf(category) > -1;
          });

          if (wantsToShowBodyDefault) {
            $scope.bonddata.nodes[0].show_body = true;
          }
        }
        // Hack end
      }, function (response) {
        notifications.showError('Failed to get data from ' + bond_url_with_caching_prevention);
      });

      loadingSwitch.watch(get_bonddata);
      return get_bonddata;
    }


    function getBondDataAndUpdatePreviews () {
      return getBondData().then(function () {
        updatePreviews();
      });
    }
    $scope.getBondDataAndUpdatePreviews = getBondDataAndUpdatePreviews;


    function updatePreviews () {
      var a = updateHtmlPreview();
      var b = updatePlainPreview();
      return $q.all([a,b]).then(function () {
        $scope.bonddatadirty = false;
      });
    }
    $scope.updatePreviews = updatePreviews;


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

      loadingSwitch.watch(get_html);
      return get_html;
    }


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


    $scope.sendNewsletter = function () {

      var note = '';

      if ($scope.send_now) {
        $scope.newsletter.after = 0;
        note = 'med det samme';
      } else if ($scope.schedule_at_specified) {
        var temp = moment($scope.schedule_at);
        $scope.newsletter.at = temp.toISOString();
        note = temp.fromNow();
      } else {
        $scope.newsletter.after = 5;
        note = 'om 5 minutter';
      }

      var sending = $http.post('/newsletters/send', $scope.newsletter).then(function (success) {
        console.log('Success', success);
        $scope.newsletter_sent = true;
        notifications.showSuccess('Email ' + $scope.newsletter.name + ' sendes ' + note + '.');
      }, function (error) {
        console.log('Error', error);
        if (error.status === 401) {
          notifications.showError('Nyhedsbrev med samme navn eksisterer allerede');
        } else {
          notifications.showError('Fejl: ' + error);
        }
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

    $scope.showEmailHtml = function () {
      var preview = window.open();
      preview.document.open();
      preview.document.write($scope.newsletter.email_html);
      preview.document.close();
    };
  }]);
