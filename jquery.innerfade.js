/* =========================================================

// jquery.innerfade.js

// Date: 2009-03-04
// Author: Wes Baker
// Mail: wes@newcitymedia.com	
// Web: http://www.newcitymedia.com

// based on the work of Torsten Baldes http://medienfreunde.com, 
// Matt Oakes http://portfolio.gizone.co.uk/applications/slideshow/
// and Ralf S. Engelschall http://trainofthoughts.org/

 *
 *  <ul id="news"> 
 *      <li>content 1</li>
 *      <li>content 2</li>
 *      <li>content 3</li>
 *  </ul>
 *  
 *  $('#news').innerfade({ 
 *	  animationtype: Type of animation 'fade' or 'slide' (Default: 'fade'), 
 *	  speed: Fading-/Sliding-Speed in milliseconds or keywords (slow, normal or fast) (Default: 'normal'), 
 *	  timeout: Time between the fades in milliseconds (Default: '2000'), 
 *	  type: Type of slideshow: 'sequence', 'random' or 'random_start' (Default: 'sequence'), 
 * 		containerheight: Height of the containing element in any css-height-value (Default: 'auto'),
 *	  runningclass: CSS-Class which the container get’s applied (Default: 'innerfade'),
 *	  children: optional children selector (Default: null)
 *  }); 
 *

TODO Pull next and previous selectors into intitial declaration
TODO Pause
TODO Index

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
            'speed':            'normal',
            'type':             'sequence',
            'timeout':          2000,
            'containerheight':  'auto',
            'runningclass':     'innerfade',
            'children':         null
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
			// Set outer container as relative, and use the height that's set and add the running class
            $(container).css('position', 'relative').css('height', settings.containerheight).addClass(settings.runningclass);

			// Set the z-index from highest to lowest (20, 19, 18...) and set their position as absolute
            for (var i = 0; i < elements.length; i++) {
                $(elements[i]).css('z-index', String(elements.length-i)).css('position', 'absolute').hide();
            };

			// Set the timeout on each object
            if (settings.type == "sequence") {
                $(container).data("innerfadeTimeout", setTimeout(function() {
                    $.innerfade.next(container, elements, settings, 1, 0);
                }, settings.timeout));
                $(elements[0]).show();
            } else if (settings.type == "random") {
            	var last = Math.floor ( Math.random () * ( elements.length ) );
                $(container).data("innerfadeTimeout", setTimeout(function() {
                    do { 
						current = Math.floor ( Math.random ( ) * ( elements.length ) );
					} while (last == current );             
					$.innerfade.next(container, elements, settings, current, last);
                }, settings.timeout));
                $(elements[last]).show();
			} else if ( settings.type == 'random_start' ) {
				settings.type = 'sequence';
				var current = Math.floor ( Math.random () * ( elements.length ) );
				$(container).data("innerfadeTimeout", setTimeout(function(){
					$.innerfade.next(container, elements, settings, (current + 1) %  elements.length, current);
				}, settings.timeout));
				$(elements[current]).show();
			} else {
				alert('Innerfade-Type must either be \'sequence\', \'random\' or \'random_start\'');
			}
		}
    };

	$.innerfadeFade = function(container, elements, settings, current, last) {
		if (settings.animationtype == 'slide') {
            $(elements[last]).slideUp(settings.speed);
            $(elements[current]).slideDown(settings.speed, function() {
				if (settings.next) 
					$.innerfadeNext(container, settings.next);
				else if ($(container).data("innerfadeNextSelector"))
					$.innerfadeNext(container, $(container).data("innerfadeNextSelector"));
				if (settings.previous) 
					$.innerfadePrevious(container, settings.previous);
				else if ($(container).data("innerfadePreviousSelector"))
					$.innerfadePrevious(container, $(container).data("innerfadePreviousSelector"));
			});
        } else if (settings.animationtype == 'fade') {
            $(elements[last]).fadeOut(settings.speed);
            $(elements[current]).fadeIn(settings.speed, function() {
				removeFilter($(this)[0]);
				if (settings.next) 
					$.innerfadeNext(container, settings.next);
				else if ($(container).data("innerfadeNextSelector"))
					$.innerfadeNext(container, $(container).data("innerfadeNextSelector"));
				if (settings.previous) 
					$.innerfadePrevious(container, settings.previous);
				else if ($(container).data("innerfadePreviousSelector"))
					$.innerfadePrevious(container, $(container).data("innerfadePreviousSelector"));
			});
        } else {
            alert('Innerfade-animationtype must either be \'slide\' or \'fade\'');
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
		
		$(next).unbind();
		$(next).one('click', function(event) {
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
		
		$(previous).unbind();
		$(previous).one('click', function(event) {
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
