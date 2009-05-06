/* =========================================================
// jquery.innerfade.js

// Date: 2009-03-04
// Author: Wes Baker
// Mail: wes@newcityexperience.com	
// Web: http://www.newcityexperience.com
// ========================================================= */

(function($) {
    $.fn.innerfade = function(options) {
        return this.each(function() {   
            $.innerfade(this, options);
        });
    };

    $.innerfade = function(container, options) {
        // Define default settings
		var settings = {
        	'animationtype':    'fade',
 			'easing': 			'linear',
            'speed':            'normal',
            'type':             'sequence',
            'timeout':          2000,
            'containerheight':  'auto',
            'runningclass':     'innerfade',
            'children':         null,
			'pauseLink':		'.pause',
			'prevLink': 		'.prev',
			'nextLink': 		'.next'
        };

		// Combine default and set settings or use default
        if (options)
            $.extend(settings, options);

		$(container).data("innerfadeSpeed", settings.speed);
		$(container).data("innerfadeAnimationType", settings.animationtype);

		// If children option is set use that as elements, otherwise use the called jQuery object
        if (settings.children === null)
            var elements = $(container).children();
        else
            var elements = $(container).children(settings.children);

		// Start the loop
        if (elements.length > 1) {
			// Establish the Next and Previous Handlers
			$.innerfadeNext(container, settings.nextLink);
			$.innerfadePrevious(container, settings.prevLink);
	
			// Set outer container as relative, and use the height that's set and add the running class
            $(container).css('position', 'relative').css('height', settings.containerheight).addClass(settings.runningclass);

			// Set the z-index from highest to lowest (20, 19, 18...) and set their position as absolute
            for (var i = 0; i < elements.length; i++) {
                $(elements[i]).css('z-index', String(elements.length-i)).css('position', 'absolute').hide();
            };

			var current = '';
			var last = '';

			// Set the timeout on each object
            if (settings.type == "sequence") {
                $(container).data("innerfadeTimeout", setTimeout(function() {
                    $.innerfade.next(container, elements, settings, 1, 0);
                }, settings.timeout));
                $(elements[0]).show();
            } else if (settings.type == "random") {
            	last = Math.floor ( Math.random () * ( elements.length ) );
                $(container).data("innerfadeTimeout", setTimeout(function() {
                    do { 
						current = Math.floor ( Math.random ( ) * ( elements.length ) );
					} while (last == current );             
					$.innerfade.next(container, elements, settings, current, last);
                }, settings.timeout));
                $(elements[last]).show();
			} else if ( settings.type == 'random_start' ) {
				settings.type = 'sequence';
				current = Math.floor ( Math.random () * ( elements.length ) );
				$(container).data("innerfadeTimeout", setTimeout(function(){
					$.innerfade.next(container, elements, settings, (current + 1) %  elements.length, current);
				}, settings.timeout));
				$(elements[current]).show();
			} else {
				alert('Innerfade-Type must either be \'sequence\', \'random\' or \'random_start\'');
			}
			
			// Establish the Pause Handler
			$(settings.pauseLink).unbind().click(function(event) {
				event.preventDefault();	
				if ($(container).data('innerfadeTimeout') != ' ') {
					$.innerfadeUnbind(container);
				} else {
					var tag = $(container).children(':first').attr('tagName').toLowerCase();
					var current = '';
					var last = '';
					
					if (settings.type == 'sequence') {
						current = $(tag, $(container)).index($(tag+':visible', $(container)));
						last = ((current + 1) == elements.length) ? 0 : current - 1;
					} else if (settings.type == "random") {
						do { 
							current = Math.floor ( Math.random ( ) * ( elements.length ) );
						} while (last == current );
						last = Math.floor ( Math.random () * ( elements.length ) );
					} else if (settings.type == "random_start") {
						current = (last + 1) % elements.length;
						last = Math.floor ( Math.random () * ( elements.length ) );
					};
					
					$.innerfade.next(container, elements, settings, current, last);
				};				
			});
		}
    };

	$.innerfadeFade = function(container, elements, settings, current, last) {
		var determineNext = function() {
			if (settings.next) 
				$.innerfadeNext(container, settings.next);
			else if ($(container).data("innerfadeNextSelector"))
				$.innerfadeNext(container, $(container).data("innerfadeNextSelector"));
			if (settings.previous) 
				$.innerfadePrevious(container, settings.previous);
			else if ($(container).data("innerfadePreviousSelector"))
				$.innerfadePrevious(container, $(container).data("innerfadePreviousSelector"));
		};
		
		if (settings.animationtype == 'slide') {
            $(elements[last]).slideUp(settings.speed);
            $(elements[current]).slideDown(settings.speed, function() {determineNext();});
        } else if (settings.animationtype == 'slideOver') {
			$(container).css({'position': 'relative', 'overflow': 'hidden'});
            $(elements[last]).css({'left': '0px', 'position': 'absolute', 'right': 'auto', 'top': '0px'});
			$(elements[current]).css({'left': 'auto', 'position': 'absolute', 'right': '-300px', 'top': '0px'}).show();

			$(elements[last]).animate({'left': '-300px'}, settings.speed, settings.easing, function() {
				$(this).hide();
			});
			$(elements[current]).animate({'right': '0px'} ,settings.speed, settings.easing, function() {
				determineNext();
			});
        } else if (settings.animationtype == 'fade') {
            $(elements[last]).fadeOut(settings.speed);
            $(elements[current]).fadeIn(settings.speed, function() {
				removeFilter($(this)[0]);
				determineNext();
			});
        } else {
            alert('Innerfade-animationtype must either be \'slide\', \'slideOver\' or \'fade\'');
		}
	};

    $.innerfade.next = function(container, elements, settings, current, last) {
        $.innerfadeFade(container, elements, settings, current, last);
		
        if (settings.type == "sequence") {
            if ((current + 1) < elements.length) {
                current = current + 1;
                last = current - 1;
            } else {
                current = 0;
                last = elements.length - 1;
            }
        } else if (settings.type == "random") {
            last = current;
            while (current == last)
                current = Math.floor(Math.random() * elements.length);
        } else {
            alert('Innerfade-Type must either be \'sequence\', \'random\' or \'random_start\'');
		}
		
        $(container).data("innerfadeTimeout", setTimeout((function() {
            $.innerfade.next(container, elements, settings, current, last);
        }), settings.timeout));
    };

	$.fn.innerfadeUnbind = function() {
		return this.each(function(index) {
			$.innerfadeUnbind(this);
		});
	};
	
	$.innerfadeUnbind = function(container) {
		clearTimeout($(container).data('innerfadeTimeout'));
		$(container).data('innerfadeTimeout', ' ');
	};
	
	$.fn.innerfadeNext = function(next) {
		return this.each(function(index) {
			$.innerfadeNext(this, next);
		});
	};
	
	$.innerfadeNext = function(container, next) {
		// Define default settings
		var nextSelector = '.innerfade-next';

		// Combine default and set settings or use default
        if (next) nextSelector = next;

		$(container).data('innerfadeNextSelector', nextSelector);

		// If children option is set use that as elements, otherwise use the called jQuery object
		var elements = $(container).children();
           
		var $currentElement = $('> :visible', $(container));
		var $nextElement = ($currentElement.next().length > 0) ? $currentElement.next() : $(container).children(':first');
		var currentElementIndex = $(container).children().index($currentElement);
		var nextElementIndex = $(container).children().index($nextElement);
		
		var settings = {
			'speed': 			$(container).data('innerfadeSpeed'),
			'animationtype': 	$(container).data('innerfadeAnimationType'),
			'next': 			next
		};
		
		$(next).unbind().one('click', function(event) {
			event.preventDefault();
			$.innerfadeUnbind(container);
			$.innerfadeFade(container, elements, settings, nextElementIndex, currentElementIndex);
		});
	};
	
	$.fn.innerfadePrevious = function(previous) {
		return this.each(function(index) {
			$.innerfadePrevious(this, previous);
		});
	};
	
	$.innerfadePrevious = function(container, previous) {
		// Define default settings
		var previousSelector = '.innerfade-previous';

		// Combine default and set settings or use default
        if (previous) previousSelector = previous;

		$(container).data('innerfadePreviousSelector', previousSelector);

		// If children option is set use that as elements, otherwise use the called jQuery object
		var elements = $(container).children();
           
		var $currentElement = $('> :visible', $(container));
		var $previousElement = ($currentElement.prev().length > 0) ? $currentElement.prev() : $(container).children(':last');
		var currentElementIndex = $(container).children().index($currentElement);
		var previousElementIndex = $(container).children().index($previousElement);
		
		var settings = {
			'speed': 			$(container).data('innerfadeSpeed'),
			'animationtype': 	$(container).data('innerfadeAnimationType'),
			'previous': 		previous
		};
		
		$(previous).unbind().one('click', function(event) {
			event.preventDefault();
			$.innerfadeUnbind(container);
			$.innerfadeFade(container, elements, settings, previousElementIndex, currentElementIndex);
		});
	};

})(jQuery);

// **** remove Opacity-Filter in ie ****
function removeFilter(element) {
	if(element.style.removeAttribute){
		element.style.removeAttribute('filter');
	}
}
