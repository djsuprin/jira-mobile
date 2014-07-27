JiraMobile.addModule('issue', (function () {

	var settings   = JiraMobile.getModule('settings'),
		utils      = JiraMobile.getModule('utils'),

		ISSUE_LINK = '/rest/api/latest/issue/';

    function showIssue() {
        $('#issue').find('#issue-page-title').html(currentIssueKey);
        if (typeof localStorage[currentIssueKey] !== 'undefined') {
            console.log(localStorage[currentIssueKey]);
            displayIssue(JSON.parse(localStorage[currentIssueKey]));
            return;
        }
        utils.showNotification();
        (function(currentIssueKey) {
            $.ajax({
                type: "GET",
                url: settings.getJiraLink() + ISSUE_LINK + currentIssueKey,
                dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', settings.getAuthHeaderValue());
                },
                success: [function (data) {
                    localStorage.setItem(currentIssueKey, JSON.stringify(data));
                }, displayIssue],
                error: function (data) {
                    console.log('Error while retrieving issue info.');
                    console.log(data);
                },
                complete: function (data) {
                    utils.hideNotification();
                }
            });
        })(currentIssueKey);
    }

    function displayIssue(data) {
        var issueFields = data['fields'];
        var issue = {
            description: issueFields['description'] !== null ? issueFields['description'] : 'No description',
            resolution: (issueFields['resolution'] !== undefined && issueFields['resolution'] !== null) ? 
                    issueFields['resolution']['name'] : 'Unresolved',
            created: new Date(issueFields['created']).toLocaleString(),
            updated: new Date(issueFields['updated']).toLocaleString(),
            duedate: new Date(issueFields['duedate']).toLocaleString()
        }

        $('#issue-summary').html(issueFields['summary']);
        $('#issue-type').html(issueFields['issuetype']['name']);
        $('#issue-status').html(issueFields['status']['name']);
        $('#issue-resolution').html(issue['resolution']);
        $('#issue-priority').html(issueFields['priority']['name']);
        $('#issue-assignee').html(issueFields['assignee']['displayName']);
        $('#issue-reporter').html(issueFields['reporter']['displayName']);

        createButtonsFromArray(issueFields['versions'], '#issue-affects-versions');
        createButtonsFromArray(issueFields['fixVersions'], '#issue-fix-versions');
        createButtonsFromArray(issueFields['components'], '#issue-components');
        createButtonsFromArray(issueFields['labels'], '#issue-labels');

        $('#issue-description').html(utils.wiki2html(issue['description']));
        $('#issue-created').html(issue['created']);
        $('#issue-updated').html(issue['updated']);
        $('#issue-due-date').html(issue['duedate']);
        $('#issue-estimated').html(issueFields['timetracking']['originalEstimate']);
        $('#issue-remaining').html(issueFields['timetracking']['remainingEstimate']);
        $('#issue-logged').html(issueFields['timetracking']['timeSpent']);
    }

    function createButtonsFromArray(elements, placeholderSelector) {
        if (typeof elements !== 'undefined' && elements !== null && elements.length > 0) {
            var $div = $('<div/>');
            for (var i = 0; i < elements.length; i++) {
            var name = (typeof elements[i] == 'string' || elements[i] instanceof String) ? elements[i] : elements[i]['name'];
            var $button = $('<a/>').attr({
                'data-role': 'button',
                'data-inline': true,
                'data-mini': true,
                'href': '#'
            }).html(name).tap(function (e) {
                e.preventDefault();
            }).taphold(function(e) {
                console.log("edit");
                e.preventDefault();
            }).addClass('ui-btn ui-btn-inline ui-mini');
            $div.append($button);
            }
            $(placeholderSelector).html($div);
        } else {
            $(placeholderSelector).html('None');
        }
    }

	return {
	    showIssue: showIssue
	};
})());