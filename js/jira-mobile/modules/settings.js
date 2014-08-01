JiraMobile.addModule('settings', (function () {

	var utils 			= JiraMobile.getModule('utils'),
		jiraLink        = localStorage.getItem('jiraLink'),

        SESSION_LINK = '/rest/auth/latest/session';

    $(function() {
	    $('#save-settings-button').tap(function (e) {
	        e.preventDefault();
	        saveSettings();
	    });

	    $('#clear-cached-data-button').tap(function (e) {
	        e.preventDefault();
	        sessionStorage.clear();
	        localStorage.clear();
	        utils.showNotification("Cache is cleared.", true, 4000);
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

    function getJiraLink() {
		return localStorage['jiraLink'];
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

	function saveSettings() {
        var jiraLink = $('#jira-link-field').val().trim();
        var username = $('#username-field').val().trim();
        var password = $('#password-field').val();
        if (!validateSettings(jiraLink, username, password)) {
        	return;
        }
        var isAnonymousFlipswitchState =  $('#is-anonymous-slider').val();
        if (isAnonymousFlipswitchState === 'off') {
			(function(jiraLink, username, password) {
				var jsonData = { 
					username: username,
					password: password
				};
				$.ajax({
		            type: "POST",
		            url: jiraLink + SESSION_LINK,
		            dataType: 'json',
		            contentType: "application/json; charset=utf-8",
           			data: JSON.stringify(jsonData),
		            beforeSend: function (xhr) {
		            	utils.showNotification();
		                //xhr.setRequestHeader('Authorization', authHeaderValue);
		            },
		            success: function (data) {
		            	utils.hideNotification();
		            	localStorage.clear();
		            	localStorage.setItem(data['name'], data['value']);
				        localStorage.setItem("jiraLink", jiraLink);
				        localStorage.setItem("username", username);
				        saveProfile();
				        $( "body" ).pagecontainer( "change", "#filters");
		            },
		            error: function (data) {
		            	console.log("Couldn't create new session:");
		            	console.log(JSON.stringify(data));
		                utils.showNotification("Settings were not saved. JIRA base URL, username or password is incorrect.", true, 4000);
		            }
		        });
			})(jiraLink, username, password);
        } else {
        	localStorage.clear();
        	localStorage.setItem("jiraLink", jiraLink);
        }
    }

    function saveProfile(data) {
    	// TODO: save displayName, emailAddress, timezone, etc.
    	/*utils.showNotification("User is authenticated. Settings are saved.", true, 4000);
    	localStorage.setItem("displayName", data['displayName']);
        localStorage.setItem("emailAddress", data['emailAddress']);
        localStorage.setItem("avatar16", data['avatarUrls']['16x16']);
        localStorage.setItem("avatar48", data['avatarUrls']['48x48']);*/
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

	return {
		getJiraLink: getJiraLink,
		saveSettings: saveSettings,
		loadSettings: loadSettings
	};

})()); 