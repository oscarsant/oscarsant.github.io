$(document).ready(function () {
	// Function to sync gallery heights so grid cells are square
	function syncGalleryHeights() {
		const galleries = document.querySelectorAll(".gallery");
		if (galleries.length === 0) return;

		// Wait for layout to be complete
		setTimeout(() => {
			// Find the maximum width among all galleries to use as reference
			let maxWidth = 0;
			galleries.forEach((gallery) => {
				const width = gallery.offsetWidth;
				console.log("Gallery width:", width, gallery.className);
				if (width > maxWidth) maxWidth = width;
			});

			const isMobile = window.innerWidth <= 479;
			const gapSize = window.innerWidth <= 991 ? 5 : 10;
			const columns = isMobile ? 6 : 8;

			// Calculate the width of one column (this is our base unit)
			const totalColumnGaps = (columns - 1) * gapSize;
			const columnWidth = (maxWidth - totalColumnGaps) / columns;

			// Each row should be the same height as one column (square cells)
			const rowHeight = columnWidth;

			console.log("Column width (base unit):", columnWidth);

			// Apply height to each gallery based on its specific row count
			galleries.forEach((gallery) => {
				let rows;

				// Determine row count for this specific gallery
				// Reduced from 12/9 to make galleries less vertical
				if (gallery.classList.contains("gallery--new")) {
					rows = isMobile ? 12 : 6; // gallery--new: reduced from 9 to 6 rows
				} else {
					rows = isMobile ? 22 : 8; // standard gallery: reduced from 12 to 8 rows
				}

				// Calculate height for this gallery
				const totalRowGaps = (rows - 1) * gapSize;
				const height = rows * rowHeight + totalRowGaps;

				console.log(
					"Gallery:",
					gallery.className,
					"Rows:",
					rows,
					"Height:",
					height
				);

				gallery.style.height = height + "px";
			});
		}, 100);
	}

	// Run on load
	syncGalleryHeights();

	// Also run after images might have loaded
	window.addEventListener("load", syncGalleryHeights);

	// Run on resize
	window.addEventListener("resize", syncGalleryHeights);

	const players = Array.from(document.querySelectorAll(".js-player")).map(
		(p) => {
			const plr = new Plyr(p, {
				controls: [
					"play-large", // The large play button in the center
					"play", // Play/pause playback
					"progress", // The progress bar and scrubber for playback and buffering
					// 'current-time', // The current time of playback
					// 'duration', // The full duration of the media
					"mute",
					"fullscreen",
				],

				// fullscreen: { enabled: false, fallback: false, iosNative: false, container: null }
			});
		}
	);

	const lightBoxCont = document.querySelectorAll(".lightbox--cont");
	lightBoxCont.forEach((el) => {
		// console.log(el)

		const lightBox = el.querySelector(".lightbox");
		const closebtn = el.querySelector(".btn-close");
		const videoElement = el.querySelector("video");
		const bclick = el.querySelector(".gallery__item");

		bclick.addEventListener("click", (event) => {
			lightBox.classList.remove("closing");
			lightBox.className = "lightbox open";
			document.body.style.overflow = "hidden";

			// console.log(lightBox)
		});

		closebtn.addEventListener("click", (event) => {
			if (lightBox.classList.contains("open")) {
				lightBox.classList.add("closing");
				lightBox.classList.remove("open");

				// Wait for animation to finish before hiding
				setTimeout(() => {
					lightBox.classList.remove("closing");
					lightBox.className = "lightbox";
					document.body.style.overflow = "auto";
					videoElement.pause();
				}, 400); // Match the animation duration (0.4s)
			}
		});
	});

	// Calculate duration from date ranges
	function calculateDuration(dateRangeText) {
		// Extract dates from text like "Feb 2020 – May 2022" or "May 2022 – Current"
		const parts = dateRangeText.split("–").map((s) => s.trim());
		if (parts.length !== 2) return "";

		const startDate = parseDate(parts[0]);
		const endDate =
			parts[1].toLowerCase() === "current" ? new Date() : parseDate(parts[1]);

		if (!startDate || !endDate) return "";

		// Calculate difference in months
		let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
		months += endDate.getMonth() - startDate.getMonth();

		const years = Math.floor(months / 12);
		const remainingMonths = months % 12;

		// Format output
		let duration = "";
		if (years > 0) {
			duration += years + (years === 1 ? "yr" : "yrs");
		}
		if (remainingMonths > 0) {
			if (duration) duration += " ";
			duration += remainingMonths + (remainingMonths === 1 ? "mo" : "mos");
		}

		return duration || "0 mos";
	}

	function parseDate(dateStr) {
		// Parse dates like "Feb 2020", "May 2022", etc.
		const months = {
			jan: 0,
			feb: 1,
			mar: 2,
			apr: 3,
			may: 4,
			jun: 5,
			jul: 6,
			aug: 7,
			sep: 8,
			oct: 9,
			nov: 10,
			dec: 11,
		};

		const parts = dateStr.trim().split(" ");
		if (parts.length !== 2) return null;

		const monthStr = parts[0].toLowerCase().substring(0, 3);
		const year = parseInt(parts[1]);

		if (months[monthStr] === undefined || isNaN(year)) return null;

		return new Date(year, months[monthStr], 1);
	}

	// Update all durations on page load
	document.querySelectorAll(".date-range").forEach((dateRangeEl) => {
		// date-range sits inside .date-wrapper, sibling to .role-name inside the label.
		// Use closest to find the label ancestor and then query .role-name inside it.
		const labelEl = dateRangeEl.closest("label");
		const roleNameEl = labelEl ? labelEl.querySelector(".role-name") : null;
		const durationEl = roleNameEl
			? roleNameEl.querySelector(".duration")
			: null;
		if (durationEl) {
			const duration = calculateDuration(dateRangeEl.textContent);
			if (duration) durationEl.textContent = duration;
		}
	});

	// Scroll-triggered animations
	const observerOptions = {
		threshold: 0.15,
		rootMargin: "0px 0px -50px 0px",
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);

	// Observe gallery items with subtle stagger
	document.querySelectorAll(".gallery__item").forEach((item, index) => {
		item.classList.add("animate-on-scroll");
		item.style.transitionDelay = `${index * 0.04}s`;
		observer.observe(item);
	});

	// Observe timeline items
	document.querySelectorAll(".company-wrapper").forEach((item, index) => {
		item.classList.add("animate-on-scroll");
		item.style.transitionDelay = `${index * 0.08}s`;
		observer.observe(item);
	});

	// Observe timeline header
	const timelineHeader = document.querySelector(".timeline-header");
	if (timelineHeader) {
		timelineHeader.classList.add("animate-on-scroll");
		observer.observe(timelineHeader);
	}
});
