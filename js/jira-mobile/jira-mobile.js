/*global localStorage: false, console: false, $: false */

var JiraMobile = (function () {

	var thisModule = this;
	var modules = {};

	return {
		getModule: function(name) {
			if (typeof modules[name] !== 'undefined') {
				return modules[name];
			}
		},

		init: function() {
			modules.utils = Utils;
			modules.settings = Settings;
			modules.dashboard = Dashboard;
			modules.filters = Filters;

			modules.dashboard.init(thisModule);
			modules.filters.init(thisModule);
		}
	};

})();

(function() {
	JiraMobile.init();

	$('#save-settings-button').tap(function (e) {
        e.preventDefault();
        JiraMobile.getModule("settings").saveSettings();
    });

    $('#clear-cached-data-button').tap(function (e) {
        e.preventDefault();
        localStorage.clear();
    });

    $('#filter-button').tap(function (e) {
        e.preventDefault();
        //filterIssues();
    });

    //$('#save-filter-button').tap(onSaveFilterButtonClick);

    $('#new-filter-button').tap(function (e) {
        //clearFilter();
    });

    $( "#menu_panel" ).panel();
    $( "#menu-list" ).listview().enhanceWithin();
    $.mobile.defaultPageTransition = 'slide';
})();

$(document).on( "pagecontainershow", function(e, ui) {
    var pageId = ui.toPage.attr("id");
    switch (pageId) {
        case "dashboard": JiraMobile.getModule("dashboard").showDashboardPage(); break;
        case "settings": JiraMobile.getModule("settings").loadSettings(); break;
        //case "projects": showProjectsPage(); break;
        case "filters": JiraMobile.getModule("filters").showFilters(); break;
        //case "issues": showIssues(); break;
        //case "issue": showIssue(); break;
        //case "issue-form": showIssueForm(); break;
    }
});