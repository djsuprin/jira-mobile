JiraMobile.addModule('filters', (function () {

	var settings = JiraMobile.getModule('settings'),
		utils = JiraMobile.getModule('utils'),

		FILTERS_LINK = '/rest/api/latest/filter/favourite';

	function showFilters() {
        if (typeof sessionStorage['filters'] !== 'undefined') {
            displayFilters(JSON.parse(sessionStorage['filters']));
            return;
        }
        utils.showNotification();
        $.ajax({
            type: "GET",
            url: settings.getJiraLink() + FILTERS_LINK,
            dataType: 'json',
            success: [function (data) {
                sessionStorage.setItem('filters', JSON.stringify(data));
                utils.hideNotification();
            }, displayFilters],
            error: function (data) {
                utils.showNotification("Couldn't retrieve filters.", true, 4000);
            }
        });
	}

	function displayFilters(data) {
        var $list = $('#filters-list');
        $list.html('');
        if (data == null) return;
        var filters = data;
        for (var i = 0; i < filters.length; i++) {
            var filterName = filters[i]['name'];
            var filterJQL = filters[i]['jql'];
            var filterID = filters[i]['id'];

            (function (filterName, filterJQL, filterID) {
                var $a = $('<a/>').attr({
                    href: '#'
                }).html(filterName).tap(function (e) {
                    e.preventDefault();
                    var selectedFilter = {
                        filterName: filterName,
                        filterJQL: filterJQL,
                        filterID: filterID
                    };
                    sessionStorage.setItem('selectedFilter', JSON.stringify(selectedFilter));
                    $( "body" ).pagecontainer( "change", "#issues");
                    
                });
                $list.append($('<li/>').html($a));
            })(filterName, filterJQL, filterID);

        }
        $list.listview('refresh');
    }

	return {
		showFilters: showFilters
	};
})());