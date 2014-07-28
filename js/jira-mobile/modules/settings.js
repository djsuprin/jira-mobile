JiraMobile.addModule('settings', (function () {

	var jiraLink        = localStorage.getItem('jiraLink'),
        authHeaderValue = localStorage.getItem('authHeaderValue');

    $(function() {
	    $('#save-settings-button').tap(function (e) {
	        e.preventDefault();
	        saveSettings();
	    });

	    $('#clear-cached-data-button').tap(function (e) {
	        e.preventDefault();
	        localStorage.clear();
	    });
	});

	function makeAuthHeaderValue(username, password) {
        var tok = username + ':' + password;
        var hash = btoa(tok);
        return "Basic " + hash;
    }

    function getJiraLink() {
		return jiraLink;
	}

	function getAuthHeaderValue() {
		return authHeaderValue;
	}

	function saveSettings() {
        jiraLink = $('#jira-link-field').val();
        var username = $('#username-field').val();
        var password = $('#password-field').val();
        authHeaderValue = makeAuthHeaderValue(username, password);
        localStorage.setItem("jiraLink", jiraLink);
        localStorage.setItem("username", username);
        localStorage.setItem("authHeaderValue", authHeaderValue);
        $( "body" ).pagecontainer( "change", "#projects");
    }

    function loadSettings() {
        $('#jira-link-field').val(localStorage.getItem('jiraLink'));
        $('#username-field').val(localStorage.getItem('username'));
    }

	return {
		getJiraLink: getJiraLink,
		getAuthHeaderValue: getAuthHeaderValue,
		saveSettings: saveSettings,
		loadSettings: loadSettings
	};

})()); 