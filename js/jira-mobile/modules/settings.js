JiraMobile.addModule('settings', (function () {

	var utils 			= JiraMobile.getModule('utils'),
		jiraLink        = localStorage.getItem('jiraLink'),

        SESSION_LINK = '/rest/auth/latest/session',
        USER_LINK = '/rest/api/latest/user';

    $(function() {
	    $('#save-settings-button').tap(function (e) {
	        e.preventDefault();
	        saveSettings();
	    });

	    $('#clear-cached-data-button').tap(function (e) {
	        e.preventDefault();
	        clearCache();
	    });

	    $('#is-anonymous-slider').change(function (e) {
	    	var state = $(this).val();
	    	if (state === 'on') {
	    		$('#username-field').textinput('disable');
	    		$('#password-field').textinput('disable');
	    	} else {
	    		$('#username-field').textinput('enable');
	    		$('#password-field').textinput('enable');
	    	}
	    });
	});

    function clearCache() {
        sessionStorage.clear();
        utils.showNotification("Cache is cleared.", true, 4000);
    }

    function getJiraLink() {
		return localStorage['jiraLink'];
	}

    function getUsername() {
        return localStorage['username'];
    }

    function getDisplayName() {
        return localStorage['displayName'];
    }

    function getBigAvatar() {
        return localStorage['bigAvatar'];
    }

    function getSmallAvatar() {
        return localStorage['smallAvatar'];
    }

    function getEmailAddress() {
        return localStorage['emailAddress'];
    }

    function loadSettings() {
    	var jiraLink = localStorage.getItem('jiraLink');
    	var username = localStorage.getItem('username');
    	if (jiraLink !== null) {
        	$('#jira-link-field').val(jiraLink);
    	}
    	if (username !== null) {
        	$('#username-field').val(username);
    	}
    }

	function validateSettings(jiraLink, username, password) {
		var messages = [];
		if (jiraLink === '') {
        	messages.push("JIRA base URL is missing.");
        }
        if (username === '') {
        	messages.push("Username is missing.");
        }
        if (password === '') {
        	messages.push("Password is missing.");
        }
        if (messages.length > 0) {
        	var resultMessage = messages.join("\r\n");
        	utils.showNotification(resultMessage, true, 4000);
        	return false;
        }
        return true;
	}

	function createSession(jiraLink, username, password) {
		var jsonData = { 
			username: username,
			password: password
		};
		utils.showNotification();
		$.ajax({
            type: "POST",
            url: jiraLink + SESSION_LINK,
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
   			data: JSON.stringify(jsonData),
            success: function (data) {
            	sessionStorage.clear();
            	localStorage.clear();
                localStorage.setItem(data['name'], data['value']);
                localStorage.setItem("jiraLink", jiraLink);
                localStorage.setItem("username", username);
                $.ajax({
                    type: "GET",
                    url: jiraLink + USER_LINK + '?username=' + username,
                    dataType: 'json',
                    success: function (data) {
                        console.log("Saving profile data...");
                        utils.hideNotification();
                        localStorage.setItem("displayName", data['displayName']);
                        localStorage.setItem("emailAddress", data['emailAddress']);
                        localStorage.setItem("bigAvatar", data['avatarUrls']['48x48']);
                        localStorage.setItem("smallAvatar", data['avatarUrls']['24x24']);
                        console.log(localStorage);
                        $( "body" ).pagecontainer( "change", "#filters");
                    },
                    error: function (data) {
                        console.log("Couldn't get profile data:");
                        console.log(data);
                        utils.hideNotification();
                        deleteSession(localStorage['jiraLink']);
                    }
                });
            },
            error: function (data) {
                var message;
                switch (data.status) {
                    case 0: message = "Connection error. Please check your network connection."; break;
                    case 401: message = "Invalid username or password."; break;
                    case 403: message = "Credentials are OK but user is not allowed to log in."; break;
                    case 404: message = "JIRA base URL is invalid."; break;
                    default: message = "Couldn't connect. Unknown error.";
                }
            	console.log("Couldn't create new session:");
            	console.log(JSON.stringify(data));
                utils.showNotification(message, true, 4000);
            }
        });
	}

	function deleteSession(jiraLink) {
    	utils.showNotification();
		$.ajax({
            type: "DELETE",
            url: jiraLink + SESSION_LINK,
            dataType: 'json',
            complete: function(data) {
                utils.hideNotification();
                sessionStorage.clear();
                localStorage.clear();
                localStorage.setItem("jiraLink", jiraLink);
                $( "body" ).pagecontainer( "change", "#filters");
            }
        });
	}

	function saveSettings() {
        var jiraLink = $('#jira-link-field').val().trim();
        var username = $('#username-field').val().trim();
        var password = $('#password-field').val();
        var isAnonymousFlipswitchState =  $('#is-anonymous-slider').val();
        if (isAnonymousFlipswitchState === 'off') {
        	if (!validateSettings(jiraLink, username, password)) {
	        	return;
	        }
			createSession(jiraLink, username, password);
        } else {
        	if (jiraLink === '') {
        		utils.showNotification("JIRA base URL is missing.", true, 4000);
        		return;
        	}
        	deleteSession(jiraLink);
        }
    }

	return {
		getJiraLink: getJiraLink,
        getUsername: getUsername,
        getDisplayName: getDisplayName,
        getBigAvatar: getBigAvatar,
        getSmallAvatar: getSmallAvatar,
        getEmailAddress: getEmailAddress,
		saveSettings: saveSettings,
		loadSettings: loadSettings
	};

})()); 