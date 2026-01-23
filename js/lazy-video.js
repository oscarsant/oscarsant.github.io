/**
 * Lazy Video Loader
 * Loads video sources only when the lightbox is opened
 * This improves initial page load performance
 */

(function () {
	"use strict";

	// Initialize lazy loading for all video elements
	function initLazyVideos() {
		const lightBoxContainers = document.querySelectorAll(".lightbox--cont");

		lightBoxContainers.forEach((container) => {
			const lightBox = container.querySelector(".lightbox");
			const videoElement = container.querySelector("video");
			const galleryItem = container.querySelector(".gallery__item");

			if (!videoElement || !galleryItem || !lightBox) return;

			// Store the original src in a data attribute
			const originalSrc = videoElement.getAttribute("src");
			if (originalSrc && !videoElement.hasAttribute("data-lazy-src")) {
				videoElement.setAttribute("data-lazy-src", originalSrc);
				// Remove the src to prevent loading
				videoElement.removeAttribute("src");
			}

			// Listen for lightbox open
			galleryItem.addEventListener("click", function () {
				loadVideo(videoElement);
			});
		});
	}

	// Load video source and initialize player
	function loadVideo(videoElement) {
		const lazySrc = videoElement.getAttribute("data-lazy-src");

		// Only load if not already loaded
		if (lazySrc && !videoElement.hasAttribute("src")) {
			videoElement.setAttribute("src", lazySrc);

			// Load the video
			videoElement.load();

			// Initialize Plyr if available and not already initialized
			if (typeof Plyr !== "undefined" && !videoElement.plyr) {
				new Plyr(videoElement, {
					controls: ["play-large", "play", "progress", "mute", "fullscreen"],
				});
			}
		}
	}

	// Run when DOM is ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initLazyVideos);
	} else {
		initLazyVideos();
	}
})();
