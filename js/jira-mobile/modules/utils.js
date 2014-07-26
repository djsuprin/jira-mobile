var Utils = (function () {

	var notificationTimeoutId = -999;

	return {
		wiki2html: function(wiki) {
	        // replace line endings
	        return wiki.replace(/\n/g, "<br />")
	            .replace(/\[(.*)|(html.*)\]/g, function(str) {
	                var temp = str.split('|');
	                var text = temp[0].substring(1);
	                var href = temp[1].substring(0, temp[1].lastIndexOf(']'));
	                return '<a href="' + href + '">' + text + '</a>';
	            });
    	},

	    showNotification: function(text, textonly, timeout) {
	        text = typeof text !== 'undefined' ? text : "Loading";
	        textonly = typeof textonly !== 'undefined' ? textonly : false;
	        timeout = typeof timeout !== 'undefined' ? timeout : false;

	        clearTimeout(notificationTimeoutId);

	        var options = {
	            theme: "b",
	            text: text,
	            textVisible: true,
	            textonly: textonly
	        };

	        $.mobile.loading( "show", options);
	        if (timeout !== false) {
	            notificationTimeoutId = setTimeout(function() {
	                $.mobile.loading( "hide" );
	            }, timeout);
	        }
	    },

	    hideNotification: function() {
	        $.mobile.loading( "hide" );
	    }
	};

})();