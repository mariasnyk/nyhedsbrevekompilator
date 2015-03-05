app.controller('NewsletterEditorController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', '$q', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, $q, notifications, loadingSwitch) {

    // Defaulting the schedule with an added 15 minuttes
    $scope.at = new Date(new Date().getTime() + 15*60000);

    var Newsletters = $resource('/newsletters/:ident', { ident: '@ident' });
    var Identities = $resource('/newsletters/identities');
    var Lists = $resource('/newsletters/lists/:list', { list: '@list' });
    var Templates = $resource('/templates/:name', { name: '@name' });

    $scope.edit = $routeParams.operator === 'edit';

    if ($scope.edit) {

      $scope.identities = Identities.query();
      $scope.lists = Lists.query();
      $scope.html_templates = Templates.query({filter:'.html'});
      $scope.plain_templates = Templates.query({filter:'.plain'});

      // Waiting for the drop-down data to be fetched before we query the newsletter.
      // This is done so that drop-downs are populated and the equivalent newsletter value is selected in the drop-down.
      var all = $q.all([$scope.identities.$promise, $scope.lists.$promise, $scope.html_templates.$promise, $scope.plain_templates.$promise]).then(function () {
        $scope.newsletter = Newsletters.get({ ident: $routeParams.ident }, function () { /* All OK. */ }, resourceErrorHandler);

        loadingSwitch.watch($scope.newsletter);
      });

      loadingSwitch.watch(all);

    } else {

      // If we're not editing the newsletter, we don't need to fetch the dop-down data from e.g. SendGrid
      $scope.newsletter = Newsletters.get({ident: $routeParams.ident}, function () {

        $scope.newsletter.name = $scope.newsletter.name + ' ' + dkDateString();
        $scope.newsletter.after = 15;


        // Populating the drop downs so newsletter values are visible
        $scope.html_templates = [$scope.newsletter.template_html];
        $scope.plain_templates = [$scope.newsletter.template_plain];
        $scope.identities = [$scope.newsletter.identity];
        $scope.lists = [$scope.newsletter.list];

        // Validating the list still exists in SendGrid
        Lists.query({ list: $scope.newsletter.list}, function (response) {
          if (response[0] === undefined || response[0].list !== $scope.newsletter.list) {
            console.log('Couldn\'t find list ' + $scope.newsletter.list + ' in SendGrid.')
            $scope.lists = ['ERROR'];
          }
        }, resourceErrorHandler);

        updatePreview();
        //updateControlroomIframe();
        
      }, resourceErrorHandler);

      loadingSwitch.watch($scope.newsletter);
    }


    function resourceErrorHandler (response) {
      console.log('Error fetching ' + $routeParams.ident, response);
      if (response.status === 404) {
        $location.url('/');
      }
    }


    $scope.addCategory = function (clickEvent) {
      if ($scope.newsletter.categories == undefined) {
        $scope.newsletter.categories = [];
      }

      if (clickEvent.keyCode === 13) {
        if ($scope.newCategory !== '') {
          $scope.newCategory.split(',').forEach( function (category) {
            category = category.trim();
            if ($scope.newsletter.categories.indexOf(category) === -1 && category !== $scope.newsletter.name) {
              $scope.newsletter.categories.push(category);
            }
          });
          $scope.newCategory = '';
        }
      }
    };


    $scope.removeCategory = function (categoryIndex) {
      $scope.newsletter.categories.splice(categoryIndex, 1);
    };


    $scope.saveNewsletter = function (close) {
      var saving = Newsletters.save({ ident: $routeParams.ident }, $scope.newsletter, function (success) {
        console.log('Success saving template.');
        if (close === true) {
          $location.url('/' + $routeParams.ident);
        } else {
          notifications.showSuccess('Gemt');
        }
      });
      loadingSwitch.watch(saving, 'Saving');
    };


    $scope.deleteNewsletter = function () {
      var deleting = Newsletters.delete({ ident: $routeParams.ident }, function () {
        $location.url('/');
      });
      loadingSwitch.watch(deleting, 'Deleting');
    };


    $scope.updatePreviewClickEvent = function () {
      updatePreview();
    };


    function updatePreview () {
      if ($scope.newsletter.bond_url === undefined) {
        notifications.showWarning('Missing BOND Url');
        return;
      }

      $scope.loading_previews = true;

      var a = updateHtmlPreview();
      var b = updatePlainPreview();

      var all = $q.all([a,b]).finally(function () {
        $scope.loading_previews = false;
      });

      loadingSwitch.watch(all);
    }


    function updateHtmlPreview () {
      if ($scope.newsletter.template_html === undefined) {
        notifications.showWarning('Missing HTML template');
        return;
      }

      $scope.loading_html_preview = true;
      $scope.html_url = '/templates/' + $scope.newsletter.template_html + '?u=' + encodeURIComponent($scope.newsletter.bond_url);

      var getting = $http.get($scope.html_url)
      .success(function (data, status, getHeaders) {
        var headers = getHeaders();
        $scope.newsletter.subject = decodeURIComponent(headers['x-subject-suggestion']);
        $scope.newsletter.checksum = headers['x-content-checksum'];
        $scope.controlroom_url = $sce.trustAsUrl(decodeURIComponent(headers['x-controlroom-url']));
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

      loadingSwitch.watch(getting);
      return getting;
    };


    function updatePlainPreview () {
      if ($scope.newsletter.template_plain === undefined) {
        notifications.showWarning('Missing Text template');
        return;
      }

      $scope.loading_plain_preview = true;

      var getting = $http.get('/templates/' + $scope.newsletter.template_plain + '?u=' + encodeURIComponent($scope.newsletter.bond_url))
      .success(function (data) {
        $scope.newsletter.email_plain = data;
        $scope.loading_plain_preview = false;
      })
      .error(function (data, status, headers, config) {
        $scope.loading_plain_preview = false;
      });

      loadingSwitch.watch(getting);
      return getting;
    };


    $scope.sendNewsletter = function () {
      var sending = $http.post('/newsletters/send', $scope.newsletter)
      .success(function () {
        notifications.showSuccess('Email ' + $scope.newsletter.name + ' sendt');
      })
      .error(function (data, status) {
        console.log('Error', status, data);
        var error = data.error ? data.error :
                    data.message ? data.message :
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


    function updateControlroomIframe () {
      if ($scope.newsletter.bond_url === undefined) {
        return;
      }

      var getting = $http.get('/templates/controlroom?u=' + encodeURIComponent($scope.newsletter.bond_url))
      .success(function (data) {
        $scope.controlroom_url = $sce.trustAsResourceUrl(data.url);
      });

      loadingSwitch.watch(getting);
    }
  }]);


function dkDateString () {
  var a = new Date();
  return danishDayName(a.getUTCDay()) + ' ' + a.getUTCDate() + ' ' + danishMonthName(a.getUTCMonth() + 1) + ' ' + a.getFullYear();
}

function danishDayName (day) {
  switch (day) {
    case 1: return 'Man';
    case 2: return 'Tir';
    case 3: return 'Ons';
    case 4: return 'Tor';
    case 5: return 'Fre';
    case 6: return 'Lør';
    case 7: return 'Søn';
  }
}

function danishMonthName (month) {
  switch (month) {
    case 1: return 'Jan';
    case 2: return 'Feb';
    case 3: return 'Mar';
    case 4: return 'Apr';
    case 5: return 'Maj';
    case 6: return 'Jun';
    case 7: return 'Jul';
    case 8: return 'Aug';
    case 9: return 'Sep';
    case 10: return 'Okt';
    case 11: return 'Nov';
    case 12: return 'Dec';
  }
}