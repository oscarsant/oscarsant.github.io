// Project sharing functionality
document.addEventListener("DOMContentLoaded", function () {
	// Project mapping - maps data-project IDs to their container elements
	const projectMap = new Map();

	// Find all lightbox containers and map them by their data-project attribute
	document
		.querySelectorAll(".lightbox--cont[data-project]")
		.forEach((container) => {
			const projectId = container.getAttribute("data-project");
			if (projectId) {
				projectMap.set(projectId, container);
			}
		});

	// Create share modal HTML
	function createShareModal() {
		const modal = document.createElement("div");
		modal.className = "share-modal";
		modal.id = "shareModal";
		modal.innerHTML = `
			<div class="share-modal-overlay"></div>
			<div class="share-modal-content">
				<button class="share-modal-close" aria-label="Close modal">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M15.25 0.755742L0.75 15.2406M15.25 15.25L0.75 0.75" stroke="currentColor" stroke-linecap="round"/>
					</svg>
				</button>
				<div class="share-modal-icon">
					<svg width="64" height="64" viewBox="0 0 64 64" fill="none">
						<circle cx="32" cy="32" r="28" fill="#FAB071" opacity="0.2"/>
						<path d="M32 20V32M32 32V44M32 32H44M32 32H20" stroke="#FAB071" stroke-width="3" stroke-linecap="round"/>
						<circle cx="44" cy="20" r="4" fill="#FAB071"/>
						<circle cx="20" cy="32" r="4" fill="#FAB071"/>
						<circle cx="44" cy="44" r="4" fill="#FAB071"/>
					</svg>
				</div>
				<h2 class="share-modal-title">Share this project</h2>
				<p class="share-modal-description">Copy the link below to share this project with others!</p>
				<div class="share-link-container">
					<input type="text" class="share-link-input" id="shareLinkInput" readonly>
					<button class="share-copy-btn" id="shareCopyBtn">
						<svg class="copy-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
							<rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
							<path d="M3 11V3C3 2.44772 3.44772 2 4 2H11" stroke="currentColor" stroke-width="1.5"/>
						</svg>
						<span class="copy-text">Copy</span>
						<svg class="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display: none;">
							<path d="M3 8L6.5 11.5L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<span class="copied-text" style="display: none;">Copied!</span>
					</button>
				</div>
			</div>
		`;
		document.body.appendChild(modal);
		return modal;
	}

	// Get or create modal
	function getShareModal() {
		let modal = document.getElementById("shareModal");
		if (!modal) {
			modal = createShareModal();

			// Close modal handlers
			const overlay = modal.querySelector(".share-modal-overlay");
			const closeBtn = modal.querySelector(".share-modal-close");

			overlay.addEventListener("click", closeShareModal);
			closeBtn.addEventListener("click", closeShareModal);

			// Copy button handler
			const copyBtn = modal.querySelector("#shareCopyBtn");
			copyBtn.addEventListener("click", copyShareLink);
		}
		return modal;
	}

	// Open share modal
	function openShareModal(shareUrl, projectName) {
		const modal = getShareModal();
		const input = modal.querySelector("#shareLinkInput");
		const copyBtn = modal.querySelector("#shareCopyBtn");

		// Set the share URL
		input.value = shareUrl;

		// Reset copy button state
		resetCopyButton(copyBtn);

		// Show modal
		modal.classList.add("active");
		document.body.style.overflow = "hidden";

		// Focus and select the input
		setTimeout(() => {
			input.focus();
			input.select();
		}, 100);
	}

	// Close share modal
	function closeShareModal() {
		const modal = document.getElementById("shareModal");
		if (modal) {
			modal.classList.remove("active");
			document.body.style.overflow = "";
		}
	}

	// Copy share link
	function copyShareLink() {
		const input = document.getElementById("shareLinkInput");
		const copyBtn = document.getElementById("shareCopyBtn");

		// Copy to clipboard
		input.select();
		input.setSelectionRange(0, 99999); // For mobile devices

		navigator.clipboard
			.writeText(input.value)
			.then(() => {
				// Show success state
				const copyIcon = copyBtn.querySelector(".copy-icon");
				const checkIcon = copyBtn.querySelector(".check-icon");
				const copyText = copyBtn.querySelector(".copy-text");
				const copiedText = copyBtn.querySelector(".copied-text");

				copyIcon.style.display = "none";
				copyText.style.display = "none";
				checkIcon.style.display = "block";
				copiedText.style.display = "block";

				copyBtn.classList.add("copied");

				// Reset after 2 seconds
				setTimeout(() => {
					resetCopyButton(copyBtn);
				}, 2000);
			})
			.catch((err) => {
				console.error("Failed to copy:", err);
			});
	}

	// Reset copy button
	function resetCopyButton(copyBtn) {
		const copyIcon = copyBtn.querySelector(".copy-icon");
		const checkIcon = copyBtn.querySelector(".check-icon");
		const copyText = copyBtn.querySelector(".copy-text");
		const copiedText = copyBtn.querySelector(".copied-text");

		copyIcon.style.display = "block";
		copyText.style.display = "block";
		checkIcon.style.display = "none";
		copiedText.style.display = "none";

		copyBtn.classList.remove("copied");
	}

	// Handle share button clicks
	document.querySelectorAll(".btn-share").forEach((button) => {
		button.addEventListener("click", function (e) {
			e.stopPropagation();
			const lightboxContainer = this.closest(".lightbox--cont");
			const projectId = lightboxContainer.getAttribute("data-project");

			if (projectId) {
				const shareUrl = `${window.location.origin}${window.location.pathname}?project=${projectId}`;
				const projectName =
					lightboxContainer.querySelector(".project-hed")?.textContent ||
					"Project";

				openShareModal(shareUrl, projectName);
			}
		});
	});

	// Close modal with Escape key
	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") {
			closeShareModal();
		}
	});

	// Check URL for project parameter on page load
	const urlParams = new URLSearchParams(window.location.search);
	const projectParam = urlParams.get("project");

	if (projectParam && projectMap.has(projectParam)) {
		// Wait for page to fully load, then open the lightbox
		setTimeout(() => {
			const container = projectMap.get(projectParam);
			const galleryItem = container.querySelector(".gallery__item");
			if (galleryItem) {
				galleryItem.click();
			}
		}, 500); // Small delay to ensure everything is initialized
	}
});
