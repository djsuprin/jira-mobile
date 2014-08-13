JiraMobile.addModule('issue', (function () {

	var settings   = JiraMobile.getModule('settings'),
		utils      = JiraMobile.getModule('utils'),

        currentIssueKey,

		ISSUE_LINK = '/rest/api/latest/issue/';

    $(function() {
        $('#issue-add-watcher-form').submit(function(e) {
            e.preventDefault();
            addWatcher();
        });
    });

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
        };

        var commentData = issueFields['comment'];
        if (commentData.total > 0) {
            issue.comments = [];
            var commentsArray = commentData['comments'];
            var comment, author;
            for (var i = commentData['startAt']; i < commentData['maxResults']; i++) {
                author = commentsArray[i]['author'];
                comment = {
                    author: typeof author !== 'undefined' ? author['displayName'] : 'Anonymous',
                    created: new Date(commentsArray[i]['created']).toLocaleString(),
                    updated: new Date(commentsArray[i]['updated']).toLocaleString(),
                    body: utils.wiki2html(commentsArray[i]['body'])
                };
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

    function showWatchersList() {
        utils.showNotification();
        $.ajax({
            type: "GET",
            url: settings.getJiraLink() + ISSUE_LINK + currentIssueKey + '/watchers',
            dataType: 'json',
            success: [function (data) {
                utils.hideNotification();
            }, displayWatchersList],
            error: function (data) {
                utils.showNotification("Couldn't retrieve watchers list.", true, 4000);
            }
        });
    }

    function displayWatchersList(data) {
        var templateData = {
            watchers: []
        };
        for (var i = 0; i < data['watchers'].length; i++) {
            templateData.watchers.push({
                displayName: data['watchers'][i]['displayName'],
                name: data['watchers'][i]['name'],
                avatar: data['watchers'][i]['avatarUrls']['48x48']
            });
        }
        var watchersListHtml = Mustache.to_html($('#issue-watchers-list-tpl').html(), templateData);
        var $issueWatchersList = $('#issue-watchers-list');
        $issueWatchersList.html(watchersListHtml);

        // add remove watcher handlers
        $('.remove-issue-watcher-button').tap(onRemoveIssueWatcherButtonTap);

        $issueWatchersList.listview('refresh');
    }

    function onRemoveIssueWatcherButtonTap(e) {
        e.preventDefault();
        removeWatcher($(this).prev().find('.issue-watcher-name').first().html(), $(this).parent());
    }

    function addWatcher() {
        utils.showNotification();
        var jsonData = "\"" + settings.getUsername() + "\"";
        $.ajax({
            type: "POST",
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: jsonData,
            url: settings.getJiraLink() + ISSUE_LINK + currentIssueKey + '/watchers',
            success: function(data) {
                var watcher = {
                    name: settings.getUsername(),
                    displayName: settings.getDisplayName(),
                    avatar: settings.getBigAvatar()
                };
                var newWatcherHtml = Mustache.to_html($('#issue-watchers-list-element-tpl').html(), watcher);
                var $issueWatchersList = $('#issue-watchers-list');
                $issueWatchersList.append(newWatcherHtml);
                $issueWatchersList.find('.remove-issue-watcher-button').last().tap(onRemoveIssueWatcherButtonTap);
                $issueWatchersList.listview('refresh');
                utils.showNotification("Watcher was added.", true, 4000);
            },
            error: function (data) {
                utils.showNotification("Couldn't add watcher.", true, 4000);
                console.log(data);
            }
        });
    }

    function removeWatcher(name, $issueWatchersListElement) {
        utils.showNotification();
        $.ajax({
            type: "DELETE",
            url: settings.getJiraLink() + ISSUE_LINK + currentIssueKey + '/watchers?username=' + name,
            success: function(data) {
                $issueWatchersListElement.remove();
                utils.showNotification("Watcher was removed.", true, 4000);
            },
            error: function (data) {
                utils.showNotification("Couldn't remove watcher.", true, 4000);
                console.log(JSON.stringify(data));
            }
        });
    }

	return {
	    showIssue: showIssue,
        addComment: addComment,
        showWatchersList: showWatchersList
	};
})());