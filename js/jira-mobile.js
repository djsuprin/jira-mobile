    /*global localStorage: false, console: false, $: false */

    (function () {

        var SECONDS_IN_WORKDAY      = 28800, // 8 hours workday
            // REST API links
            PROJECTS_LINK           = '/rest/api/latest/project',
            FILTERS_LINK            = '/rest/api/latest/filter/favourite',
            ISSUES_LINK             = '/rest/api/latest/search?jql=',
            ISSUE_LINK              = '/rest/api/latest/issue/',
            ISSUE_CREATEMETA_LINK   = '/rest/api/2/issue/createmeta?expand=projects.issuetypes.fields&projectKeys=ENS',
            FILTER_BY_ID_LINK       = '/rest/api/latest/filter',
            // Authentication settings
            jiraLink                = localStorage.getItem('jiraLink'),
            authHeaderValue         = localStorage.getItem('authHeaderValue'),
            // Variables containing current state of app components
            selectedFilter = null, /* {
                'filterName': '',
                'filterJQL': '',
                'filterID': ''
            },*/
            currentIssueKey     = '',
            notificationTimeoutId = 0;

        $(function() {
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

            $('#save-filter-button').tap(onSaveFilterButtonClick);

            $('#new-filter-button').tap(function (e) {
                clearFilter();
            });

            $( "#menu_panel" ).panel();
            $( "#menu-list" ).listview().enhanceWithin();
            $.mobile.defaultPageTransition = 'slide';
        });

        /*$(document).on("swiperight", '[data-role="page"]', function(e) {
            $( "#menu_panel" ).panel( "open" );
        });*/

        $(document).on( "pagecontainershow", function(e, ui) {
            var pageId = ui.toPage.attr("id");
            switch (pageId) {
                case "dashboard": showDashboardPage(); break;
                case "settings": loadSettings(); break;
                case "projects": showProjectsPage(); break;
                case "filters": showFilters(); break;
                case "issues": showIssues(); break;
                case "issue": showIssue(); break;
                case "issue-form": showIssueForm(); break;
            }
        });

        function showDashboardPage() {
            if (jiraLink == null || jiraLink == '' || authHeaderValue == null || authHeaderValue == '') {
                $( "body" ).pagecontainer( "change", "#settings");
            }
        }

        function getProjects(onSuccess, onError, onComplete) {
            cachedData = localStorage['projects'];
            if (typeof cachedData !== 'undefined') {
                console.log("Using cached data");
                console.log(cachedData);
                return cachedData;
            }
            $.ajax({
                type: "GET",
                url: jiraLink + PROJECTS_LINK,
                dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', authHeaderValue);
                },
                success: onSuccess,
                error: onError,
                complete: onComplete
            });
        }

        function showProjectsPage() {
            showNotification();
            var displayProjects = function (data) {
                // if not cached then cache it
                if (typeof localStorage['projects'] === 'undefined') localStorage.setItem('projects', data);
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
                hideNotification();
            };
            var displayError = function (data) {
                console.log('Error while retrieving projects.');
                console.log(data);
                hideNotification();
            }
            var data = getProjects(displayProjects, displayError);
            if (typeof data !== 'undefined') {
                displayProjects(data);
            }

        }

        function showFilters() {
            showNotification();
            $.ajax({
                type: "GET",
                url: jiraLink + FILTERS_LINK,
                dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', authHeaderValue);
                },
                success: function (data) {
                    var $list = $('#filters-list');
                    $list.html('');
                    if (data == null) return;
                    var filters = data;
                    for (var i = 0; i < filters.length; i++) {
                        var filterName = filters[i]['name'];
                        var filterJQL = filters[i]['jql'];
                        var filterID = filters[i]['id'];

                        var closure = function (filterName, filterJQL, filterID) {
                            var $a = $('<a/>').attr({
                                href: '#'
                            }).html(filterName).tap(function (e) {
                                e.preventDefault();
                                selectedFilter = {
                                    filterName: filterName,
                                    filterJQL: filterJQL,
                                    filterID: filterID
                                };
                                $( "body" ).pagecontainer( "change", "#issues");
                                
                            });
                            $list.append($('<li/>').html($a));
                        }(filterName, filterJQL, filterID);

                    }
                    $list.listview('refresh');
                },
                error: function (data) {
                    console.log('Error while retrieving filters.');
                    console.log(data);
                },
                complete: function (data) {
                    hideNotification();
                }
            });
        }

        function showIssues() {
            if (selectedFilter !== null) {
                $('#filter-name-field').val(selectedFilter.filterName);
                $('#jql-textarea').val(selectedFilter.filterJQL);
                $('#filter-name a').text(selectedFilter.filterName);    
            }
            $('#filter-collapsible').collapsible("expand");
            filterIssues();
        }

        function showIssue() {
            $('#issue').find('#issue-page-title').html(currentIssueKey);
            $('#issue-details-collapsible').collapsible("expand");
            showNotification();
            $.ajax({
                type: "GET",
                url: jiraLink + ISSUE_LINK + currentIssueKey,
                dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', authHeaderValue);
                },
                success: function (data) {
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

                    $('#issue-description').html(wiki2html(issue['description']));
                    $('#issue-created').html(issue['created']);
                    $('#issue-updated').html(issue['updated']);
                    $('#issue-due-date').html(issue['duedate']);
                    $('#issue-estimated').html(issueFields['timetracking']['originalEstimate']);
                    $('#issue-remaining').html(issueFields['timetracking']['remainingEstimate']);
                    $('#issue-logged').html(issueFields['timetracking']['timeSpent']);
                    hideNotification();
                },
                error: function (data) {
                    console.log('Error while retrieving issue info.');
                    console.log(data);
                    hideNotification();
                }
            });
        }

        function showIssueForm() {
            showNotification();
            var displayError = function (data) {
                console.log('Error while retrieving issue create metadata.');
                console.log(data);
                hideNotification();
            };
            var data = getProjects(displayIssueForm, displayError);
            if (typeof data !== 'undefined') {
                displayIssueForm(data);
            }
        }

        function displayIssueForm(data) {
            // TODO: get project id from data
            $.ajax({
                type: "GET",
                url: jiraLink + ISSUE_CREATEMETA_LINK,
                dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', authHeaderValue);
                },
                success: function (data) {
                    localStorage.setItem(url, JSON.stringify(data));
                    console.log(data);
                },
                error: function (data) {
                    console.log('Error while retrieving issues.');
                    console.log(data);
                },
                complete: function (data) {
                    hideNotification();
                }
            });
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

        function filterIssues() {
            var $table = $('#issues-table');
            var $tableBody = $table.find('tbody');
            // escaping JQL twice because PHP proxy script unescapes GET params
            var jql = escape($('#jql-textarea').val());
            if (jql.trim() != '') {
                showNotification();
                $.ajax({
                    type: "GET",
                    url: jiraLink + ISSUES_LINK + jql,
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', authHeaderValue);
                    },
                    success: function (data) {
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
                                    currentIssueKey = issueKey;
                                    $( "body" ).pagecontainer( "change", "#issue" );
                                });
                            })(templateData.issues[i].key);
                        }
                        $table.table('refresh');
                    },
                    error: function (data) {
                        console.log('Error while retrieving issues.');
                        console.log(data);
                    },
                    complete: function (data) {
                        hideNotification();
                    }
                });
            } else {
                $tableBody.html('');
            }
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
            $( "body" ).pagecontainer( "change", "#projects");
        }

        function onSaveFilterButtonClick(e) {
            var filterName = $('#filter-name-field').val().trim();
            if (filterName === '') {
                showNotification("Filter name is not specified.", true, 4000);
                return;
            }
            var filterJQL = $('#jql-textarea').val().trim();
            if (filterJQL === '') {
                showNotification("JQL is not specified.", true, 4000);
                return;
            }
            // TODO: send ajax request to check if filter with such name exists. If not then save otherwise save as.
            showNotification();
            if (selectedFilter !== null) {
                updateFilter(filterName, filterJQL, selectedFilter.filterID);
            } else {
                createFilter(filterName, filterJQL);
            }
        }

        function createFilter(filterName, filterJQL) {
            $.ajax({
                type: "POST",
                url: jiraLink + FILTER_BY_ID_LINK,
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: {
                    "name": filterName,
                    "jql": filterJQL,
                    "favourite": true
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', authHeaderValue);
                },
                success: function (data, status, xhr) {
                    console.log(data);
                    if (xhr.status - xhr.status % 200 == 200) {
                        showNotification("Filter was created.", true, 4000);
                    } else {
                        showNotification("Couldn't create filter.", true, 4000);
                    }
                },
                error: function (data) {
                    console.log('Error while creating new filter.');
                    console.log(data);
                    hideNotification();
                }
            });
        }

        function updateFilter(filterName, filterJQL, filterID) {
            $.ajax({
                type: "PUT",
                url: jiraLink + FILTER_BY_ID_LINK + '/' + filterID,
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: {
                    "name": filterName,
                    "jql": filterJQL,
                    "favourite": true
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', authHeaderValue);
                },
                success: function (data, status, xhr) {
                    console.log(status);
                    console.log(data);
                    if (xhr.status - xhr.status % 200 == 200) {
                        selectedFilter = {
                            filterName: filterName,
                            filterJQL: filterJQL,
                            filterID: filterID
                        };
                        showNotification("Filter was updated.", true, 4000);
                    } else if (xhr.status == 400) {
                        showNotification("Couldn't update filter.", true, 4000);
                    }
                },
                error: function (data) {
                    console.log('Error while updating filter.');
                    console.log(data);
                    hideNotification();
                }
            });
        }

        function clearFilter() {
            $('#filter-name-field').val('');
            $('#jql-textarea').val('');
            $('#filter-name a').text("New filter");
            selectedFilter = null;
            filterIssues();
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

        // TODO: need to convert wiki content (issue description and comments) to html
        function wiki2html(wiki) {
            // replace line endings
            return wiki.replace(/\n/g, "<br />")
                .replace(/\[(.*)|(html.*)\]/g, function(str) {
                    var temp = str.split('|');
                    var text = temp[0].substring(1);
                    var href = temp[1].substring(0, temp[1].lastIndexOf(']'));
                    return '<a href="' + href + '">' + text + '</a>';
                });
        }

        function showNotification(text, textonly, timeout) {
            text = typeof text !== 'undefined' ? text : "Loading";
            textonly = typeof textonly !== 'undefined' ? textonly : false;
            timeout = typeof timeout !== 'undefined' ? timeout : false;

            clearTimeout(notificationTimeoutId);

            var options = {
                theme: "b",
                text: text,
                textVisible: true,
                textonly: textonly
            };

            $.mobile.loading( "show", options);
            if (timeout !== false) {
                notificationTimeoutId = setTimeout(function() {
                    $.mobile.loading( "hide" );
                }, timeout);
            }
        }

        function hideNotification() {
            $.mobile.loading( "hide" );
        }

        /*function checkConnectivity() {
            if (!navigator.onLine) {
                // TODO: show banner in the bottom of the page

            }
        }*/
        
        /*function getDaysAndWeeksByTimestamp(timestamp) {
            var days = (timestamp / SECONDS_IN_WORKDAY) | 0;
            var weeks = (days / 5) | 0;
            days -= weeks * 5;
            var daysAndweeks = weeks + 'w';
            if (days > 0) { daysAndweeks += ' ' + days + 'd'; }
            return daysAndweeks; 
        }*/

    }());