JiraMobile.addModule('issues', (function () {

	var settings    = JiraMobile.getModule('settings'),
		utils       = JiraMobile.getModule('utils'),

		ISSUES_LINK = '/rest/api/latest/search?jql=';

    function filterIssues() {
        // escaping JQL twice because PHP proxy script unescapes GET params
        var jql = escape($('#jql-textarea').val());
        console.log("JQL: " + jql);
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