/* =========================================================
// jquery.innerFade.js

// Date: 2010-02-16
// Author: Wes Baker
// Mail: wes@wesbaker.com	
// Web: http://www.wesbaker.com
// ========================================================= */

(function($) {
	var container, elements, settings;
	var currentTimeout = null;
	var count = 0;
	
	$.fn.innerFade = function(options) {
		return this.each(function() {	
			$.innerFade(this, options);
		});
	};

	$.innerFade = function(container, options) {
		// Define default settings
		settings = {
			'animationType':			'fade',
			'animate': 					true,
			'easing':					'linear',
			'speed':					'normal',
			'type':						'sequence',
			'timeout':					2000,
			'startDelay': 				0,
 			'loop': 					true,
			'containerHeight':			'auto',
			'runningClass':				'innerFade',
			'children':					null,
			'cancelLink':				null, 
			'pauseLink':				'.pause',
			'prevLink':					'.prev',
			'nextLink':					'.next',
			'indexContainer': 			null,
			'currentItemContainer': 	null,
			'totalItemsContainer': 		null
		};
		
		
		// Combine default and set settings or use default
		if (options) { settings = $.extend(settings, options); }

		// If children option is set use that as elements, otherwise use the called jQuery object
		elements = (settings.children === null) ? $(container).children() : $(container).children(settings.children);
		
		container = container;
		
		// Start the loop
		if (elements.length > 1) {
			// Establish the Next and Previous Handlers
			$.bindControls();
			
			// Establish Cancel Handler
			if (settings.cancelLink) { $.bindCancel(); };

			// Set outer container as relative, and use the height that's set and add the running class
			$(container).css({'position': 'relative'}).addClass(settings.runningClass);
			if (settings.containerHeight == 'auto') {
				height = $(elements).filter(':first').height();
				$(container).css({'height': height + 'px'});
			} else {
				$(container).css({'height': settings.containerHeight});
			};
			
			// Build the Index if one is specified
			if (settings.indexContainer) {				
				$.innerFadeIndex();
			};

			$(elements).filter(':gt(0)').hide(0);
			// Set the z-index from highest to lowest (20, 19, 18...) and set their position as absolute
			for (var i = 0; i < elements.length; i++) {
				$(elements[i]).css('z-index', String(elements.length-i)).css('position', 'absolute');
			}

			var toShow = '';
			var toHide = '';

			if (settings.type == "random") {
				toHide = Math.floor(Math.random() * elements.length);
				do { 
					toShow = Math.floor(Math.random() * elements.length);
				} while (toHide == toShow );				
				$(elements[toHide]).show();
			} else if ( settings.type == 'random_start' ) {
				settings.type = 'sequence';
				toHide = Math.floor ( Math.random () * ( elements.length ) );
				toShow = (toHide + 1) % elements.length;
			} else {
				// Otherwise and if its sequence
				toShow = 0;
				toHide = elements.length - 1;
			}
			
			if (settings.animate) {
				$.fadeTimeout(toShow, toHide, true);
			};
			$.updateIndexes(toShow);
			
			if (settings.type == 'random') {
				$(elements[toHide]).show();
			} else {
				$(elements[toShow]).show();
			};
			
			// Set item count containers
			if (settings.currentItemContainer) { $.currentItem(toShow); };
			if (settings.totalItemsContainer) { $.totalItems(); };
			
			// Establish the Pause Handler
			$.bindPause();
		}
	};
	
	/**
	 * Public function to change to a specific slide. This is expecting a zero-index slide number.
	 * @param {Number} slide_number Zero-indexed slide number
	 */
	$.fn.innerFadeTo = function(slide_number) {
		return this.each(function(index) {
			var $currentVisibleItem = $(elements).filter(':visible');
			var currentItemIndex = $(elements).index($currentVisibleItem);
			$.stopSlideshow();
			if (slide_number != currentItemIndex) {
				$.fadeToItem(slide_number, currentItemIndex);
			};
		});
	};

	/**
	 * Fades the slideshow to the item selected from the previous item
	 * @param {Number} toShow The position in the elements array of the item to be shown
	 * @param {Number} toHide The position in the elements array of the item to be hidden
	 */
	$.fadeToItem = function(toShow, toHide) {
		// Update the next and previous controls
		var buildControls = function() {
			if (settings.nextLink || settings.prevLink) { $.bindControls(); }
		};
		
		if (settings.animationType == 'slide') {
			$(elements[toHide]).slideUp(settings.speed);
			$(elements[toShow]).slideDown(settings.speed, function() {buildPreviousNext();});
		} else if (settings.animationType == 'slideOver') {
			var itemWidth = $(elements[0]).width();
			$(container).css({'overflow': 'hidden'});
			$(elements[toHide]).css({'left': '0px', 'position': 'absolute', 'right': 'auto', 'top': '0px'});
			$(elements[toShow]).css({'left': 'auto', 'position': 'absolute', 'right': '-'+itemWidth+'px', 'top': '0px'}).show();

			$(elements[toHide]).animate({'left': '-'+itemWidth+'px'}, settings.speed, settings.easing, function() {
				$(this).hide();
			});
			$(elements[toShow]).animate({'right': '0px'} ,settings.speed, settings.easing, function() {
				buildControls();
			});
		} else {
			$(elements[toHide]).fadeOut(settings.speed);
			$(elements[toShow]).fadeIn(settings.speed, function() {
				buildControls();
			});
		}
		// Update the toShow item
		if (settings.currentItemContainer) {
			$.currentItem(toShow);
		};
		
		// Update indexes with active classes
		if (settings.indexContainer) {
			$.updateIndexes(toShow);
		};
	};

	/**
	 * Fades to the item of your choosing and establishes the timeout for the next item to fade to
	 * @param {Number} toShow The position in the elements array of the item to be shown
	 * @param {Number} toHide The position in the elements array of the item to be hidden
	 * @param {Boolean} firstRun If this is the first run of innerfade, pass true, otherwise pass false
	 */
	$.fadeTimeout = function(toShow, toHide, firstRun) {
		// If its not the first run, then fade
		if (firstRun != true) {
			$.fadeToItem(toShow, toHide);
		};
		
		// Increment the count of slides shown
		count++;
		
		// Check if loop is false, if it is check to see how many slides have been shown.
		// In the case that you're at the last slide, stop the slideshow and return.
		if (settings.loop == false && count >= elements.length) {
			$.stopSlideshow();
			return;
		};

		// Get ready for next fade
		if (settings.type == "random") {
			toHide = toShow;
			while (toShow == toHide) { toShow = Math.floor(Math.random() * elements.length); }
		} else {
			toHide = (toHide > toShow) ? 0 : toShow;
			toShow = (toShow + 1 >= elements.length) ? 0 : toShow + 1;
		}
		
		// Set the time out; if its first run and a start delay exists, use the start delay
		var timeout = (firstRun && settings.startDelay) ? settings.startDelay : settings.timeout;
		currentTimeout = setTimeout((function() { $.fadeTimeout(toShow, toHide, false); }), timeout);
	};

	/* Allows the unbind function to be called from javascript */
	$.fn.innerFadeUnbind = function() {
		return this.each(function(index) {
			$.stopSlideshow();
		});
	};
	
	/**
	 * Stops the slideshow
	 * @param {jQuery Object} container The container that first calls the innerfade plugin
	 */
	$.stopSlideshow = function() {
		clearTimeout(currentTimeout);
		currentTimeout = null;
	};
	
	/**
	 * Establishes the Next and Previous link behavior
	 * @param {jQuery Object} container The container that first calls the innerfade plugin
	 * @param {Array} elements The elements within the container
	 * @param {Object} settings The settings object which contains speed, style, selectors of the items and so on
	 */
	$.bindControls = function() {
		$(settings.nextLink).unbind().one('click', function(event) {
			event.preventDefault();
			$.stopSlideshow();
			
			var $currentElement = $(elements).filter(':visible');
			var currentElementIndex = $(elements).index($currentElement);

			var $nextElement = ($currentElement.next().length > 0) ? $currentElement.next() : $(elements).filter(':first');
			var nextElementIndex = $(elements).index($nextElement);
			
			$.fadeToItem(nextElementIndex, currentElementIndex);
		});
			
		$(settings.prevLink).unbind().one('click', function(event) {
			event.preventDefault();
			$.stopSlideshow();
			
			var $currentElement = $(elements).filter(':visible');
			var currentElementIndex = $(elements).index($currentElement);

			var $previousElement = ($currentElement.prev().length > 0) ? $currentElement.prev() : $(elements).filter(':last');
			var previousElementIndex = $(elements).index($previousElement);
			
			$.fadeToItem(previousElementIndex, currentElementIndex);
		});
	};
	
	/**
	 * Establishes the Pause Button
	 * @param {jQuery Object} container The container that first calls the innerfade plugin
	 * @param {Array} elements The array of elements within the container
	 * @param {Object} settings The settings object which contains speed, style, selectors of the items and so on
	 */
	$.bindPause = function() {
		$(settings.pauseLink).unbind().click(function(event) {
			event.preventDefault(); 
			if (currentTimeout != null) {
				$.stopSlideshow();
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
				
				$.fadeTimeout(nextItem, previousItem, false);
			}
		});
	};
		
	/**
	 * Establishes the Cancel Button
	 */
	$.bindCancel = function() {
		$(settings.cancelLink).unbind().click(function(event) {
			event.preventDefault();
			$.stopSlideshow();
		});
	};

	/**
	 * Updates the indexes and adds an active class to the visible item
	 * @param {Number} toShow The position in the elements array of the item to be shown
	 */
	$.updateIndexes = function(toShow) {
		$(settings.indexContainer).children().removeClass('active');
		$('> :eq(' + toShow + ')', $(settings.indexContainer)).addClass('active');
	};
	
	/**
	 * Creates handlers for the links created by the $.handleIndexes and $.generateIndexes functions
	 * @param {Number} count The item to be setting the link on
	 * @param {jQuery Object} link The selector or jQuery object of the link
	 */
	$.createIndexHandler = function(count, link) {
		$(link).click(function(event) {
			event.preventDefault();
			var $currentVisibleItem = $(elements).filter(':visible');
			var currentItemIndex = $(elements).index($currentVisibleItem);
			$.stopSlideshow();
			if ($currentVisibleItem.size() <= 1 && count != currentItemIndex) {
				$.fadeToItem(count, currentItemIndex);
			};
		});
	};
	
	/**
	 * Creates one link for each item in the slideshow, to show that item immediately
	 */
	$.createIndexes = function() {
		var $indexContainer = $(settings.indexContainer);
		for (var i=0; i < elements.length; i++) {
			var	$link = $('<li><a href="#">' + (i + 1) + '</a></li>');
			$.createIndexHandler(i, $link);
			$indexContainer.append($link);
		};
	};
	
	/**
	 * Establishes links between the slide elements and index items in the indexContainer
	 */
	$.linkIndexes = function() {
		var $indexContainer = $(settings.indexContainer);
		var $indexContainerChildren = $('> :visible', $indexContainer);
		
		if ($indexContainerChildren.size() == elements.length) {
			var count = elements.length;
			for (var i=0; i < count; i++) {
				$('a', $indexContainer).click(function(event) {event.preventDefault();});
				$.createIndexHandler(i, $indexContainerChildren[i]);
			};
		} else {
			alert("There is a different number of items in the menu and slides. There needs to be the same number in both.\nThere are " + $indexContainerChildren.size() + " in the indexContainer.\nThere are " + elements.length + " in the slides container.");
		};		
	};
	
	/**
	 * Determines if the index container is empty or not. If its empty then it generates links, if its not empty it links one to one
	 */
	$.innerFadeIndex = function() {
		var $indexContainer = $(settings.indexContainer);
		if ($(':visible', $indexContainer).size() <= 0) {
			$.createIndexes();
		} else {
			$.linkIndexes();
		};
	};
	
	/**
	 * Changes the text of the current item selector to the index of the current item
	 */
	$.currentItem = function(current) {
		var $container = $(settings.currentItemContainer);
		$container.text(current + 1);
	};
	
	/**
	 * Changes the text of the total item selector to the total number of items
	 */
	$.totalItems = function() {
		var $container = $(settings.totalItemsContainer);
		$container.text(elements.length);
	};
})(jQuery);