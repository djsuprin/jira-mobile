var Dashboard = (function () {

	var _context = null;

	return {
		init: function(context) {
			_context = context;
		},
		showDashboardPage: function() {
			var settings = _context.getModule("settings");
			var jiraLink = settings.getJiraLink();
			var authHeaderValue = settings.getAuthHeaderValue();
	        if (jiraLink == null || jiraLink == '' || authHeaderValue == null || authHeaderValue == '') {
	            $( "body" ).pagecontainer( "change", "#settings");
	        }
	    }
	};

})();