// Main JavaScript for PC Game Official Site

document.addEventListener("DOMContentLoaded", function () {
	// Mobile menu toggle functionality
	initMobileMenu();

	// Smooth scrolling for anchor links
	initSmoothScrolling();

	// Image lazy loading
	initLazyLoading();

	// Screenshot lightbox functionality
	initScreenshotLightbox();
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

	if (screenshotItems.length === 0) return;

	// Create lightbox HTML
	const lightboxHTML = `
		<div id="screenshot-lightbox" class="lightbox" style="display: none;">
			<div class="lightbox-overlay"></div>
			<div class="lightbox-content">
				<button class="lightbox-close" aria-label="閉じる">&times;</button>
				<img class="lightbox-image" src="" alt="">
				<div class="lightbox-caption"></div>
				<button class="lightbox-prev" aria-label="前の画像">&#8249;</button>
				<button class="lightbox-next" aria-label="次の画像">&#8250;</button>
			</div>
		</div>
	`;

	document.body.insertAdjacentHTML("beforeend", lightboxHTML);

	const lightbox = document.getElementById("screenshot-lightbox");
	const lightboxImage = lightbox.querySelector(".lightbox-image");
	const lightboxCaption = lightbox.querySelector(".lightbox-caption");
	const closeBtn = lightbox.querySelector(".lightbox-close");
	const prevBtn = lightbox.querySelector(".lightbox-prev");
	const nextBtn = lightbox.querySelector(".lightbox-next");
	const overlay = lightbox.querySelector(".lightbox-overlay");

	let currentIndex = 0;
	const screenshots = Array.from(screenshotItems);

	// Open lightbox
	function openLightbox(index) {
		currentIndex = index;
		const screenshot = screenshots[index];
		const img = screenshot.querySelector(".screenshot-image");
		const caption = screenshot.querySelector(".screenshot-caption");

		lightboxImage.src = img.src;
		lightboxImage.alt = img.alt;
		lightboxCaption.textContent = caption ? caption.textContent : "";

		lightbox.style.display = "flex";
		document.body.style.overflow = "hidden";

		// Update navigation buttons
		prevBtn.style.display = screenshots.length > 1 ? "block" : "none";
		nextBtn.style.display = screenshots.length > 1 ? "block" : "none";
	}

	// Close lightbox
	function closeLightbox() {
		lightbox.style.display = "none";
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
	});

	// Add event listeners
	closeBtn.addEventListener("click", closeLightbox);
	overlay.addEventListener("click", closeLightbox);
	prevBtn.addEventListener("click", prevImage);
	nextBtn.addEventListener("click", nextImage);

	// Keyboard navigation
	document.addEventListener("keydown", (e) => {
		if (lightbox.style.display === "flex") {
			switch (e.key) {
				case "Escape":
					closeLightbox();
					break;
				case "ArrowLeft":
					prevImage();
					break;
				case "ArrowRight":
					nextImage();
					break;
			}
		}
	});
}

// Export functions for potential use in other scripts
window.GameSite = {
	initMobileMenu,
	initSmoothScrolling,
	initLazyLoading,
	initScreenshotLightbox,
	handleImageError,
};
