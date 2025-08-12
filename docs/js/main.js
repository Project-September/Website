// Main JavaScript for PC Game Official Site

document.addEventListener("DOMContentLoaded", function () {
	// Mobile menu toggle functionality
	initMobileMenu();

	// Smooth scrolling for anchor links
	initSmoothScrolling();

	// Image lazy loading
	initLazyLoading();

	// Enhanced lazy loading for game detail page
	initEnhancedLazyLoading();

	// Screenshot lightbox functionality
	initScreenshotLightbox();

	// Video player functionality
	initVideoPlayer();
});

// Mobile menu functionality
function initMobileMenu() {
	const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
	const mobileMenu = document.querySelector(".mobile-menu");

	if (mobileMenuToggle && mobileMenu) {
		mobileMenuToggle.addEventListener("click", function () {
			mobileMenu.classList.toggle("active");
			mobileMenuToggle.classList.toggle("active");

			// Toggle aria-expanded attribute for accessibility
			const isExpanded = mobileMenuToggle.getAttribute("aria-expanded") === "true";
			mobileMenuToggle.setAttribute("aria-expanded", !isExpanded);
		});

		// Close mobile menu when clicking outside
		document.addEventListener("click", function (event) {
			if (!mobileMenuToggle.contains(event.target) && !mobileMenu.contains(event.target)) {
				mobileMenu.classList.remove("active");
				mobileMenuToggle.classList.remove("active");
				mobileMenuToggle.setAttribute("aria-expanded", "false");
			}
		});

		// Close mobile menu on window resize
		window.addEventListener("resize", function () {
			if (window.innerWidth > 768) {
				mobileMenu.classList.remove("active");
				mobileMenuToggle.classList.remove("active");
				mobileMenuToggle.setAttribute("aria-expanded", "false");
			}
		});
	}
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
	const anchorLinks = document.querySelectorAll('a[href^="#"]');

	anchorLinks.forEach((link) => {
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

// Basic lazy loading for images
function initLazyLoading() {
	const images = document.querySelectorAll("img[data-src]");

	if ("IntersectionObserver" in window) {
		const imageObserver = new IntersectionObserver((entries, observer) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const img = entry.target;
					img.src = img.dataset.src;
					img.classList.remove("lazy");
					imageObserver.unobserve(img);
				}
			});
		});

		images.forEach((img) => imageObserver.observe(img));
	} else {
		// Fallback for browsers without IntersectionObserver
		images.forEach((img) => {
			img.src = img.dataset.src;
			img.classList.remove("lazy");
		});
	}
}

// Utility function for handling image load errors
function handleImageError(img) {
	img.src = "/images/placeholder.jpg";
	img.alt = "画像を読み込めませんでした";
}

// Screenshot lightbox functionality
function initScreenshotLightbox() {
	const screenshotItems = document.querySelectorAll(".screenshot-item");
	const lightboxModal = document.getElementById("lightbox-modal");

	if (screenshotItems.length === 0 || !lightboxModal) return;

	const lightboxImage = document.getElementById("lightbox-image");
	const lightboxCaption = document.getElementById("lightbox-caption");
	const closeBtn = lightboxModal.querySelector(".lightbox-close");
	const prevBtn = document.getElementById("lightbox-prev");
	const nextBtn = document.getElementById("lightbox-next");

	let currentIndex = 0;
	const screenshots = Array.from(screenshotItems);

	// Open lightbox
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

		// Update navigation buttons visibility
		if (screenshots.length <= 1) {
			prevBtn.style.display = "none";
			nextBtn.style.display = "none";
		} else {
			prevBtn.style.display = "block";
			nextBtn.style.display = "block";
		}
	}

	// Close lightbox
	function closeLightbox() {
		lightboxModal.classList.remove("active");
		document.body.style.overflow = "";
	}

	// Navigate to previous image
	function prevImage() {
		currentIndex = (currentIndex - 1 + screenshots.length) % screenshots.length;
		openLightbox(currentIndex);
	}

	// Navigate to next image
	function nextImage() {
		currentIndex = (currentIndex + 1) % screenshots.length;
		openLightbox(currentIndex);
	}

	// Add click events to screenshots
	screenshotItems.forEach((item, index) => {
		item.addEventListener("click", () => openLightbox(index));
		item.style.cursor = "pointer";

		// Add keyboard support for screenshot items
		item.setAttribute("tabindex", "0");
		item.setAttribute("role", "button");
		item.setAttribute("aria-label", `スクリーンショット ${index + 1} を拡大表示`);

		item.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				openLightbox(index);
			}
		});
	});

	// Add event listeners
	if (closeBtn) {
		closeBtn.addEventListener("click", closeLightbox);
	}

	if (prevBtn) {
		prevBtn.addEventListener("click", prevImage);
	}

	if (nextBtn) {
		nextBtn.addEventListener("click", nextImage);
	}

	// Close lightbox when clicking outside the image
	lightboxModal.addEventListener("click", (e) => {
		if (e.target === lightboxModal) {
			closeLightbox();
		}
	});

	// Keyboard navigation
	document.addEventListener("keydown", (e) => {
		if (lightboxModal.classList.contains("active")) {
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
		}
	});
}

