/* =========================================================
// jquery.innerFade.js

// Date: 2010-07-23
// Author: Wes Baker
// Mail: wes@wesbaker.com
// Web: http://www.wesbaker.com
// ========================================================= */

(function($) {
	var default_options = {
		'animationType':			'fade',
		'animate': 					true,
		'first_slide': 				0,
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
		'pauseLink':				null,
		'prevLink':					null,
		'nextLink':					null,
		'indexContainer': 			null,
		'currentItemContainer': 	null,
		'totalItemsContainer': 		null,
		'callback_index_update': 	null
	};

	$(function() {
	    window.isActive = true;
	    $(window).focus(function() { this.isActive = true; });
	    $(window).blur(function() { this.isActive = false; });
	});

	$.fn.innerFade = function(options) {
		return this.each(function() {
			$fade_object = new Object();
			// Assign the container
			$fade_object.container = this;
			// Combine default and set settings or use default
			// Pay attention kids, there's an important lesson here. When using $.extend, the first parameter will
			// be CHANGED to the combination of all the parameters. In my situation, I just wanted to combine two
			// objects, but not affect them in any way hence the empty object.
			$fade_object.settings = $.extend({}, default_options, options);
			// If children option is set use that as elements, otherwise use the called jQuery object
			$fade_object.elements = ($fade_object.settings.children === null) ? $($fade_object.container).children() : $($fade_object.container).children($fade_object.settings.children);
			// Setup the count
			$fade_object.count = 0;
			// Save data to container for use later
			$($fade_object.container).data('object', $fade_object);

			// Start the loop
			if ($fade_object.elements.length > 1) {
				// Establish the Next and Previous Handlers
				if ($fade_object.settings.nextLink || $fade_object.settings.prevLink) {
					$.bindControls($fade_object);
				}

				// Establish Cancel Handler
				if ($fade_object.settings.cancelLink) { $.bindCancel($fade_object); };

				// Set outer container as relative, and use the height that's set and add the running class
				$($fade_object.container).css({'position': 'relative'}).addClass($fade_object.settings.runningClass);
				if ($fade_object.settings.containerHeight == 'auto') {
					height = $($fade_object.elements).filter(':first').height();
					$($fade_object.container).css({'height': height + 'px'});
				} else {
					$($fade_object.container).css({'height': $fade_object.settings.containerHeight});
				};

				// Build the Index if one is specified
				if ($fade_object.settings.indexContainer) {
					$.innerFadeIndex($fade_object);
				};

				// Set the z-index from highest to lowest (20, 19, 18...), hide everything and set position as absolute
				for (var i = 0; i < $fade_object.elements.length; i++) {
					$($fade_object.elements[i]).hide(0).css('z-index', String($fade_object.elements.length-i)).css('position', 'absolute');
				}

				var toShow = '';
				var toHide = '';

				if ($fade_object.settings.type == "random") {
					toShow = Math.floor(Math.random() * $fade_object.elements.length);
					do {
						toHide = Math.floor(Math.random() * $fade_object.elements.length);
					} while (toHide == toShow);
				} else if ( $fade_object.settings.type == 'random_start' ) {
					$fade_object.settings.type = 'sequence';
					toHide = Math.floor ( Math.random () * ( $fade_object.elements.length ) );
					toShow = (toHide + 1) % $fade_object.elements.length;
				} else {
					// Otherwise and if its sequence
					toShow = $fade_object.settings.first_slide;
					toHide = ($fade_object.settings.first_slide == 0) ? $fade_object.elements.length - 1 : $fade_object.settings.first_slide - 1;
				}

				if ($fade_object.settings.animate) {
					$.fadeTimeout($fade_object, toShow, toHide, true);
				} else {
					$($fade_object.elements[toShow]).show();
					$($fade_object.elements[toHide]).hide();
					$.updateIndexes($fade_object, toShow);
				};
				$.updateIndexes($fade_object, toShow);

				$($fade_object.elements[toShow]).show();

				// Set item count containers
				if ($fade_object.settings.currentItemContainer) { $.currentItem($fade_object, toShow); };
				if ($fade_object.settings.totalItemsContainer) { $.totalItems($fade_object); };

				// Establish the Pause Handler
				if ($fade_object.settings.pauseLink) {
					$.bind_pause($fade_object);
				};
			}
		});
	};

	/**
	 * Public function to change to a specific slide. This is expecting a zero-index slide number.
	 * @param {Number} slide_number Zero-indexed slide number
	 */
	$.fn.innerFadeTo = function(slide_number) {
		return this.each(function(index) {
			var $fade_object = $(this).data('object');

			var $currentVisibleItem = $($fade_object.elements).filter(':visible');
			var currentItemIndex = $($fade_object.elements).index($currentVisibleItem);
			$.stopSlideshow($fade_object);
			if (slide_number != currentItemIndex) {
				$.fadeToItem($fade_object, slide_number, currentItemIndex);
			};
		});
	};

	/**
	 * Fades the slideshow to the item selected from the previous item
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 * @param {Number} toShow The position in the elements array of the item to be shown
	 * @param {Number} toHide The position in the elements array of the item to be hidden
	 */
	$.fadeToItem = function($fade_object, toShow, toHide) {
		var speed = $fade_object.settings.speed;

		switch ($fade_object.settings.animationType) {
			case "slide":
				$($fade_object.elements[toHide]).slideUp(speed);
				$($fade_object.elements[toShow]).slideDown(speed);
				break;
			case "slideOver":
				var itemWidth = $($fade_object.elements[0]).width(),
					to_hide_css = {},
					to_show_css = {},
					to_hide_animation = {},
					to_show_animation = {};

				$($fade_object.container).css({'overflow': 'hidden'});

				// Both CSS Declarations use the same initial CSS
				to_hide_css = {
					'position': 'absolute',
					'top': '0px'
				};

				to_show_css = $.extend({}, to_hide_css);

				// If going forward, we want the item (to be shown) to animate from the right to left
				// If going backwards, we want the item (to be shown) to animate from the left to the right
				if (toShow > toHide) { // Forwards
					to_hide_css.left = "0px";
					to_hide_css.right = "auto";

					to_show_css.left = 'auto';
					to_show_css.right = '-' + itemWidth + 'px';

					to_hide_animation.left = '-' + itemWidth + 'px';

					to_show_animation.right = '0px';

					console.log(to_hide_css);
				} else { // Backwards
					to_hide_css.left = "auto";
					to_hide_css.right = "0px";

					to_show_css.left = '-' + itemWidth + 'px';
					to_show_css.right = 'auto';

					to_hide_animation.right = '-' + itemWidth + 'px';

					to_show_animation.left = '0px';
				};

				$($fade_object.elements[toHide]).css(to_hide_css);
				$($fade_object.elements[toShow]).css(to_show_css).show();

				$($fade_object.elements[toHide]).animate(to_hide_animation, speed, $fade_object.settings.easing, function() {
					$(this).hide();
				});

				$($fade_object.elements[toShow]).animate(to_show_animation ,speed, $fade_object.settings.easing);
				break;
			case "fadeEmpty":
				$($fade_object.elements[toHide]).fadeOut(speed, function () {
					$($fade_object.elements[toShow]).fadeIn(speed);
				});
				break;
			case "slideEmpty":
				$($fade_object.elements[toHide]).slideUp(speed, function () {
					$($fade_object.elements[toShow]).slideDown(speed);
				});
				break;
			default:
				$($fade_object.elements[toHide]).fadeOut(speed);
				$($fade_object.elements[toShow]).fadeIn(speed);
			break;
		}

		// Update the toShow item
		if ($fade_object.settings.currentItemContainer) {
			$.currentItem($fade_object, toShow);
		};

		// Update indexes with active classes
		if ($fade_object.settings.indexContainer || $fade_object.settings.callback_index_update) {
			$.updateIndexes($fade_object, toShow);
		};
	};

	/**
	 * Fades to the item of your choosing and establishes the timeout for the next item to fade to
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 * @param {Number} toShow The position in the elements array of the item to be shown
	 * @param {Number} toHide The position in the elements array of the item to be hidden
	 * @param {Boolean} firstRun If this is the first run of innerfade, pass true, otherwise pass false
	 */
	$.fadeTimeout = function($fade_object, toShow, toHide, firstRun) {

		// only process if window is active, otherwise just call the same function
		if (window.isActive) {
			// If its not the first run, then fade
			if (firstRun != true) {
				$.fadeToItem($fade_object, toShow, toHide);
			};

			// Increment the count of slides shown
			$fade_object.count++;

			// 	Check if loop is false, if it is check to see how many slides have been shown.
			// In the case that you're at the last slide, stop the slideshow and return.
			if ($fade_object.settings.loop == false && $fade_object.count >= $fade_object.elements.length) {
				$.stopSlideshow($fade_object);
				return;
			};

			// Get ready for next fade
			if ($fade_object.settings.type == "random") {
				toHide = toShow;
				while (toShow == toHide) { toShow = Math.floor(Math.random() * $fade_object.elements.length); }
			} else {
				toHide = (toHide > toShow) ? 0 : toShow;
				toShow = (toShow + 1 >= $fade_object.elements.length) ? 0 : toShow + 1;
			}

		};

		// Set the time out; if its first run and a start delay exists, use the start delay
		var timeout = (firstRun && $fade_object.settings.startDelay) ? $fade_object.settings.startDelay : $fade_object.settings.timeout;
		$($fade_object.container).data('current_timeout', setTimeout((function() { $.fadeTimeout($fade_object, toShow, toHide, false); }), timeout));
	};

	/* Allows the unbind function to be called from javascript */
	$.fn.innerFadeUnbind = function() {
		return this.each(function(index) {
			var $fade_object = $(this).data('object');
			$.stopSlideshow($fade_object);
		});
	};

	/**
	 * Stops the slideshow
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 */
	$.stopSlideshow = function($fade_object) {
		clearTimeout($($fade_object.container).data('current_timeout'));
		$($fade_object.container).data('current_timeout', null);
	};

	/**
	 * Establishes the Next and Previous link behavior
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 */
	$.bindControls = function($fade_object) {
		$($fade_object.settings.nextLink).on('click', function(event) {
			event.preventDefault();
			$.stopSlideshow($fade_object);

			var $currentElement = $($fade_object.elements).filter(':visible');
			var currentElementIndex = $($fade_object.elements).index($currentElement);

			var $nextElement = ($currentElement.next().length > 0) ? $currentElement.next() : $($fade_object.elements).filter(':first');
			var nextElementIndex = $($fade_object.elements).index($nextElement);

			$.fadeToItem($fade_object, nextElementIndex, currentElementIndex);
		});

		$($fade_object.settings.prevLink).on('click', function(event) {
			event.preventDefault();
			$.stopSlideshow($fade_object);

			var $currentElement = $($fade_object.elements).filter(':visible');
			var currentElementIndex = $($fade_object.elements).index($currentElement);

			var $previousElement = ($currentElement.prev().length > 0) ? $currentElement.prev() : $($fade_object.elements).filter(':last');
			var previousElementIndex = $($fade_object.elements).index($previousElement);

			$.fadeToItem($fade_object, previousElementIndex, currentElementIndex);
		});
	};

	/**
	 * Establishes the Pause Button
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 */
	$.bind_pause = function($fade_object) {
		$($fade_object.settings.pauseLink).unbind().click(function(event) {
			event.preventDefault();
			if ($($fade_object.container).data('current_timeout') != null) {
				$.stopSlideshow($fade_object);
			} else {
				// Restart the slideshow
				var tag = $($fade_object.container).children(':first').prop('tagName').toLowerCase();
				var nextItem = '';
				var previousItem = '';

				if ($fade_object.settings.type == "random") {
					previousItem = Math.floor(Math.random() * $fade_object.elements.length);
					do {
						nextItem = Math.floor(Math.random() * $fade_object.elements.length);
					} while (previousItem == nextItem);
				} else if ($fade_object.settings.type == "random_start") {
					previousItem = Math.floor(Math.random() * $fade_object.elements.length);
					nextItem = (previousItem + 1) % $fade_object.elements.length;
				} else {
					previousItem = $(tag, $($fade_object.container)).index($(tag+':visible', $($fade_object.container)));
					nextItem = ((previousItem + 1) == $fade_object.elements.length) ? 0 : previousItem + 1;
				}

				$.fadeTimeout($fade_object, nextItem, previousItem, false);
			}
		});
	};

	/**
	 * Establishes the Cancel Button
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 */
	$.bindCancel = function($fade_object) {
		$($fade_object.settings.cancelLink).unbind().click(function(event) {
			event.preventDefault();
			$.stopSlideshow($fade_object);
		});
	};

	/**
	 * Updates the indexes and adds an active class to the visible item
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 * @param {Number} toShow The position in the elements array of the item to be shown
	 */
	$.updateIndexes = function($fade_object, toShow) {
		$($fade_object.settings.indexContainer).children().removeClass('active');
		$('> :eq(' + toShow + ')', $($fade_object.settings.indexContainer)).addClass('active');

		// Check for the callback index update
		if (typeof($fade_object.settings.callback_index_update) == "function") {
			$fade_object.settings.callback_index_update.call(this, toShow);
		};
	};

	/**
	 * Creates handlers for the links created by the $.handleIndexes and $.generateIndexes functions
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 * @param {Number} count The item to be setting the link on
	 * @param {jQuery Object} link The selector or jQuery object of the link
	 */
	$.createIndexHandler = function($fade_object, count, link) {
		$(link).click(function(event) {
			event.preventDefault();
			var $currentVisibleItem = $($fade_object.elements).filter(':visible');
			var currentItemIndex = $($fade_object.elements).index($currentVisibleItem);
			$.stopSlideshow($fade_object);
			if ($currentVisibleItem.size() <= 1 && count != currentItemIndex) {
				$.fadeToItem($fade_object, count, currentItemIndex);
			};
		});
	};

	/**
	 * Creates one link for each item in the slideshow, to show that item immediately
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 */
	$.createIndexes = function($fade_object) {
		var $indexContainer = $($fade_object.settings.indexContainer);

		for (var i=0; i < $fade_object.elements.length; i++) {
			var	$link = $('<li><a href="#">' + (i + 1) + '</a></li>');
			$.createIndexHandler($fade_object, i, $link);
			$indexContainer.append($link);
		};
	};

	/**
	 * Establishes links between the slide elements and index items in the indexContainer
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 */
	$.linkIndexes = function($fade_object) {
		var $indexContainer = $($fade_object.settings.indexContainer);
		var $indexContainerChildren = $('> :visible', $indexContainer);

		if ($indexContainerChildren.size() == $fade_object.elements.length) {
			var count = $fade_object.elements.length;
			for (var i=0; i < count; i++) {
				$('a', $indexContainer).click(function(event) {event.preventDefault();});
				$.createIndexHandler($fade_object, i, $indexContainerChildren[i]);
			};
		} else {
			alert("There is a different number of items in the menu and slides. There needs to be the same number in both.\nThere are " + $indexContainerChildren.size() + " in the indexContainer.\nThere are " + $fade_object.elements.length + " in the slides container.");
		};
	};

	/**
	 * Determines if the index container is empty or not. If its empty then it generates links, if its not empty
	 * it links one to one
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 */
	$.innerFadeIndex = function($fade_object) {
		var $indexContainer = $($fade_object.settings.indexContainer);
		if ($(':visible', $indexContainer).size() <= 0) {
			$.createIndexes($fade_object);
		} else {
			$.linkIndexes($fade_object);
		};
	};

	/**
	 * Changes the text of the current item selector to the index of the current item
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 * @param {Number} current Index of the current slide
	 */
	$.currentItem = function($fade_object, current) {
		var $container = $($fade_object.settings.currentItemContainer);
		$container.text(current + 1);
	};

	/**
	 * Changes the text of the total item selector to the total number of items
	 * @param {Object} $fade_object The object that contains the settings, elements and container for this slideshow
	 */
	$.totalItems = function($fade_object) {
		var $container = $($fade_object.settings.totalItemsContainer);
		$container.text($fade_object.elements.length);
	};
})(jQuery);
