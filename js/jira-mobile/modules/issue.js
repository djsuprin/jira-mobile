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
            affectedVersions: issueFields['versions'],
            fixVersions: issueFields['fixVersions'],
            components: issueFields['components'],
            labels: issueFields['labels'],
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
                console.log('Author' + i);
                console.log(author);
                comment = {
                    author: typeof author !== 'undefined' ? author['displayName'] : 'Anonymous',
                    created: new Date(commentsArray[i]['created']).toLocaleString(),
                    updated: new Date(commentsArray[i]['updated']).toLocaleString(),
                    body: utils.wiki2html(commentsArray[i]['body'])
                }
                if (typeof author !== 'undefined') {
                    comment.avatar = author['avatarUrls']['48x48'];
                }
                issue.comments.push(comment);
            }
        }

        var issueHtml = Mustache.to_html($('#issue-page-content-tpl').html(), issue);
        $('#issue .ui-content').html(issueHtml);

        var createOnIssueButtonClickHandler = function(jql) {
            return function(e) {
                e.preventDefault();
                var selectedFilter = {
                    filterJQL: jql.replace('%%%', $(this).html())
                };
                sessionStorage.setItem('selectedFilter', JSON.stringify(selectedFilter));
                $( "body" ).pagecontainer( "change", "#issues" );
            };
        };

        $('.affected-versions-button').tap( createOnIssueButtonClickHandler('affectedVersion="%%%"') );
        $('.fix-versions-button').tap( createOnIssueButtonClickHandler('fixVersion="%%%"') );
        $('.components-button').tap( createOnIssueButtonClickHandler('component="%%%"') );
        $('.labels-button').tap( createOnIssueButtonClickHandler('labels="%%%"') );

        $('#issue-new-comment-form a').tap(function(e) {
            e.preventDefault();
            addComment();
        });
        $('#issue').trigger('create');
    }

    function displayNewComment(data) {
        var comment = {
            author: typeof data['author'] !== 'undefined' ? data['author']['displayName'] : 'Anonymous',
            updated: new Date(data['updated']).toLocaleString(),
            body: data['body']
        };
        if (typeof data['author'] !== 'undefined') {
            comment.avatar = data['author']['avatarUrls']['48x48'];
        }
        var newCommentHtml = Mustache.to_html($('#issue-comment-tpl').html(), comment);
        var $issueCommentsList = $('#issue-comments');
        $issueCommentsList.append(newCommentHtml);
        $issueCommentsList.listview('refresh');
        $('#issue-no-comment-message').hide();
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
                console.log("New comment:");
                console.log(JSON.stringify(data));
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