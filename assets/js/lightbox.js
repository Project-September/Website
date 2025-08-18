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
		lightboxModal.setAttribute("aria-hidden", "false");
		document.body.style.overflow = "hidden";

		// Focus management
		const closeBtn = lightboxModal.querySelector(".lightbox-close");
		if (closeBtn) {
			closeBtn.focus();
		}

		// Update navigation visibility and ARIA attributes
		const prevBtn = document.getElementById("lightbox-prev");
		const nextBtn = document.getElementById("lightbox-next");

		if (screenshots.length <= 1) {
			if (prevBtn) {
				prevBtn.style.display = "none";
				prevBtn.setAttribute("aria-hidden", "true");
			}
			if (nextBtn) {
				nextBtn.style.display = "none";
				nextBtn.setAttribute("aria-hidden", "true");
			}
		} else {
			if (prevBtn) {
				prevBtn.style.display = "block";
				prevBtn.setAttribute("aria-hidden", "false");
				prevBtn.setAttribute("aria-label", `前の画像 (${currentIndex + 1}/${screenshots.length})`);
			}
			if (nextBtn) {
				nextBtn.style.display = "block";
				nextBtn.setAttribute("aria-hidden", "false");
				nextBtn.setAttribute("aria-label", `次の画像 (${currentIndex + 1}/${screenshots.length})`);
			}
		}

		// Update image counter for screen readers
		lightboxImage.setAttribute("aria-describedby", "lightbox-counter");
		const counter = document.getElementById("lightbox-counter");
		if (counter) {
			counter.textContent = `画像 ${currentIndex + 1} / ${screenshots.length}`;
		}

		// Announce to screen readers
		if (window.announceToScreenReader) {
			window.announceToScreenReader(`ライトボックスを開きました。${captionText}。画像 ${currentIndex + 1} / ${screenshots.length}`);
		}
	}

	function closeLightbox() {
		lightboxModal.classList.remove("active");
		lightboxModal.setAttribute("aria-hidden", "true");
		document.body.style.overflow = "";

		// Return focus to the trigger element
		const triggerElement = screenshots[currentIndex];
		if (triggerElement) {
			triggerElement.focus();
		}

		// Announce to screen readers
		if (window.announceToScreenReader) {
			window.announceToScreenReader("ライトボックスを閉じました");
		}
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
