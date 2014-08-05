JiraMobile.addModule('projects', (function () {

	var settings      = JiraMobile.getModule('settings'),
		utils         = JiraMobile.getModule('utils'),

		PROJECTS_LINK = '/rest/api/latest/project';

    function displayProjects(data) {
        if (data == null || !(data instanceof Array)) return;
        var projectsData = {
            projects: data
        };
        var projectsListHtml = Mustache.to_html($('#projects-list-tpl').html(), projectsData);
        $('#projects .ui-content').html(projectsListHtml);
        // TODO: Assign click handlers to navigate to selected project
        $('#projects-list').listview();
    }

    function getProjects(onSuccess) {
        if (typeof sessionStorage['projects'] !== 'undefined') {
            return JSON.parse(sessionStorage['projects']);
        }
        utils.showNotification();
        $.ajax({
            type: "GET",
            url: settings.getJiraLink() + PROJECTS_LINK,
            dataType: 'json',
            success: [function(data) {
                sessionStorage.setItem('projects', JSON.stringify(data));
            }, onSuccess],
            error: function (data) {
                console.log('Error while retrieving projects.');
                console.log(data);
            },
            complete: function (data) {
				utils.hideNotification();
            }
        });
    }

    function showProjects() {
    	var data = getProjects(displayProjects);
        if (typeof data !== 'undefined') {
            displayProjects(data);
        }
    }

	return {
		getProjects: getProjects,
	    showProjects: showProjects
	};
})());