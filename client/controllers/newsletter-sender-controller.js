app.controller('NewsletterSenderController', ['$scope', '$routeParams', '$location', '$resource', '$sce', '$http', '$q', 'notifications', 'loadingSwitch',
  function ($scope, $routeParams, $location, $resource, $sce, $http, $q, notifications, loadingSwitch) {

    $scope.currentTab = 'html_tab';

    var Newsletters = $resource('/newsletters/:ident', { ident: '@ident' });

    $scope.dirty = false;

    // Defaulting the schedule with an added 15 minuttes
    $scope.schedule_after = 15;
    $scope.schedule_at = moment().add(1, 'hours').startOf('hour');

    // setScheduleDateLabel();

    $scope.newsletter_ident = $routeParams.ident;

    $scope.newsletter = Newsletters.get({ident: $routeParams.ident}, function () {
      $scope.original_newsletters_name = $scope.newsletter.name;
      $scope.$parent.page_title = $scope.original_newsletters_name;
      $scope.safe_bond_url = encodeURIComponent($scope.newsletter.bond_url);
    }, resourceErrorHandler);

    loadingSwitch.watch($scope.newsletter);

    $scope.newsletter.$promise
    .then(suggestMarketingEmailName)
    .then(getControlroomUrl)
    .then(getBondDataAndUpdatePreviews)


    function getBondDataAndUpdatePreviews () {
      return getBondData()
      .then(suggestMarketingEmailSubject)
      .then(setShowBodyDefaults)
      .then(updatePreviews);
    }
    $scope.getBondDataAndUpdatePreviews = getBondDataAndUpdatePreviews;


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


    // $scope.scheduleChanged = function () {
    //   suggestMarketingEmailName();
    //   updatePreviews();
    //   setScheduleDateLabel();
    // };


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

    $scope.hasTag = function (tags, every) {
      if ($scope.newsletter.tags === undefined) {
        return false;
      } else if (typeof tags === 'string') {
        return $scope.newsletter.tags.indexOf(tags) > -1;
      } else if(tags instanceof Array) {
        if (every) {
          return tags.every(function (tag) {
            return $scope.newsletter.tags.indexOf(tag) > -1;
          });
        } else {
          return tags.some(function (tag) {
            return $scope.newsletter.tags.indexOf(tag) > -1;
          });
        }
      } else {
        return false;
      }
    };


    // function setScheduleDateLabel () {
    //   $scope.schedule_date = $scope.schedule_at_specified
    //     ? moment($scope.schedule_at).format('ddd D MMM YYYY')
    //     : moment().add($scope.schedule_after, 'minutes').format("dddd [d.] D MMMM YYYY");
    // }


    function suggestMarketingEmailSubject () {
      var maxLength = 255;

      if (!$scope.newsletter_subject_dirty || $scope.newsletter.subject === '') {

        // In case the subject was cleared manually to get a fresh suggestion
        $scope.newsletter_subject_dirty = false;

        if ($scope.newsletter.tags && $scope.newsletter.tags.indexOf('bt_subject_naming') > -1) {
          $scope.newsletter.subject = 'Nyhedsbrev: ' + $scope.newsletter.name;
        } else if ($scope.newsletter.tags && $scope.newsletter.tags.indexOf('name_to_subject') > -1) {
          $scope.newsletter.subject = $scope.newsletter.name;
        } else if ($scope.bonddata === undefined || $scope.bonddata === null) {
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
          : moment().add($scope.schedule_after, 'minutes').format("dddd [d.] D MMMM YYYY"));
      }
    }


    function getControlroomUrl () {
      var bond = new URL($scope.newsletter.bond_url);
      var bond_base_url = '';

      if (bond.host.indexOf('edit.') === 0) {
        bond_base_url = bond.protocol + '//' + bond.host;
      } else if (bond.host.indexOf('common.') === 0) {
        bond_base_url = bond.protocol + '//' + bond.host;
        bond_base_url = bond.protocol + '//edit.berlingskemedia.net';
      } else if (bond.host.substr(-3) === '.dk') {
        bond_base_url = bond.protocol + '//edit.berlingskemedia.net';
      }

      var id = bond.pathname.substring(bond.pathname.lastIndexOf('/') + 1, bond.pathname.indexOf('.ave-json'));

      if (bond.pathname.indexOf("/bondapi/nodequeue/") === 0) {
        $scope.controlroom_url = bond_base_url + '/admin/content/nodequeue/' + id + '/view';
      } else if (bond.pathname.indexOf("/bondapi/node/") === 0) {
        $scope.controlroom_url = bond_base_url + '/node/' + id + '/view';
      } else {
        $scope.controlroom_url = '';
      }
    }


    function getBondData () {
      if ($scope.newsletter.bond_url === undefined) {
        notifications.showWarning('Missing BOND Url');
        return;
      }

      // This is a simple way to prevent the caching issue on BOND.
      // By adding a simple query parameter, BOND caching doesn't know the URL.
      var bond_url_with_caching_prevention = $scope.newsletter.bond_url + '&cache=' + Date.now();

      // We're getting the data from BOND through the backend because of missing CORS headers
      var get_bonddata = $http.get('/data?u=' + encodeURIComponent(bond_url_with_caching_prevention)).then(function (response) {

        if (['nodequeue', 'latest_news'].indexOf(response.data.type) === -1) {
          notifications.showWarning('Data fra Bond er ikke en nodekø.')
        }

        $scope.bonddata = response.data;
        $scope.bonddatadirty = false;
      }, function (response) {
        console.error(response);
        notifications.showError('Failed to get data from ' + bond_url_with_caching_prevention);
      });

      loadingSwitch.watch(get_bonddata);
      return get_bonddata;
    }

    function setShowBodyDefaults () {
      // This is a hack.
      // We want to set show_body=true as a default value. This is actually already done on ng-init in the template newsletter-sender-html.
      // But because this whole Angular app is not built using directives that can communicate, we're loading the newsletter preview before our view is fully loaded.

      // See the right way here: https://docs.angularjs.org/guide/directive#creating-directives-that-communicate
      // This approach requires a major refactoring.

      if ($scope.newsletter.tags) {
        var feature_showbodydefault = $scope.hasTag('feature_showbodydefault');
        if (feature_showbodydefault && $scope.bonddata.nodes[0]) {
          $scope.bonddata.nodes[0].show_body = true;
        }
      }
    }


    function updatePreviews () {
      return updateHtmlPreview().then(function () {
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

      $scope.bonddata.tags = $scope.newsletter.tags;

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
        } else if (data.statusText) {
          notifications.showError(data.statusText);
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



    $scope.uploadNewsletter = function () {

      var payload = {
        contentType: "application/vnd.etmc.email.Message",
        name: $scope.newsletter.name,
        channels: {
          email: true,
          web: false
        },
        views: {
          html: {
            content: $scope.newsletter.email_html
          },
          subjectline: {
            contentType: "application/vnd.etmc.email.View; kind=subjectline",
            content: $scope.newsletter.subject
          }
        },
        category: {
          id: $scope.newsletter.folder_id
        },
        assetType: {
          name: "htmlemail",
          id: 208
        },
        data: {
          email: {
            options: {
              characterEncoding: "utf-8"
            },
            attributes: []
          }
        }
      };


      if ($scope.newsletter.context_id) {
        payload.sharingProperties = {
          sharedWith: [$scope.newsletter.context_id],
          sharingType: "local"
        }
      }

      if($scope.newsletter.AdditionalEmailAttribute1){
        payload.data.email.attributes.push({
          "DisplayName": "utm_campaign",
          "Name": "__AdditionalEmailAttribute1",
          "Value": $scope.newsletter.AdditionalEmailAttribute1,
          "Order": 1,
          "Channel": "email",
          "AttributeType": "AdditionalEmailAttribute"
        });
      }

      if($scope.newsletter.AdditionalEmailAttribute2){
        payload.data.email.attributes.push({
          "DisplayName": "Sleeknote",
          "Name": "__AdditionalEmailAttribute2",
          "Value": $scope.newsletter.AdditionalEmailAttribute2,
          "Order": 2,
          "Channel": "email",
          "AttributeType": "AdditionalEmailAttribute"
        });
      }

      if($scope.newsletter.AdditionalEmailAttribute3){
        payload.data.email.attributes.push({
          "DisplayName": "utm_campaign",
          "Name": "__AdditionalEmailAttribute3",
          "Value": $scope.newsletter.AdditionalEmailAttribute3,
          "Order": 3,
          "Channel": "email",
          "AttributeType": "AdditionalEmailAttribute"
        });
      }

      if($scope.newsletter.AdditionalEmailAttribute4){
        payload.data.email.attributes.push({
          "DisplayName": "utm_campaign",
          "Name": "__AdditionalEmailAttribute4",
          "Value": $scope.newsletter.AdditionalEmailAttribute4,
          "Order": 4,
          "Channel": "email",
          "AttributeType": "AdditionalEmailAttribute"
        });
      }

      if($scope.newsletter.AdditionalEmailAttribute5){
        payload.data.email.attributes.push({
          "DisplayName": "utm_campaign",
          "Name": "__AdditionalEmailAttribute5",
          "Value": $scope.newsletter.AdditionalEmailAttribute5,
          "Order": 5,
          "Channel": "email",
          "AttributeType": "AdditionalEmailAttribute"
        });
      }


      var sending = $http.post('/newsletters/upload', payload).then(function (success) {
        console.log('Success', success);
        $scope.newsletter_uploaded = true;
        notifications.showSuccess('Email ' + $scope.newsletter.name + ' oprettet.');
      }, function (err) {
        console.error(err);
        if (err.status === 400 && err.data.errorcode === 10006) {
          notifications.showError('Nyhedsbrev med samme navn eksisterer allerede');
        } else if (err.message) {
          notifications.showError(err.message);
        } else if (err.statusText) {
          notifications.showError(err.statusText);
        } else {
          notifications.showError('Fejl: ' + err);
        }
      });

      loadingSwitch.watch(sending, 'Sender');
    };


    $scope.showEmailHtml = function () {
      var preview = window.open();
      preview.document.open();
      preview.document.write($scope.newsletter.email_html);
      preview.document.close();
    };

    $scope.consoleLogData = function (data) {
      console.log(data);
    };
  }]);
