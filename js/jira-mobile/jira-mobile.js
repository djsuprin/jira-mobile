var JiraMobile = (function () {

	var modules = {};

	return {
        addModule: function(name, module) {
            modules[name] = module;
        },
        getModule: function(name) {
            if (typeof modules[name] !== 'undefined') {
                return modules[name];
            }
        },
		init: function() {
            // TODO: Initialize stuff here
            $(function() {
                $('#save-settings-button').tap(function (e) {
                    e.preventDefault();
                    JiraMobile.getModule('settings').saveSettings();
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
            });

            $(document).on( "pagecontainershow", function(e, ui) {
                var pageId = ui.toPage.attr("id");
                switch (pageId) {
                    case "dashboard": JiraMobile.getModule('dashboard').showDashboard(); break;
                    case "settings": JiraMobile.getModule('settings').loadSettings(); break;
                    case "projects": JiraMobile.getModule('projects').showProjects(); break;
                    case "filters": JiraMobile.getModule('filters').showFilters(); break;
                    case "issues": JiraMobile.getModule('issues').showIssues(); break;
                    case "issue": JiraMobile.getModule('issue').showIssue(); break;
                    case "issue-form": JiraMobile.getModule('issue-form').showIssueForm(); break;
                }
            });
		}
	};

})();