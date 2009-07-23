/* =========================================================
// jquery.innerFade.js

// Date: 2009-07-21
// Author: Wes Baker
// Mail: wes@wesbaker.com	
// Web: http://www.wesbaker.com
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
			'animationtype':	'fade',
			'easing':			'linear',
			'speed':			'normal',
			'type':				'sequence',
			'timeout':			2000,
			'containerheight':	'auto',
			'runningclass':		'innerFade',
			'children':			null,
			'cancelLink':		'.cancel', 
			'pauseLink':		'.pause',
			'prevLink':			'.prev',
			'nextLink':			'.next',
			'indexContainer': 	null,
		};

		// Combine default and set settings or use default
		if (options) { $.extend(settings, options); }

		// If children option is set use that as elements, otherwise use the called jQuery object
		var elements = (settings.children === null) ? $(container).children() : $(container).children(settings.children);

		// Start the loop
		if (elements.length > 1) {
			// Establish the Next and Previous Handlers
			$.innerFadeControls(container, elements, settings);
			
			// Establish Cancel Handler
			$.innerFadeCancel(container, settings);

			// Set outer container as relative, and use the height that's set and add the running class
			$(container).css({'position': 'relative', 'height': settings.containerheight}).addClass(settings.runningclass);
			
			// Build the Index if one is specified
			if (settings.indexContainer) {				
				$.innerFadeIndex(container, settings, elements);
			};

			// Set the z-index from highest to lowest (20, 19, 18...) and set their position as absolute
			for (var i = 0; i < elements.length; i++) {
				$(elements[i]).css('z-index', String(elements.length-i)).css('position', 'absolute').hide();
			}

			var current = '';
			var last = '';

			// Set the timeout on each object
			if (settings.type == "random") {
				last = Math.floor(Math.random() * elements.length);
				do { 
					current = Math.floor(Math.random() * elements.length);
				} while (last == current );				
				$.innerFade.next(container, elements, settings, current, last);
				
				$(elements[last]).show();
			} else if ( settings.type == 'random_start' ) {
				settings.type = 'sequence';
				current = Math.floor ( Math.random () * ( elements.length ) );
				$.innerFade.next(container, elements, settings, (current + 1) %	 elements.length, current);
				
				$(elements[current]).show();
			} else {
				// Otherwise and if its sequence
				$.innerFade.next(container, elements, settings, 1, 0);
				
				$(elements[0]).show();
			}
			
			// Establish the Pause Handler
			$.innerFadePause(container, elements, settings);
		}
	};


	/**
	 * Fades the slideshow to the item selected (current) from the previous item (last)
	 * @param {jQuery Object} container The container that first calls the innerfade plugin
	 * @param {Array} elements The array of elements within the container
	 * @param {Object} settings The settings object which contains speed, style, selectors of the items and so on
	 * @param {Number} current The position in the elements array of the item to be shown
	 * @param {Number} last The position in the elements array of the item to be hidden
	 */
	$.innerFadeFade = function(container, elements, settings, current, last) {
		var buildControls = function() {
			if (settings.nextLink || settings.prevLink) { $.innerFadeControls(container, elements, settings); }
		};
		
		if (settings.animationtype == 'slide') {
			$(elements[last]).slideUp(settings.speed);
			$(elements[current]).slideDown(settings.speed, function() {buildPreviousNext();});
		} else if (settings.animationtype == 'slideOver') {
			var itemWidth = $(elements[0]).width();
			$(container).css({'overflow': 'hidden'});
			$(elements[last]).css({'left': '0px', 'position': 'absolute', 'right': 'auto', 'top': '0px'});
			$(elements[current]).css({'left': 'auto', 'position': 'absolute', 'right': '-'+itemWidth+'px', 'top': '0px'}).show();

			$(elements[last]).animate({'left': '-'+itemWidth+'px'}, settings.speed, settings.easing, function() {
				$(this).hide();
			});
			$(elements[current]).animate({'right': '0px'} ,settings.speed, settings.easing, function() {
				buildControls();
			});
		} else {
			$(elements[last]).fadeOut(settings.speed);
			$(elements[current]).fadeIn(settings.speed, function() {
				// $(elements[current]).css('filter', '');
				buildControls();
			});
		}
	};

	/**
	 * Fades to the item of your choosing and establishes the timeout for the next item to fade to
	 * @param {jQuery Object} container The container that first calls the innerfade plugin
	 * @param {Array} elements The array of elements within the container
	 * @param {Object} settings The settings object which contains speed, style, selectors of the items and so on
	 * @param {Number} current The position in the elements array of the item to be shown
	 * @param {Number} last The position in the elements array of the item to be hidden
	 */
	$.innerFade.next = function(container, elements, settings, current, last) {
		if (settings.type == "random") {
			last = current;
			while (current == last) { current = Math.floor(Math.random() * elements.length); }
		} else {
			if ((current + 1) < elements.length) {
				current = current + 1;
				last = current - 1;
			} else {
				current = 0;
				last = elements.length - 1;
			}
		}
		
				$.innerFadeFade(container, elements, settings, current, last);
		$(container).data("innerFadeTimeout", setTimeout((function() {
			$.innerFade.next(container, elements, settings, current, last);
		}), settings.timeout));
	};

	/* Allows the unbind function to be called from javascript */
	$.fn.innerFadeUnbind = function() {
		return this.each(function(index) {
			$.innerFadeUnbind(this);
		});
	};
	
	/**
	 * Stops the slideshow
	 * @param {jQuery Object} container The container that first calls the innerfade plugin
	 */
	$.innerFadeUnbind = function(container) {
		clearTimeout($(container).data('innerFadeTimeout'));
		$(container).data('innerFadeTimeout', ' ');
	};
	
	/**
	 * Establishes the Next and Previous link behavior
	 * @param {jQuery Object} container The container that first calls the innerfade plugin
	 * @param {Array} elements The elements within the container
	 * @param {Object} settings The settings object which contains speed, style, selectors of the items and so on
	 */
	$.innerFadeControls = function(container, elements, settings) {
		var previousSelector = (settings.prevLink) ? settings.prevLink : '.innerFade-previous';
		var nextSelector = (settings.nextLink) ? settings.nextLink : '.innerFade-next';
		
		var $currentElement = $('> :visible', $(container));
		var currentElementIndex = $(container).children().index($currentElement);
		
		var $nextElement = ($currentElement.next().length > 0) ? $currentElement.next() : $(container).children(':first');
		var nextElementIndex = $(container).children().index($nextElement);
		
		var $previousElement = ($currentElement.prev().length > 0) ? $currentElement.prev() : $(container).children(':last');
		var previousElementIndex = $(container).children().index($previousElement);
		
		var bindClick = function(selector, nextItem) {
			$(selector).unbind().one('click', function(event) {
				event.preventDefault();
				$.innerFadeUnbind(container);
				$.innerFadeFade(container, elements, settings, nextItem, currentElementIndex);
			});
		};

		bindClick(previousSelector, previousElementIndex);
		bindClick(nextSelector, nextElementIndex);
	};
	
	/**
	 * Establishes the Pause Button
	 * @param {jQuery Object} container The container that first calls the innerfade plugin
	 * @param {Array} elements The array of elements within the container
	 * @param {Object} settings The settings object which contains speed, style, selectors of the items and so on
	 */
	$.innerFadePause = function(container, elements, settings) {
		$(settings.pauseLink).unbind().click(function(event) {
			event.preventDefault(); 
			if ($(container).data('innerFadeTimeout') != ' ') {
				$.innerFadeUnbind(container);
			} else {
				var tag = $(container).children(':first').attr('tagName').toLowerCase();
				var nextItem = '';
				var previousItem = '';
				
				if (settings.type == "random") {
					previousItem = Math.floor(Math.random() * elements.length);
					do { 
						nextItem = Math.floor(Math.random() * elements.length);
					} while (previousItem == nextItem);
				} else if (settings.type == "random_start") {
					previousItem = Math.floor(Math.random() * elements.length);
					nextItem = (previousItem + 1) % elements.length;
				} else {
					previousItem = $(tag, $(container)).index($(tag+':visible', $(container)));
					nextItem = ((previousItem + 1) == elements.length) ? 0 : previousItem + 1;
				}
				
				$.innerFade.next(container, elements, settings, nextItem, previousItem);
			}
		});
	};
		
	/**
	 * Establishes the Cancel Button
	 * @param {jQuery Object} container The container that first calls the innerfade plugin
	 * @param {Object} settings The settings object which contains speed, style, selectors of the items and so on
	 */
	$.innerFadeCancel = function(container, settings) {
		$(settings.cancelLink).unbind().click(function(event) {
			event.preventDefault();
			$.innerFadeUnbind(container);
		});
	};

	/**
	 * Creates one link for each item in the slideshow, to show that item immediately
	 * @param {jQuery Object} container The container that first calls the innerfade plugin
	 * @param {Array} elements The array of elements within the container
	 * @param {Object} settings The settings object which contains speed, style, selectors of the items and so on
	 */
	$.innerFadeIndex = function(container, settings, elements) {
		var $indexContainer = $(settings.indexContainer);
		
		var buildLink = function(count) {
			var	$link = $('<li><a href="#">' + (count + 1) + '</a></li>');
			$link.click(function(event) {
				event.preventDefault();
				var $currentVisibleItem = $('> :visible', $(container));
				var currentItemIndex = $(elements).index($currentVisibleItem);
				$.innerFadeUnbind(container);
				$.innerFadeFade(container, elements, settings, count, currentItemIndex);
			});
			return $link;
		};
				
		for (var i=0; i < elements.length; i++) {
			$indexContainer.append(buildLink(i));
		};
	};
})(jQuery);