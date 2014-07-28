JiraMobile.addModule('issues', (function () {

	var settings          = JiraMobile.getModule('settings'),
		utils             = JiraMobile.getModule('utils'),

		ISSUES_LINK       = '/rest/api/latest/search?jql=',
        FILTER_BY_ID_LINK = '/rest/api/latest/filter';

    $(function() {
        $('#filter-button').tap(function (e) {
            e.preventDefault();
            filterIssues();
        });

        $('#save-filter-button').tap(onSaveFilterButtonClick);

        $('#new-filter-button').tap(function (e) {
            clearFilter();
        });
    });

    function filterIssues() {
        // escaping JQL twice because PHP proxy script unescapes GET params
        var jql = escape($('#jql-textarea').val());
        if (jql.trim() != '') {
            if (typeof localStorage[jql] !== 'undefined') {
                displayIssues(JSON.parse(localStorage[jql]));
                return;
            }
            utils.showNotification();
            (function(jql) {
                $.ajax({
                    type: "GET",
                    url: settings.getJiraLink() + ISSUES_LINK + jql,
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', settings.getAuthHeaderValue());
                    },
                    success: [function (data) {
                        localStorage.setItem(jql, JSON.stringify(data));
                    }, displayIssues],
                    error: function (data) {
                        console.log('Error while retrieving issues.');
                        console.log(data);
                    },
                    complete: function (data) {
                        utils.hideNotification();
                    }
                });
            })(jql);
        } else {
            $('#issues-table > tbody').html('');
        }
    }

    function clearFilter() {
        $('#filter-name-field').val('');
        $('#jql-textarea').val('');
        $('#filter-name a').text("New filter");
        localStorage.removeItem("selectedFilter");
        filterIssues();
    }

    function onSaveFilterButtonClick(e) {
        var filterName = $('#filter-name-field').val().trim();
        if (filterName === '') {
            utils.showNotification("Filter name is not specified.", true, 4000);
            return;
        }
        var filterJQL = $('#jql-textarea').val().trim();
        if (filterJQL === '') {
            utils.showNotification("JQL is not specified.", true, 4000);
            return;
        }
        // TODO: send ajax request to check if filter with such name exists. If not then save otherwise save as.
        var selectedFilter = localStorage['selectedFilter'];
        if (typeof selectedFilter !== 'undefined') {
            console.log("Updating existing filter...");
            //updateFilter(filterName, filterJQL, selectedFilter.filterID);
        } else {
            createFilter(filterName, filterJQL);
            console.log("Creating new filter...");
        }
    }

    function createFilter(filterName, filterJQL) {
        var jsonData = {
            "name": filterName,
            "jql": filterJQL,
            "favourite": true
        };
        $.ajax({
            type: "POST",
            url: settings.getJiraLink() + FILTER_BY_ID_LINK,
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(jsonData),
            beforeSend: function (xhr) {
                utils.showNotification();
                xhr.setRequestHeader('Authorization', settings.getAuthHeaderValue());
            },
            success: function (data, status, xhr) {
                console.log(data);
                if (xhr.status - xhr.status % 200 == 200) {
                    utils.showNotification("Filter was created.", true, 4000);
                } else {
                    utils.showNotification("Couldn't create filter.", true, 4000);
                }
            },
            error: function (data) {
                console.log('Error while creating new filter.');
                console.log(data);
                utils.hideNotification();
            }
        });
    }

    function displayIssues(data) {
        var $table = $('#issues-table');
        var $tableBody = $table.find('tbody');
        var templateData = { issues : [] };
        $tableBody.html('');
        var issues = data['issues'];
        for (var i = 0; i < issues.length; i++) {
            var issue = {
                'type': issues[i]['fields']['issuetype'] == null ? null : issues[i]['fields']['issuetype']['name'],
                'key': issues[i]['key'],
                'summary': issues[i]['fields']['summary'],
                'priority': issues[i]['fields']['priority'] == null ? null : issues[i]['fields']['priority']['name'],
                'status': issues[i]['fields']['status'] == null ? null : issues[i]['fields']['status']['name']
            };
            templateData.issues.push(issue);
        }
        var tableBodyHtml = Mustache.to_html($('#issues-table-rows-tpl').html(), templateData);
        $tableBody.html(tableBodyHtml);
        for (var i = 0; i < templateData.issues.length; i++) {
            (function (issueKey) {
                var row = $("#issues-table > tbody > tr").get(i);
                $(row).find("a").tap(function (e) {
                    e.preventDefault();
                    localStorage.setItem('currentIssueKey', issueKey);
                    $( "body" ).pagecontainer( "change", "#issue" );
                });
            })(templateData.issues[i].key);
        }
        $table.table('refresh');
    }

    function showIssues() {
        var selectedFilter = localStorage['selectedFilter'];
        if (typeof selectedFilter !== 'undefined') {
            selectedFilter = JSON.parse(selectedFilter);
            $('#filter-name-field').val(selectedFilter.filterName);
            $('#jql-textarea').val(selectedFilter.filterJQL);
            $('#filter-name a').text(selectedFilter.filterName);    
        }
        $('#filter-collapsible').collapsible("expand");
        filterIssues();
    }

	return {
	    showIssues: showIssues
	};
})());