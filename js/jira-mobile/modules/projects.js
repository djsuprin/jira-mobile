JiraMobile.addModule('projects', (function () {

	var settings      = JiraMobile.getModule('settings'),
		utils         = JiraMobile.getModule('utils'),

		PROJECTS_LINK = '/rest/api/latest/project';

    function displayProjects(data) {
        var $list = $('#projects-list');
        $list.html('');
        if (data == null || !(data instanceof Array)) return;
        var projects = data;
        for (var i = 0; i < projects.length; i++) {
            var $a = $('<a/>').attr({
                href: '#'
            }).html(projects[i]['name']);
            $list.append($('<li/>').html($a));
        }
        $list.listview('refresh');
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