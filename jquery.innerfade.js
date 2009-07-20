/* =========================================================
// jquery.innerFade.js

// Date: 2009-03-04
// Author: Wes Baker
// Mail: wes@newcityexperience.com	
// Web: http://www.newcityexperience.com
// ========================================================= */

(function($) {
    $.fn.innerFade = function(options) {
        return this.each(function() {   
            $.innerFade(this, options);
        });
    };

	
    $.innerFade = function(container, options) {
        // Define default settings
		var settings = {
        	'animationtype':    'fade',
 			'easing': 			'linear',
            'speed':            'normal',
            'type':             'sequence',
            'timeout':          2000,
            'containerheight':  'auto',
            'runningclass':     'innerFade',
            'children':         null,
			'cancelLink': 		'.cancel', 
			'pauseLink':		'.pause',
			'prevLink': 		'.prev',
			'nextLink': 		'.next'
        };

		// Combine default and set settings or use default
        if (options)
            $.extend(settings, options);

		$(container).data("innerFadeSpeed", settings.speed);
		$(container).data("innerFadeAnimationType", settings.animationtype);

		// If children option is set use that as elements, otherwise use the called jQuery object
        if (settings.children === null)
            var elements = $(container).children();
        else
            var elements = $(container).children(settings.children);

		// Start the loop
        if (elements.length > 1) {
			// Establish the Next and Previous Handlers
			$.innerFadeNext(container, settings.nextLink);
			$.innerFadePrevious(container, settings.prevLink);
			
			// Establish Cancel Handler
			$(settings.cancelLink).unbind().click(function(event) {
				event.preventDefault();
				$.innerFadeUnbind(container);
			});
	
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
                $(container).data("innerFadeTimeout", setTimeout(function() {
                    $.innerFade.next(container, elements, settings, 1, 0);
                }, settings.timeout));
                $(elements[0]).show();
            } else if (settings.type == "random") {
            	last = Math.floor ( Math.random () * ( elements.length ) );
                $(container).data("innerFadeTimeout", setTimeout(function() {
                    do { 
						current = Math.floor ( Math.random ( ) * ( elements.length ) );
					} while (last == current );             
					$.innerFade.next(container, elements, settings, current, last);
                }, settings.timeout));
                $(elements[last]).show();
			} else if ( settings.type == 'random_start' ) {
				settings.type = 'sequence';
				current = Math.floor ( Math.random () * ( elements.length ) );
				$(container).data("innerFadeTimeout", setTimeout(function(){
					$.innerFade.next(container, elements, settings, (current + 1) %  elements.length, current);
				}, settings.timeout));
				$(elements[current]).show();
			} else {
				alert('Innerfade-Type must either be \'sequence\', \'random\' or \'random_start\'');
			}
			
			// Establish the Pause Handler
			$(settings.pauseLink).unbind().click(function(event) {
				event.preventDefault();	
				if ($(container).data('innerFadeTimeout') != ' ') {
					$.innerFadeUnbind(container);
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
					
					$.innerFade.next(container, elements, settings, current, last);
				};				
			});
		}
    };

	/**
	 * Fades the slideshow to the item of your choosing
	 * @param {jQuery Object} container The conatiner holding the items being faded
	 * @param {Array} elements The list of elements within the container
	 * @param {Object} settings The settings object which contains speed, style, selectors of the items and so on
	 * @param {Number} current The position in the array of the item to be shown
	 * @param {Number} last The position in the array of the item to be hidden
	 */
	$.innerFadeFade = function(container, elements, settings, current, last) {
		var determineNext = function() {
			if (settings.next) 
				$.innerFadeNext(container, settings.next);
			else if ($(container).data("innerFadeNextSelector"))
				$.innerFadeNext(container, $(container).data("innerFadeNextSelector"));
			if (settings.previous) 
				$.innerFadePrevious(container, settings.previous);
			else if ($(container).data("innerFadePreviousSelector"))
				$.innerFadePrevious(container, $(container).data("innerFadePreviousSelector"));
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

    $.innerFade.next = function(container, elements, settings, current, last) {
        $.innerFadeFade(container, elements, settings, current, last);
		
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
		
        $(container).data("innerFadeTimeout", setTimeout((function() {
            $.innerFade.next(container, elements, settings, current, last);
        }), settings.timeout));
    };
	
	/**
	 * Stops the fading completely
	 * @param {jQuery Object} container The conatiner holding the items being faded
	 */
	$.innerFadeUnbind = function(container) {
		clearTimeout($(container).data('innerFadeTimeout'));
		$(container).data('innerFadeTimeout', ' ');
	};
	
	/* Allows use of the $.innerFadeUnbind function outside of the plugin */
	$.fn.innerFadeUnbind = function() {
		return this.each(function(index) {
			$.innerFadeUnbind(this);
		});
	};
	
	/**
	 * Binds the next item link to view the next item
	 * @param {jQuery Object} container The container holding the items being faded
	 * @param {String} previous jQuery (CSS) Selector pointing to the next item link
	 */
	$.innerFadeNext = function(container, next) {
		// Define default settings
		var nextSelector = '.innerFade-next';

		// Combine default and set settings or use default
        if (next) nextSelector = next;

		$(container).data('innerFadeNextSelector', nextSelector);

		// If children option is set use that as elements, otherwise use the called jQuery object
		var elements = $(container).children();
           
		var $currentElement = $('> :visible', $(container));
		var $nextElement = ($currentElement.next().length > 0) ? $currentElement.next() : $(container).children(':first');
		var currentElementIndex = $(container).children().index($currentElement);
		var nextElementIndex = $(container).children().index($nextElement);
		
		var settings = {
			'speed': 			$(container).data('innerFadeSpeed'),
			'animationtype': 	$(container).data('innerFadeAnimationType'),
			'next': 			next
		};
		
		$(next).unbind().one('click', function(event) {
			event.preventDefault();
			$.innerFadeUnbind(container);
			$.innerFadeFade(container, elements, settings, nextElementIndex, currentElementIndex);
		});
	};
	
	/**
	 * Binds the previous item link to view the previous item
	 * @param {jQuery Object} container The container holding the items being faded
	 * @param {String} previous jQuery (CSS) Selector pointing to the previous item link
	 */
	$.innerFadePrevious = function(container, previous) {
		// Define default settings
		var previousSelector = '.innerFade-previous';

		// Combine default and set settings or use default
        if (previous) previousSelector = previous;

		$(container).data('innerFadePreviousSelector', previousSelector);

		// If children option is set use that as elements, otherwise use the called jQuery object
		var elements = $(container).children();
           
		var $currentElement = $('> :visible', $(container));
		var $previousElement = ($currentElement.prev().length > 0) ? $currentElement.prev() : $(container).children(':last');
		var currentElementIndex = $(container).children().index($currentElement);
		var previousElementIndex = $(container).children().index($previousElement);
		
		var settings = {
			'speed': 			$(container).data('innerFadeSpeed'),
			'animationtype': 	$(container).data('innerFadeAnimationType'),
			'previous': 		previous
		};
		
		$(previous).unbind().one('click', function(event) {
			event.preventDefault();
			$.innerFadeUnbind(container);
			$.innerFadeFade(container, elements, settings, previousElementIndex, currentElementIndex);
		});
	};

})(jQuery);

// **** remove Opacity-Filter in ie ****
function removeFilter(element) {
	if(element.style.removeAttribute){
		element.style.removeAttribute('filter');
	}
}
