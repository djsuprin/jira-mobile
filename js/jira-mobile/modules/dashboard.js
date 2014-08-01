JiraMobile.addModule('dashboard', (function () {

	var settings = JiraMobile.getModule('settings');

	return {
		showDashboard: function() {
			var jiraLink = settings.getJiraLink();
	        if (jiraLink == null || jiraLink === '') {
	            $( "body" ).pagecontainer( "change", "#settings");
	        }
	    }
	};

})());