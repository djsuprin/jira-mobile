JiraMobile.addModule('issue-form', (function () {

	var settings              = JiraMobile.getModule('settings'),
		projects              = JiraMobile.getModule('projects'),
		utils                 = JiraMobile.getModule('utils'),

		ISSUE_CREATEMETA_LINK = '/rest/api/2/issue/createmeta?expand=projects.issuetypes.fields&projectKeys=';

    function showIssueForm() {
        var data = projects.getProjects(setProjectFieldValues);
        if (typeof data !== 'undefined') {
            setProjectFieldValues(data);
        }
    }

    function getTemplateData(data, fields) {
		var templateData = { fieldOptions : [] };
        var element;
        for (var i = 0; i < data.length; i++) {
        	element = {
        		key: data[i][fields[0]],
        		name: data[i][fields[1]]
        	};
        	templateData.fieldOptions.push(element);
        }
        return templateData;
    }

    function setProjectFieldValues(data) {
        var templateData = getTemplateData(data, ['key', 'name']);
        var projectFieldOptionsHtml = Mustache.to_html($('#issue-field-select-options-tpl').html(), templateData);
        $('#issue-project-select').append(projectFieldOptionsHtml).selectmenu( "refresh" );
        var selectedProject = $('#issue-project-select').val();
        // TODO: check if element 0 is selected (field caption) then don't query create meta
        if (selectedProject !== "Project") {
        	// query create issue meta
			var data = getIssueCreateMeta(selectedProject, displayIssueForm);
			if (typeof data !== 'undefined') {
	            displayIssueForm(data);
	        }
        }
    }

    function getIssueCreateMeta(projectKey, onSuccess) {
    	console.log("Getting issue create meta...");
    	if (typeof localStorage['issueCreateMeta-' + projectKey] !== 'undefined') {
            return JSON.parse(localStorage['issueCreateMeta-' + projectKey]);
        }
        utils.showNotification();
        var url = settings.getJiraLink() + ISSUE_CREATEMETA_LINK + projectKey;
        $.ajax({
            type: "GET",
            url: url,
            dataType: 'json',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', settings.getAuthHeaderValue());
            },
            success: [function (data) {
                localStorage.setItem('issueCreateMeta-' + projectKey, JSON.stringify(data));
            }, onSuccess],
            error: function (data) {
                console.log('Error while retrieving issues.');
                console.log(data);
            },
            complete: function (data) {
                utils.hideNotification();
            }
        });
    }

    function displayIssueForm(data) {
    	// TODO: generate issue form (display all necessary fields and fill them with values)
    	console.log("This issue create meta should be used to generate the form:");
    	console.log(data);
    	var issueTypes = data['projects'][0]['issuetypes'];
    	var templateData = getTemplateData(issueTypes, ['id', 'name']);
    	console.log("Issue types:");
    	var issueTypeFieldOptionsHtml = Mustache.to_html($('#issue-field-select-options-tpl').html(), templateData);
    	console.log(issueTypeFieldOptionsHtml);
    	var $issueTypeField = $('<select/>').attr({
    		'name': 'issue-type-select',
    		'id': 'issue-type-select',
    		'data-native-menu': false
    	}).html(issueTypeFieldOptionsHtml);
    	$('#issue-generated-fields').append($issueTypeField);
    	$issueTypeField.selectmenu();
    	// TODO: get selected issue type and generate field set for it
    }

	return {
	    showIssueForm: showIssueForm
	};
})());