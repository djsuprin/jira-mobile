JiraMobile.addModule('dashboard', (function () {

	var settings = JiraMobile.getModule('settings');

	return {
		showDashboard: function() {
			var jiraLink = settings.getJiraLink();
			var authHeaderValue = settings.getAuthHeaderValue();
	        if (jiraLink == null || jiraLink === '' || authHeaderValue == null || authHeaderValue === '') {
	            $( "body" ).pagecontainer( "change", "#settings");
	        }
	    }
	};

})());