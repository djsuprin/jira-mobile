var Settings = (function () {

	var jiraLink = '',
		authHeaderValue = '';

	function makeAuthHeaderValue(username, password) {
        var tok = username + ':' + password;
        var hash = btoa(tok);
        return "Basic " + hash;
    }

	return {
		getJiraLink: function() {
			return jiraLink;
		},

		getAuthHeaderValue: function() {
			return authHeaderValue;
		},

		saveSettings: function() {
	        jiraLink = $('#jira-link-field').val();
	        var username = $('#username-field').val();
	        var password = $('#password-field').val();
	        authHeaderValue = makeAuthHeaderValue(username, password);
	        localStorage.setItem("jiraLink", jiraLink);
	        localStorage.setItem("username", username);
	        localStorage.setItem("authHeaderValue", authHeaderValue);
	        $( "body" ).pagecontainer( "change", "#projects");
	    },

	    loadSettings: function() {
	        $('#jira-link-field').val(localStorage.getItem('jiraLink'));
	        $('#username-field').val(localStorage.getItem('username'));
	        $('#password-field').val(localStorage.getItem('password'));
	    }
	};

})(); 