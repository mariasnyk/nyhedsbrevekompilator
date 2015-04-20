app.controller('NewsletterEditorController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', '$q', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, $q, notifications, loadingSwitch) {

    // Defaulting the schedule with an added 15 minuttes
    $scope.at = new Date(new Date().getTime() + 15*60000);
    $scope.currentTab = 'html';

    var Newsletters = $resource('/newsletters/:ident', { ident: '@ident' });
    var Identities = $resource('/newsletters/identities');
    var Categories = $resource('/newsletters/categories');
    var Lists = $resource('/newsletters/lists/:list', { list: '@list' });
    var Templates = $resource('/templates/:name', { name: '@name' });

    $scope.edit = $routeParams.operator === 'edit';

    $scope.dirty = false;
    var after = moment().add(15, 'minutes');

    if ($scope.edit) {


      $scope.identities = Identities.query();
      $scope.categories = Categories.query();
      $scope.lists = Lists.query();
      $scope.html_templates = Templates.query({filter:'.html'});
      $scope.plain_templates = Templates.query({filter:'.plain'});

      // Waiting for the drop-down data to be fetched before we query the newsletter.
      // This is done so that drop-downs are populated and the equivalent newsletter value is selected in the drop-down.
      var all = $q.all([$scope.identities.$promise, $scope.categories.$promise, $scope.lists.$promise, $scope.html_templates.$promise, $scope.plain_templates.$promise]).then(function () {
        $scope.newsletter = Newsletters.get({ ident: $routeParams.ident }, function () { /* All OK. */ }, resourceErrorHandler);

        loadingSwitch.watch($scope.newsletter);
      });

      loadingSwitch.watch(all);

    } else {

      // If we're not editing the newsletter, we don't need to fetch the dop-down data from e.g. SendGrid
      $scope.newsletter = Newsletters.get({ident: $routeParams.ident}, function () {
        $scope.original_newsletters_name = $scope.newsletter.name;

        // Default 15 minuttes delay
        $scope.newsletter.after = 15;
        after = moment().add($scope.newsletter.after, 'minutes');
        $scope.newsletter.at = moment().add($scope.newsletter.after, 'minutes');

        suggestMarkeringEmailName();

        getBondDataAndUpdatePreviews();

        getControlroomUrl();

        // Populating the drop downs so newsletter values are visible
        $scope.html_templates = [$scope.newsletter.template_html];
        $scope.plain_templates = [$scope.newsletter.template_plain];
        $scope.identities = [$scope.newsletter.identity];
        $scope.lists = [$scope.newsletter.list];
        $scope.safe_bond_url = encodeURIComponent($scope.newsletter.bond_url);

        // Validating the list still exists in SendGrid
        Lists.query({ list: $scope.newsletter.list}, function (response) {
          if (response[0] === undefined || response[0].list !== $scope.newsletter.list) {
            console.log('Couldn\'t find list ' + $scope.newsletter.list + ' in SendGrid.');
            $scope.lists = ['ERROR'];
          }
        }, resourceErrorHandler);

      }, resourceErrorHandler);

      loadingSwitch.watch($scope.newsletter);
    }


    function resourceErrorHandler (response) {
      console.log('Error fetching ' + $routeParams.ident, response);
      if (response.status === 404) {
        $location.url('/');
      }
    }


    $scope.addCategory = function (clickEvent, category) {
      if ($scope.newsletter.categories === undefined) {
        $scope.newsletter.categories = [];
      }

      if (category) {
        $scope.newCategory = category
      }

      if (clickEvent.keyCode === 13 || category) {
        if ($scope.newCategory !== '') {
          $scope.newCategory.split(',').forEach( function (category) {
            category = category.trim();
            if ($scope.newsletter.categories.indexOf(category) === -1) {
              $scope.newsletter.categories.push(category);
              $scope.dirty = true;
            }
          });
          $scope.newCategory = '';
        }
      }
    };


    $scope.removeCategory = function (categoryIndex) {
      $scope.newsletter.categories.splice(categoryIndex, 1);
      $scope.dirty = true;
    };


    $scope.saveNewsletter = function () {
      var saving = Newsletters.save({ ident: $routeParams.ident }, $scope.newsletter, function (success) {
        notifications.showSuccess('Gemt');
        console.log('Success saving template.');
        $scope.dirty = false;
      });
      loadingSwitch.watch(saving, 'Saving');
    };

    $scope.closeNewsletterEditor = function () {
      if ($scope.dirty === false || confirm("Sikker på du vil gå til oversigten uden at gemme dine ændringer?")) {
        //$location.url('/' + $routeParams.ident);
        $location.url('/');
      }
    };

    $scope.deleteNewsletter = function () {
      if (confirm("Er du sikker på du ønsker at slette dette nyhedsbrev?\nDenne handling kan ikke fortrydes!")) {
        var deleting = Newsletters.delete({ ident: $routeParams.ident }, function () {
          $location.url('/');
        });
        loadingSwitch.watch(deleting, 'Deleting');
      }
    };

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

    $scope.afterChanged = function () {
      var temp = moment().add($scope.newsletter.after, 'minutes');
      if (!moment(after).isSame(temp, 'day')) {
        after = temp;
        suggestMarkeringEmailName();
        updatePreviews();
      }
    };

    function suggestMarkeringEmailName () {
      $scope.newsletter.name = $scope.original_newsletters_name + ' ' + moment().add($scope.newsletter.after, 'minutes').format("ddd D MMM YYYY");
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

      $scope.bonddata.at = $scope.newsletter.at;
      $scope.bonddata.after = $scope.newsletter.after;

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
      var sending = $http.post('/newsletters/send', $scope.newsletter)
      .success(function () {
        notifications.showSuccess('Email ' + $scope.newsletter.name + ' sendt');
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
