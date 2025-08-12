// Lightbox functionality - Loaded on demand

(function () {
	"use strict";

	let currentIndex = 0;
	let screenshots = [];
	let lightboxModal = null;
	let lightboxImage = null;
	let lightboxCaption = null;

	function initLightbox() {
		const screenshotItems = document.querySelectorAll(".screenshot-item");
		lightboxModal = document.getElementById("lightbox-modal");

		if (screenshotItems.length === 0 || !lightboxModal) return;

		lightboxImage = document.getElementById("lightbox-image");
		lightboxCaption = document.getElementById("lightbox-caption");
		screenshots = Array.from(screenshotItems);

		// Add click events
		screenshotItems.forEach(function (item, index) {
			item.addEventListener("click", function () {
				openLightbox(index);
			});

			// Keyboard support
			item.setAttribute("tabindex", "0");
			item.setAttribute("role", "button");
			item.addEventListener("keydown", function (e) {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					openLightbox(index);
				}
			});
		});

		// Control buttons
		const closeBtn = lightboxModal.querySelector(".lightbox-close");
		const prevBtn = document.getElementById("lightbox-prev");
		const nextBtn = document.getElementById("lightbox-next");

		if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
		if (prevBtn) prevBtn.addEventListener("click", prevImage);
		if (nextBtn) nextBtn.addEventListener("click", nextImage);

		// Close on overlay click
		lightboxModal.addEventListener("click", function (e) {
			if (e.target === lightboxModal) closeLightbox();
		});

		// Keyboard navigation
		document.addEventListener("keydown", function (e) {
			if (!lightboxModal.classList.contains("active")) return;

			switch (e.key) {
				case "Escape":
					closeLightbox();
					break;
				case "ArrowLeft":
					if (screenshots.length > 1) prevImage();
					break;
				case "ArrowRight":
					if (screenshots.length > 1) nextImage();
					break;
			}
		});
	}

	function openLightbox(index) {
		currentIndex = index;
		const screenshot = screenshots[index];
		const img = screenshot.querySelector(".screenshot-image");
		const captionText = img.getAttribute("data-caption") || img.alt;

		lightboxImage.src = img.src || img.getAttribute("data-src");
		lightboxImage.alt = img.alt;
		lightboxCaption.textContent = captionText;

		lightboxModal.classList.add("active");
		document.body.style.overflow = "hidden";

		// Update navigation visibility
		const prevBtn = document.getElementById("lightbox-prev");
		const nextBtn = document.getElementById("lightbox-next");

		if (screenshots.length <= 1) {
			if (prevBtn) prevBtn.style.display = "none";
			if (nextBtn) nextBtn.style.display = "none";
		} else {
			if (prevBtn) prevBtn.style.display = "block";
			if (nextBtn) nextBtn.style.display = "block";
		}
	}

	function closeLightbox() {
		lightboxModal.classList.remove("active");
		document.body.style.overflow = "";
	}

	function prevImage() {
		currentIndex = (currentIndex - 1 + screenshots.length) % screenshots.length;
		openLightbox(currentIndex);
	}

	function nextImage() {
		currentIndex = (currentIndex + 1) % screenshots.length;
		openLightbox(currentIndex);
	}

	// Initialize when DOM is ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initLightbox);
	} else {
		initLightbox();
	}

	// Export
	window.GameSite = window.GameSite || {};
	window.GameSite.initLightbox = initLightbox;
})();