// Video player functionality
function initVideoPlayer() {
	const videoThumbnails = document.querySelectorAll(".video-thumbnail");
	const videoModal = document.getElementById("video-modal");

	if (videoThumbnails.length === 0 || !videoModal) return;

	const videoPlayerContainer = document.getElementById("video-player-container");
	const videoCloseBtn = videoModal.querySelector(".video-modal-close");

	// Open video modal
	function openVideoModal(videoId, videoType) {
		let embedHTML = "";

		if (videoType === "youtube") {
			embedHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
						 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
						 allowfullscreen></iframe>`;
		} else {
			// For local videos or other types
			embedHTML = `<video controls autoplay>
						 <source src="${videoId}" type="video/mp4">
						 お使いのブラウザは動画タグをサポートしていません。
						 </video>`;
		}

		videoPlayerContainer.innerHTML = embedHTML;
		videoModal.classList.add("active");
		document.body.style.overflow = "hidden";
	}

	// Close video modal
	function closeVideoModal() {
		videoModal.classList.remove("active");
		videoPlayerContainer.innerHTML = "";
		document.body.style.overflow = "";
	}

	// Add click events to video thumbnails
	videoThumbnails.forEach((thumbnail) => {
		const videoId = thumbnail.getAttribute("data-video-id");
		const videoType = thumbnail.getAttribute("data-video-type") || "youtube";

		thumbnail.addEventListener("click", () => {
			openVideoModal(videoId, videoType);
		});

		// Add keyboard support
		thumbnail.setAttribute("tabindex", "0");
		thumbnail.setAttribute("role", "button");
		thumbnail.setAttribute("aria-label", "動画を再生");

		thumbnail.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				openVideoModal(videoId, videoType);
			}
		});
	});

	// Add event listeners
	if (videoCloseBtn) {
		videoCloseBtn.addEventListener("click", closeVideoModal);
	}

	// Close video modal when clicking outside
	videoModal.addEventListener("click", (e) => {
		if (e.target === videoModal) {
			closeVideoModal();
		}
	});

	// Keyboard navigation
	document.addEventListener("keydown", (e) => {
		if (videoModal.classList.contains("active") && e.key === "Escape") {
			closeVideoModal();
		}
	});
}

// Enhanced lazy loading with better error handling
function initEnhancedLazyLoading() {
	const lazyImages = document.querySelectorAll(".lazy-load");

	if ("IntersectionObserver" in window) {
		const imageObserver = new IntersectionObserver(
			(entries, observer) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const img = entry.target;
						const src = img.getAttribute("data-src") || img.src;

						// Create a new image to preload
						const newImg = new Image();
						newImg.onload = () => {
							img.src = src;
							img.classList.add("loaded");
							img.classList.remove("lazy-load");
						};
						newImg.onerror = () => {
							img.src = "/images/placeholder.jpg";
							img.alt = "画像を読み込めませんでした";
							img.classList.add("loaded");
							img.classList.remove("lazy-load");
						};
						newImg.src = src;

						imageObserver.unobserve(img);
					}
				});
			},
			{
				rootMargin: "50px 0px",
				threshold: 0.01,
			}
		);

		lazyImages.forEach((img) => {
			imageObserver.observe(img);
		});
	} else {
		// Fallback for browsers without IntersectionObserver
		lazyImages.forEach((img) => {
			const src = img.getAttribute("data-src") || img.src;
			img.src = src;
			img.classList.add("loaded");
			img.classList.remove("lazy-load");
		});
	}
}

// Export functions for potential use in other scripts
window.GameSite = {
	initMobileMenu,
	initSmoothScrolling,
	initLazyLoading,
	initEnhancedLazyLoading,
	initScreenshotLightbox,
	initVideoPlayer,
	handleImageError,
};
