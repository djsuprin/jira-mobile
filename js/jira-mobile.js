    /*global localStorage: false, console: false, $: false */

    (function () {

        var DO_PROXY            = true,
            SECONDS_IN_WORKDAY  = 28800; // 8 hours workday
            // REST API links
            PROJECTS_LINK       = '/rest/api/latest/project',
            FILTERS_LINK        = '/rest/api/latest/filter/favourite',
            ISSUES_LINK         = '/rest/api/latest/search?jql=',
            ISSUE_LINK          = '/rest/api/latest/issue/',
            // Authentication settings
            jiraLink            = localStorage.getItem('jiraLink'),
            authHeaderValue     = localStorage.getItem('authHeaderValue'),
            // Variables containing current state of app components
            currentIssueKey     = '';

        $(document).on("pagecreate", '#dashboard', function () {
            if (jiraLink == null || jiraLink == '' || authHeaderValue == null || authHeaderValue == '') {
                $( "body" ).pagecontainer( "change", "#settings", { transition: "slide" });
            }
        });

        $(document).on('pagecreate', '#settings', loadSettings);

        $(document).on('pagecreate', '#projects', function (e) {

            $.ajax({
                type: "GET",
                url: getUrl(jiraLink + PROJECTS_LINK),
                dataType: 'json',
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', authHeaderValue);
                },
                success: function (data) {
                    if (DO_PROXY) {
                        data = data.contents
                    }
                    var $list = $('#projects-list');
                    $list.html('');
                    if (data == null || !(data instanceof Array)) return;
                    var projects = data;
                    for (var i = 0; i < projects.length; i++) {
                        var $a = $('<a/>').attr({
                            href: '#'
                        }).html(projects[i]['name']);
                        $list.append($('<li/>').html($a));
                    }
                    $list.listview('refresh');
                },
                error: function (data) {
                    console.log('Error');
                    console.log(data);
                }
            });
        });


        $(document).on('pagecreate', '#filters', function (e) {

            $.ajax({
                type: "GET",
                url: getUrl(jiraLink + FILTERS_LINK),
                dataType: 'json',
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', authHeaderValue);
                },
                success: function (data) {
                    if (DO_PROXY) {
                        data = data.contents
                    }
                    var $list = $('#filters-list');
                    $list.html('');
                    if (data == null) return;
                    var filters = data;
                    for (var i = 0; i < filters.length; i++) {
                        var filterName = filters[i]['name'];
                        var filterJQL = filters[i]['jql'];

                        var closure = function (filterName, filterJQL) {
                            var $a = $('<a/>').attr({
                                href: '#'
                            }).html(filterName).tap(function (e) {
                                e.preventDefault();
                                $('#filter-name').find('.ui-btn-text').html(filterName)
                                $('#jql-textarea').html(filterJQL);
                                //$.mobile.changePage('#issues');
                                $( "body" ).pagecontainer( "change", "#issues", { transition: "slide" });
                            });
                            $list.append($('<li/>').html($a));
                        }(filterName, filterJQL);

                    }
                    $list.listview('refresh');
                },
                error: function (data) {
                    console.log('Error');
                    console.log(data);
                }
            });
        });


        $(document).on('pagecreate', '#issues', function (e) {

            filterIssues();
        });


        $(document).on('pagecreate', '#issue', function (e) {
            $('#issue').find('#issue-page-title').html(currentIssueKey);
            $.ajax({
                type: "GET",
                url: getUrl(jiraLink + ISSUE_LINK + currentIssueKey),
                dataType: 'json',
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', authHeaderValue);
                },
                success: function (data) {
                    if (DO_PROXY) {
                        data = data.contents;
                    }
                    console.log("Issue:");
                    console.log(data);
                    var issueFields = data['fields'];
                    var issue = {
                        description: issueFields['description'] !== null ? issueFields['description'] : 'No description',
                        resolution: (issueFields['resolution'] !== undefined && issueFields['resolution'] !== null) ? issueFields['resolution']['name'] : 'Unresolved',
                        created: new Date(issueFields['created']).toLocaleString(),
                        updated: new Date(issueFields['updated']).toLocaleString(),
                        duedate: new Date(issueFields['duedate']).toLocaleString()
                    }

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
            
                    $('#issue-description').html(issue['description']);
                    $('#issue-created').html(issue['created']);
                    $('#issue-updated').html(issue['updated']);
                    $('#issue-due-date').html(issue['duedate']);
                    $('#issue-estimated').html(issueFields['timetracking']['originalEstimate']);
                    $('#issue-remaining').html(issueFields['timetracking']['remainingEstimate']);
                    $('#issue-logged').html(issueFields['timetracking']['timeSpent']);
                },
                error: function (data) {
                    console.log('Error');
                    console.log(data);
                }
            });
        });
        
        function createButtonsFromArray(elements, placeholderSelector) {
        if (elements !== null && elements.length > 0) {
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


        function filterIssues() {
            var $table = $('#issues-table');
            var $tableBody = $table.find('tbody');
            // escaping JQL twice because PHP proxy script unescapes GET params
            var jql = escape($('#jql-textarea').val());
            if (jql.trim() != '') {
                $.ajax({
                    type: "GET",
                    url: getUrl(jiraLink + ISSUES_LINK + jql),
                    dataType: 'json',
                    async: false,
                    //data: '{}',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', authHeaderValue);
                    },
                    success: function (data) {
                        if (DO_PROXY) {
                            data = data.contents
                        }
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
                            var closure = function (issue, $tableBody) {
                                var $key = $('<a/>').attr({
                                    'href': '#',
                                }).tap(function (e) {
                                    e.preventDefault();
                                    currentIssueKey = issue['key'];
                                    $( "body" ).pagecontainer( "change", "#issue", { transition: "slide" });
                                }).html(issue['key']);
                                var $summary = $('<a/>').attr({
                                    'href': '#',
                                }).tap(function (e) {
                                    e.preventDefault();
                                    currentIssueKey = issue['key'];
                                    $( "body" ).pagecontainer( "change", "#issue", { transition: "slide" });
                                }).html(issue['summary']);
                                var $tr = $('<tr/>')
                                    .append($('<td/>').html(issue['type']))
                                    .append($('<td/>').html($key))
                                    .append($('<td/>').html($summary))
                                    .append($('<td/>').html(issue['priority']))
                                    .append($('<td/>').html(issue['status']));
                                $tableBody.append($tr);
                            }(issue, $tableBody);
                        }
                        $table.table('refresh');
                    },
                    error: function (data) {
                        console.log('Error');
                        console.log(data);
                    }
                });
            } else {
                $tableBody.html('');
            }
        }


        $(document).ready(function () {
            // execute when page is loaded

            $('#save-settings-button').tap(saveSettings);

            $('#clear-credentials-button').tap(function (e) {
                e.preventDefault();
                localStorage.clear();
            });

            $('#filter-button').tap(function (e) {
                e.preventDefault();
                filterIssues();
            });

        });

        function getUrl(url) {
            if (DO_PROXY) {
                var proxyUrl = "proxy.php?url=" + escape(url);
                return proxyUrl;
            }
            return url;
        }
        
        function saveSettings(e) {
        e.preventDefault();
        jiraLink = $('#jira-link-field').val();
        var username = $('#username-field').val();
        var password = $('#password-field').val();
        authHeaderValue = get_auth_header_value(username, password);
        localStorage.setItem("jiraLink", jiraLink);
        localStorage.setItem("username", username);
        localStorage.setItem("password", password);
        localStorage.setItem("authHeaderValue", authHeaderValue);
        $( "body" ).pagecontainer( "change", "#projects", { transition: "slide" });
        }

        function loadSettings(e) {
            $('#jira-link-field').val(localStorage.getItem('jiraLink'));
            $('#username-field').val(localStorage.getItem('username'));
            $('#password-field').val(localStorage.getItem('password'));
        }

        function get_auth_header_value(username, password) {
            var tok = username + ':' + password;
            var hash = btoa(tok);
            return "Basic " + hash;
        }
        
        /*function getDaysAndWeeksByTimestamp(timestamp) {
            var days = (timestamp / SECONDS_IN_WORKDAY) | 0;
            var weeks = (days / 5) | 0;
            days -= weeks * 5;
            var daysAndweeks = weeks + 'w';
            if (days > 0) { daysAndweeks += ' ' + days + 'd'; }
            return daysAndweeks; 
        }*/

    }());