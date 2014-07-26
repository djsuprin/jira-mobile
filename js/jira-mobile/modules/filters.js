var Filters = (function () {

	var _context = null,
		_settings = null,
		_utils = null;

	return {

		init: function(context) {
			_context = context;
			_settings = _context.getModule("settings");
			_utils = _context.getModule("utils");
		},

		showFilters: function() {
			var jiraLink = _settings.getJiraLink();
			var authHeaderValue = _settings.getAuthHeaderValue();

	        if (typeof localStorage['filters'] !== 'undefined') {
	            displayFilters(JSON.parse(localStorage['filters']));
	            return;
	        }
	        _utils.showNotification();
	        $.ajax({
	            type: "GET",
	            url: jiraLink + FILTERS_LINK,
	            dataType: 'json',
	            beforeSend: function (xhr) {
	                xhr.setRequestHeader('Authorization', authHeaderValue);
	            },
	            success: [function (data) {
	                localStorage.setItem('filters', JSON.stringify(data));
	            }, displayFilters],
	            error: function (data) {
	                console.log('Error while retrieving filters.');
	                console.log(data);
	            },
	            complete: function (data) {
	                _utils.hideNotification();
	            }
	        });
	    }

    	displayFilters: function(data) {
	        var $list = $('#filters-list');
	        $list.html('');
	        if (data == null) return;
	        var filters = data;
	        for (var i = 0; i < filters.length; i++) {
	            var filterName = filters[i]['name'];
	            var filterJQL = filters[i]['jql'];
	            var filterID = filters[i]['id'];

	            var closure = function (filterName, filterJQL, filterID) {
	                var $a = $('<a/>').attr({
	                    href: '#'
	                }).html(filterName).tap(function (e) {
	                    e.preventDefault();
	                    var selectedFilter = {
	                        filterName: filterName,
	                        filterJQL: filterJQL,
	                        filterID: filterID
	                    };
	                    localStorage.setItem('selectedFilter', JSON.stringify(selectedFilter));
	                    $( "body" ).pagecontainer( "change", "#issues");
	                    
	                });
	                $list.append($('<li/>').html($a));
	            }(filterName, filterJQL, filterID);

	        }
	        $list.listview('refresh');
	    }

	};
})();