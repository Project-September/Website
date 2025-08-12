// Optimized Main JavaScript - Core functionality only

(function () {
	"use strict";

	// Initialize when DOM is ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}

	function init() {
		initMobileMenu();
		initSmoothScrolling();
		initLazyLoading();
	}

	// Mobile menu functionality - Critical
	function initMobileMenu() {
		const toggle = document.querySelector(".mobile-menu-toggle");
		const menu = document.querySelector(".mobile-navigation");

		if (!toggle || !menu) return;

		toggle.addEventListener("click", function () {
			const isActive = menu.classList.contains("active");
			menu.classList.toggle("active");
			toggle.classList.toggle("active");
			toggle.setAttribute("aria-expanded", !isActive);
		});

		// Close on outside click
		document.addEventListener("click", function (e) {
			if (!toggle.contains(e.target) && !menu.contains(e.target)) {
				menu.classList.remove("active");
				toggle.classList.remove("active");
				toggle.setAttribute("aria-expanded", "false");
			}
		});

		// Close on resize
		window.addEventListener("resize", function () {
			if (window.innerWidth > 768) {
				menu.classList.remove("active");
				toggle.classList.remove("active");
				toggle.setAttribute("aria-expanded", "false");
			}
		});
	}

	// Smooth scrolling for anchor links
	function initSmoothScrolling() {
		const links = document.querySelectorAll('a[href^="#"]');

		links.forEach(function (link) {
			link.addEventListener("click", function (e) {
				const href = this.getAttribute("href");
				if (href === "#") return;

				const target = document.querySelector(href);
				if (target) {
					e.preventDefault();
					const headerHeight = document.querySelector("header")?.offsetHeight || 0;
					const targetPosition = target.offsetTop - headerHeight - 20;

					window.scrollTo({
						top: targetPosition,
						behavior: "smooth",
					});
				}
			});
		});
	}

	// Optimized lazy loading
	function initLazyLoading() {
		const images = document.querySelectorAll("img[data-src]");

		if ("IntersectionObserver" in window) {
			const observer = new IntersectionObserver(
				function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							const img = entry.target;
							img.src = img.dataset.src;
							img.classList.remove("lazy");
							img.classList.add("loaded");
							observer.unobserve(img);
						}
					});
				},
				{
					rootMargin: "50px 0px",
					threshold: 0.01,
				}
			);

			images.forEach(function (img) {
				observer.observe(img);
			});
		} else {
			// Fallback
			images.forEach(function (img) {
				img.src = img.dataset.src;
				img.classList.remove("lazy");
				img.classList.add("loaded");
			});
		}
	}

	// Export for potential external use
	window.GameSite = {
		initMobileMenu: initMobileMenu,
		initSmoothScrolling: initSmoothScrolling,
		initLazyLoading: initLazyLoading,
	};
})();
