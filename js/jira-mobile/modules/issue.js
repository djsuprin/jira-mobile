JiraMobile.addModule('issue', (function () {

	var settings   = JiraMobile.getModule('settings'),
		utils      = JiraMobile.getModule('utils'),

        currentIssueKey,

		ISSUE_LINK = '/rest/api/latest/issue/';

    function showIssue() {
        $('#issue .ui-content').html('');
        // if issue key is set as URL parameter take its value otherwise look up in sessionStorage
        var hashIssueKey = window.location.hash.split("?");
        if (hashIssueKey.length > 1) {
            currentIssueKey = hashIssueKey[1];
        } else {
            currentIssueKey = sessionStorage['currentIssueKey'];
        }
        
        $('#issue').find('#issue-page-title').html(currentIssueKey);
        (function(currentIssueKey) {
            utils.showNotification();
            $.ajax({
                type: "GET",
                url: settings.getJiraLink() + ISSUE_LINK + currentIssueKey,
                dataType: 'json',
                success: [function (data) {
                    utils.hideNotification();
                }, displayIssue],
                error: function (data) {
                    utils.showNotification("Couldn't retrieve issue " + currentIssueKey + ". It may not exist.", true, 4000);
                }
            });
        })(currentIssueKey);
    }

    function displayIssue(data) {
        var issueFields = data['fields'];
        var issue = {
            summary: issueFields['summary'],
            issuetype: issueFields['issuetype']['name'],
            status: issueFields['status']['name'],
            priority: issueFields['priority']['name'],
            resolution: (issueFields['resolution'] !== undefined && issueFields['resolution'] !== null) ? 
                    issueFields['resolution']['name'] : 'Unresolved',
            description: issueFields['description'] !== null ? utils.wiki2html(issueFields['description']) : 'No description',
            assignee: issueFields['assignee'] !== null ? issueFields['assignee']['displayName'] : 'Unassigned',
            reporter: issueFields['reporter'] !== null ? issueFields['reporter']['displayName'] : 'Anonymous',
            affectedVersions: getButtonsHtmlFromArray(issueFields['versions']),
            fixVersions: getButtonsHtmlFromArray(issueFields['fixVersions']),
            components: getButtonsHtmlFromArray(issueFields['components']),
            labels: getButtonsHtmlFromArray(issueFields['labels']),
            created: new Date(issueFields['created']).toLocaleString(),
            updated: new Date(issueFields['updated']).toLocaleString(),
            duedate: new Date(issueFields['duedate']).toLocaleString(),
            estimated: issueFields['timetracking']['originalEstimate'],
            remaining: issueFields['timetracking']['remainingEstimate'],
            logged: issueFields['timetracking']['timeSpent']
        }

        var commentData = issueFields['comment'];
        if (commentData.total > 0) {
            issue.comments = [];
            var commentsArray = commentData['comments'];
            var comment, author;
            for (var i = commentData['startAt']; i < commentData['maxResults']; i++) {
                author = commentsArray[i]['author'];
                comment = {
                    avatar: author['avatarUrls']['48x48'],
                    author: author['displayName'],
                    created: new Date(commentsArray[i]['created']).toLocaleString(),
                    updated: new Date(commentsArray[i]['updated']).toLocaleString(),
                    body: utils.wiki2html(commentsArray[i]['body'])
                }
                issue.comments.push(comment);
            }
        }

        var issueHtml = Mustache.to_html($('#issue-page-content-tpl').html(), issue);
        $('#issue .ui-content').html(issueHtml);
        $('#issue-new-comment-form a').tap(function(e) {
            e.preventDefault();
            addComment();
        });
        $('#issue').trigger('create');
    }

    function getButtonsHtmlFromArray(elements) {
        if (typeof elements !== 'undefined' && elements !== null && elements.length > 0) {
            var $div = $('<div/>');
            for (var i = 0; i < elements.length; i++) {
            var name = (typeof elements[i] == 'string' || elements[i] instanceof String) ? elements[i] : elements[i]['name'];
            var $button = $('<a/>').attr({
                'href': '#'
            }).html(name).tap(function (e) {
                e.preventDefault();
            }).taphold(function(e) {
                console.log("edit");
                e.preventDefault();
            }).addClass('ui-btn ui-btn-inline');
            $div.append($button);
            }
            return $div.html();
        }
        return 'None';
    }

    function displayNewComment(data) {
        var comment = {
            author: data['author']['displayName'],
            avatar: data['author']['avatarUrls']['48x48'],
            updated: new Date(data['updated']).toLocaleString(),
            body: data['body']
        };
        var $newComment = $('<li/>').attr('data-icon', 'false').append(
            $('<a/>').attr('href', '#').append(
                    $('<img/>').attr('src', comment['avatar'])
                ).append(
                    $('<h2/>').html(comment['author'])
                ).append(
                    $('<p/>').html(comment['updated'])
                ).append(
                    $('<p/>').addClass('issue-comment-body').html(comment['body'])
                )
        );
        $('#issue-no-comment-message').hide();
        var $issueCommentsList = $('#issue-comments');
        $issueCommentsList.append($newComment);
        $issueCommentsList.listview('refresh');
        $('#issue-new-comment-field').val('');
    }

    function addComment() {
        var commentBody = $('#issue-new-comment-field').val();
        var jsonData = { body: commentBody };
        utils.showNotification();
        $.ajax({
            type: "POST",
            url: settings.getJiraLink() + ISSUE_LINK + currentIssueKey + '/comment',
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(jsonData),
            success: [function(data) {
                utils.showNotification("Comment was added.", true, 4000);
            }, displayNewComment],
            error: function (data) {
                utils.showNotification("Couldn't add new comment.", true, 4000);
            }
        });
    }

	return {
	    showIssue: showIssue,
        addComment: addComment
	};
})());