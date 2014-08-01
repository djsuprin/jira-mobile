var JiraMobile = (function () {

	var modules = {};

    function addModule(name, module) {
        modules[name] = module;
    }

    function getModule(name) {
        if (typeof modules[name] !== 'undefined') {
            return modules[name];
        }
    }

    function init() {
        $(function() {
            // Quick search field should contain issue key. Client navigates to the specified issue.
            $( "#issue-quick-search-form" ).submit(function(e) {
                e.preventDefault();
                var $issueQuickSearchField = $( "#issue-quick-search-field" );
                var issueKey = $issueQuickSearchField.val();
                sessionStorage.setItem('currentIssueKey', issueKey);
                $issueQuickSearchField.val('')
                $( "body" ).pagecontainer( "change", "#issue", {
                    allowSamePageTransition: true
                });
            });
            // Need to explicitely initialize and style panel as it is declared outside pages
            $( "#menu_panel" ).panel();
            $( "#menu-list" ).listview().enhanceWithin();
            // Show slide animation when navigating between pages
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

	return {
        addModule: addModule,
        getModule: getModule,
		init: init
	};

})();