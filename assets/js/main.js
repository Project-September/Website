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
		initKeyboardNavigation();
		initFocusManagement();
		initSkipLinks();
	}

	// Mobile menu functionality - Critical with accessibility
	function initMobileMenu() {
		const toggle = document.querySelector(".mobile-menu-toggle");
		const menu = document.querySelector(".mobile-navigation");

		if (!toggle || !menu) return;

		// Set initial ARIA attributes
		toggle.setAttribute("aria-expanded", "false");
		menu.setAttribute("aria-hidden", "true");

		toggle.addEventListener("click", function () {
			const isActive = menu.classList.contains("active");
			const newState = !isActive;

			menu.classList.toggle("active");
			toggle.classList.toggle("active");
			toggle.setAttribute("aria-expanded", newState);
			menu.setAttribute("aria-hidden", !newState);

			// Focus management
			if (newState) {
				// Focus first menu item when opening
				const firstMenuItem = menu.querySelector("a");
				if (firstMenuItem) {
					firstMenuItem.focus();
				}
			}
		});

		// Keyboard navigation for mobile menu
		toggle.addEventListener("keydown", function (e) {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				toggle.click();
			}
		});

		// Close menu with Escape key
		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape" && menu.classList.contains("active")) {
				menu.classList.remove("active");
				toggle.classList.remove("active");
				toggle.setAttribute("aria-expanded", "false");
				menu.setAttribute("aria-hidden", "true");
				toggle.focus(); // Return focus to toggle button
			}
		});

		// Close on outside click
		document.addEventListener("click", function (e) {
			if (!toggle.contains(e.target) && !menu.contains(e.target)) {
				menu.classList.remove("active");
				toggle.classList.remove("active");
				toggle.setAttribute("aria-expanded", "false");
				menu.setAttribute("aria-hidden", "true");
			}
		});

		// Close on resize
		window.addEventListener("resize", function () {
			if (window.innerWidth > 768) {
				menu.classList.remove("active");
				toggle.classList.remove("active");
				toggle.setAttribute("aria-expanded", "false");
				menu.setAttribute("aria-hidden", "true");
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

	// Keyboard navigation enhancement
	function initKeyboardNavigation() {
		// Enhanced keyboard navigation for all interactive elements
		const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');

		interactiveElements.forEach(function (element) {
			// Add focus indicators
			element.addEventListener("focus", function () {
				this.classList.add("keyboard-focus");
			});

			element.addEventListener("blur", function () {
				this.classList.remove("keyboard-focus");
			});

			// Remove focus class on mouse interaction
			element.addEventListener("mousedown", function () {
				this.classList.remove("keyboard-focus");
			});
		});

		// Arrow key navigation for menu items
		const menuItems = document.querySelectorAll(".nav-menu a, .mobile-nav-menu a");
		menuItems.forEach(function (item, index) {
			item.addEventListener("keydown", function (e) {
				let targetIndex;

				switch (e.key) {
					case "ArrowDown":
					case "ArrowRight":
						e.preventDefault();
						targetIndex = (index + 1) % menuItems.length;
						menuItems[targetIndex].focus();
						break;
					case "ArrowUp":
					case "ArrowLeft":
						e.preventDefault();
						targetIndex = (index - 1 + menuItems.length) % menuItems.length;
						menuItems[targetIndex].focus();
						break;
					case "Home":
						e.preventDefault();
						menuItems[0].focus();
						break;
					case "End":
						e.preventDefault();
						menuItems[menuItems.length - 1].focus();
						break;
				}
			});
		});
	}

	// Focus management for dynamic content
	function initFocusManagement() {
		// Trap focus in modal-like elements
		const modals = document.querySelectorAll('[role="dialog"], .modal');

		modals.forEach(function (modal) {
			const focusableElements = modal.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');

			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			modal.addEventListener("keydown", function (e) {
				if (e.key === "Tab") {
					if (e.shiftKey) {
						// Shift + Tab
						if (document.activeElement === firstElement) {
							e.preventDefault();
							lastElement.focus();
						}
					} else {
						// Tab
						if (document.activeElement === lastElement) {
							e.preventDefault();
							firstElement.focus();
						}
					}
				}
			});
		});

		// Announce dynamic content changes
		const announcer = document.createElement("div");
		announcer.setAttribute("aria-live", "polite");
		announcer.setAttribute("aria-atomic", "true");
		announcer.className = "sr-only";
		document.body.appendChild(announcer);

		window.announceToScreenReader = function (message) {
			announcer.textContent = message;
			setTimeout(function () {
				announcer.textContent = "";
			}, 1000);
		};
	}

	// Skip links for keyboard navigation
	function initSkipLinks() {
		// Create skip link if it doesn't exist
		let skipLink = document.querySelector(".skip-link");

		if (!skipLink) {
			skipLink = document.createElement("a");
			skipLink.href = "#main";
			skipLink.className = "skip-link";
			skipLink.textContent = "メインコンテンツにスキップ";
			skipLink.setAttribute("aria-label", "メインコンテンツにスキップ");

			// Insert at the beginning of body
			document.body.insertBefore(skipLink, document.body.firstChild);
		}

		// Handle skip link functionality
		skipLink.addEventListener("click", function (e) {
			e.preventDefault();
			const target = document.querySelector("#main") || document.querySelector("main");

			if (target) {
				target.setAttribute("tabindex", "-1");
				target.focus();

				// Remove tabindex after focus
				target.addEventListener(
					"blur",
					function () {
						target.removeAttribute("tabindex");
					},
					{ once: true }
				);
			}
		});
	}

	// Enhanced smooth scrolling with accessibility
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

					// Respect user's motion preferences
					const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

					window.scrollTo({
						top: targetPosition,
						behavior: prefersReducedMotion ? "auto" : "smooth",
					});

					// Focus management for accessibility
					target.setAttribute("tabindex", "-1");
					target.focus();

					// Announce to screen readers
					if (window.announceToScreenReader) {
						window.announceToScreenReader(`${target.textContent || target.getAttribute("aria-label") || "セクション"}に移動しました`);
					}
				}
			});
		});
	}

	// Export for potential external use
	window.GameSite = {
		initMobileMenu: initMobileMenu,
		initSmoothScrolling: initSmoothScrolling,
		initLazyLoading: initLazyLoading,
		initKeyboardNavigation: initKeyboardNavigation,
		initFocusManagement: initFocusManagement,
		initSkipLinks: initSkipLinks,
	};
})();
