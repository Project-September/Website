// Enhanced Lazy Loading with Responsive Images

(function () {
	"use strict";

	let imageObserver;
	let pictureObserver;

	function initLazyLoading() {
		// Lazy load regular images
		initImageLazyLoading();

		// Lazy load picture elements
		initPictureLazyLoading();

		// Lazy load background images
		initBackgroundLazyLoading();
	}

	function initImageLazyLoading() {
		const lazyImages = document.querySelectorAll("img[data-src]");

		if (!("IntersectionObserver" in window)) {
			// Fallback for older browsers
			lazyImages.forEach(loadImage);
			return;
		}

		imageObserver = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						loadImage(entry.target);
						imageObserver.unobserve(entry.target);
					}
				});
			},
			{
				rootMargin: "50px 0px",
				threshold: 0.01,
			}
		);

		lazyImages.forEach(function (img) {
			imageObserver.observe(img);
		});
	}

	function initPictureLazyLoading() {
		const lazyPictures = document.querySelectorAll("picture");

		if (!("IntersectionObserver" in window)) {
			// Fallback for older browsers
			lazyPictures.forEach(loadPicture);
			return;
		}

		pictureObserver = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						loadPicture(entry.target);
						pictureObserver.unobserve(entry.target);
					}
				});
			},
			{
				rootMargin: "50px 0px",
				threshold: 0.01,
			}
		);

		lazyPictures.forEach(function (picture) {
			const img = picture.querySelector("img[data-src]");
			if (img) {
				pictureObserver.observe(picture);
			}
		});
	}

	function initBackgroundLazyLoading() {
		const lazyBackgrounds = document.querySelectorAll("[data-bg]");

		if (!("IntersectionObserver" in window)) {
			// Fallback for older browsers
			lazyBackgrounds.forEach(loadBackground);
			return;
		}

		const backgroundObserver = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						loadBackground(entry.target);
						backgroundObserver.unobserve(entry.target);
					}
				});
			},
			{
				rootMargin: "50px 0px",
				threshold: 0.01,
			}
		);

		lazyBackgrounds.forEach(function (element) {
			backgroundObserver.observe(element);
		});
	}

	function loadImage(img) {
		// Create a new image to preload
		const imageLoader = new Image();

		imageLoader.onload = function () {
			// Image loaded successfully
			img.src = img.dataset.src;
			img.classList.remove("lazy");
			img.classList.add("loaded");

			// Remove data-src to prevent reloading
			delete img.dataset.src;

			// Trigger custom event
			img.dispatchEvent(
				new CustomEvent("imageLoaded", {
					detail: { src: img.src },
				})
			);
		};

		imageLoader.onerror = function () {
			// Handle error
			img.src = "/images/placeholder.jpg";
			img.alt = "画像を読み込めませんでした";
			img.classList.remove("lazy");
			img.classList.add("loaded", "error");

			console.warn("Failed to load image:", img.dataset.src);
		};

		// Start loading
		imageLoader.src = img.dataset.src;
	}

	function loadPicture(picture) {
		const sources = picture.querySelectorAll("source[data-srcset]");
		const img = picture.querySelector("img[data-src]");

		// Load source elements
		sources.forEach(function (source) {
			source.srcset = source.dataset.srcset;
			delete source.dataset.srcset;
		});

		// Load img element
		if (img) {
			loadImage(img);
		}
	}

	function loadBackground(element) {
		const bgImage = element.dataset.bg;

		// Preload background image
		const imageLoader = new Image();

		imageLoader.onload = function () {
			element.style.backgroundImage = `url(${bgImage})`;
			element.classList.remove("lazy-bg");
			element.classList.add("loaded-bg");
			delete element.dataset.bg;
		};

		imageLoader.onerror = function () {
			element.classList.remove("lazy-bg");
			element.classList.add("error-bg");
			console.warn("Failed to load background image:", bgImage);
		};

		imageLoader.src = bgImage;
	}

	// Progressive image enhancement
	function enhanceImageQuality() {
		const loadedImages = document.querySelectorAll("img.loaded[data-large]");

		loadedImages.forEach(function (img) {
			// Check if image is in viewport and connection is good
			if (isInViewport(img) && isGoodConnection()) {
				const highResImage = new Image();

				highResImage.onload = function () {
					img.src = img.dataset.large;
					delete img.dataset.large;
					img.classList.add("enhanced");
				};

				highResImage.src = img.dataset.large;
			}
		});
	}

	function isInViewport(element) {
		const rect = element.getBoundingClientRect();
		return (
			rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth)
		);
	}

	function isGoodConnection() {
		if ("connection" in navigator) {
			const connection = navigator.connection;
			return connection.effectiveType === "4g" && !connection.saveData;
		}
		return true; // Assume good connection if API not available
	}

	// Retry failed images
	function retryFailedImages() {
		const failedImages = document.querySelectorAll("img.error[data-src]");

		failedImages.forEach(function (img) {
			img.classList.remove("error");
			loadImage(img);
		});
	}

	// Initialize when DOM is ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initLazyLoading);
	} else {
		initLazyLoading();
	}

	// Enhance image quality after initial load
	window.addEventListener("load", function () {
		setTimeout(enhanceImageQuality, 2000);
	});

	// Retry failed images on network change
	window.addEventListener("online", retryFailedImages);

	// Export functions
	window.GameSite = window.GameSite || {};
	window.GameSite.lazyLoading = {
		init: initLazyLoading,
		loadImage: loadImage,
		loadPicture: loadPicture,
		enhanceImageQuality: enhanceImageQuality,
		retryFailedImages: retryFailedImages,
	};
})();
