#!/usr/bin/env node
/**
 * Detects the best crop focus point for each player image and stores
 * "imgFocusY" (0–100, % from top) and "imgScale" (zoom factor) in players.json.
 *
 * Uses face-api.js (TinyFaceDetector) to find the face bounding box, then
 * passes it as a boost region to smartcrop-sharp to nail the exact crop.
 * Falls back to pure smartcrop entropy if no face is detected.
 *
 * Run (process players with img but no imgFocusY):
 *   node detect-face-focus.js
 *
 * Run (re-process all, even if imgFocusY already set):
 *   node detect-face-focus.js --force
 *
 * Run (only process specific country):
 *   node detect-face-focus.js --country brazil
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const smartcrop = require(
	path.join(__dirname, "node_modules", "smartcrop-sharp"),
);
const faceapi = require(
	path.join(__dirname, "node_modules", "@vladmandic/face-api"),
);
const canvas = require(path.join(__dirname, "node_modules", "canvas"));

// Polyfill browser canvas APIs that face-api expects
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_PATH = path.join(
	__dirname,
	"node_modules",
	"@vladmandic/face-api",
	"model",
);

let modelsLoaded = false;
async function ensureModels() {
	if (modelsLoaded) return;
	await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);
	modelsLoaded = true;
}

const PLAYERS_PATH = path.join(__dirname, "players.json");
const IMG_CACHE_DIR = path.join(__dirname, ".img-cache");
const CROP_SIZE = 200;
const SAVE_EVERY = 30;
const DELAY_MS = 2000; // Wikimedia CDN needs breathing room to avoid 429
const RETRY_DELAY_MS = 20000;

// Ensure cache directory exists
if (!fs.existsSync(IMG_CACHE_DIR)) fs.mkdirSync(IMG_CACHE_DIR);

/** Stable filename from URL */
function cacheKey(url) {
	const crypto = require("crypto");
	return crypto.createHash("md5").update(url).digest("hex") + ".jpg";
}

/** Return buffer from local cache, or download + cache it */
async function fetchBufferCached(url) {
	const file = path.join(IMG_CACHE_DIR, cacheKey(url));
	if (fs.existsSync(file)) return fs.readFileSync(file);
	const buf = await fetchBuffer(url);
	fs.writeFileSync(file, buf);
	return buf;
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

/** Download image buffer from URL, with redirect following and 429 retry */
async function fetchBuffer(url, attempt = 0) {
	const mod = url.startsWith("https") ? https : http;
	return new Promise((resolve, reject) => {
		mod
			.get(
				url,
				{ headers: { "User-Agent": "wc-history-viz/1.0" } },
				async (res) => {
					if (res.statusCode === 301 || res.statusCode === 302) {
						res.resume();
						return fetchBuffer(res.headers.location, attempt)
							.then(resolve)
							.catch(reject);
					}
					if (res.statusCode === 429) {
						res.resume();
						if (attempt >= 5)
							return reject(new Error(`HTTP 429 (rate limited) for ${url}`));
						const wait = RETRY_DELAY_MS * (attempt + 1);
						process.stdout.write(
							`\n  ⏳ 429 — pausing ${wait / 1000}s before retry…\n`,
						);
						await sleep(wait);
						return fetchBuffer(url, attempt + 1)
							.then(resolve)
							.catch(reject);
					}
					if (res.statusCode !== 200) {
						res.resume();
						return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
					}
					const chunks = [];
					res.on("data", (c) => chunks.push(c));
					res.on("end", () => resolve(Buffer.concat(chunks)));
					res.on("error", reject);
				},
			)
			.on("error", reject);
	});
}

async function getFocusData(imgUrl) {
	await ensureModels();

	// Fetch a 200px-wide thumbnail — use local cache to avoid Wikimedia rate limits
	const thumbUrl = imgUrl.replace(/\?width=\d+/, "?width=200");
	const buf = await fetchBufferCached(thumbUrl);

	// Get image dimensions
	const sharp = require(path.join(__dirname, "node_modules", "sharp"));
	const imgInfo = await sharp(buf).metadata();
	const imgW = imgInfo.width || 200;
	const imgH = imgInfo.height || 200;

	// ── Step 1: face-api face detection ──────────────────────────────────────
	// Load buffer into a canvas Image so face-api can process it
	const img = await canvas.loadImage(buf);
	const detections = await faceapi.detectAllFaces(
		img,
		new faceapi.TinyFaceDetectorOptions({
			inputSize: 224,
			scoreThreshold: 0.4,
		}),
	);

	let boosts;
	let faceBox = null;

	if (detections.length > 0) {
		// Pick the largest (most prominent) detected face
		faceBox = detections
			.map((d) => d.box)
			.sort((a, b) => b.width * b.height - a.width * a.height)[0];

		// Pass face bounding box as a high-weight boost to smartcrop
		boosts = [
			{
				x: Math.max(0, faceBox.x),
				y: Math.max(0, faceBox.y),
				width: faceBox.width,
				height: faceBox.height,
				weight: 1.0,
			},
		];
	} else {
		// Fallback: bias towards upper half (faces tend to be in top portion)
		boosts = [{ x: 0, y: 0, width: imgW, height: imgH * 0.5, weight: 0.3 }];
	}

	// ── Step 2: smartcrop with face boost ────────────────────────────────────
	const result = await smartcrop.crop(buf, {
		width: CROP_SIZE,
		height: CROP_SIZE,
		boost: boosts,
	});

	const crop = result.topCrop;
	if (!crop) return null;

	// ── Step 3: compute focusY, focusX, imgAspect and scale ────────────────────
	const imgAspect = parseFloat((imgW / imgH).toFixed(3));

	let focusY, focusX;
	if (faceBox) {
		// face-api tends to hit the lower face (nose/chin), so bias upward by ~15%
		// of face height to land on the eyes instead
		const faceCenterY = faceBox.y + faceBox.height * 0.35; // eye-level bias
		focusY = Math.min(80, Math.max(5, Math.round((faceCenterY / imgH) * 100)));

		const faceCenterX = faceBox.x + faceBox.width / 2;
		focusX = Math.min(95, Math.max(5, Math.round((faceCenterX / imgW) * 100)));
	} else {
		// Fallback: use smartcrop crop center
		const focusCenterY = crop.y + crop.height / 2;
		focusY = Math.min(75, Math.round((focusCenterY / imgH) * 100));
		focusX = 50;
	}

	// scale: zoom so the face fills ~65% of the avatar height.
	const referenceHeight = faceBox ? faceBox.height : crop.height;
	const TARGET_FACE_FRACTION = 0.65;
	const rawScale = TARGET_FACE_FRACTION / (referenceHeight / imgH);
	const scale = parseFloat(Math.min(3, Math.max(1, rawScale)).toFixed(1));

	return {
		focusY,
		focusX,
		imgAspect,
		scale,
		faceDetected: detections.length > 0,
	};
}

async function main() {
	const force = process.argv.includes("--force");
	const countryFilter = (() => {
		const idx = process.argv.indexOf("--country");
		return idx !== -1 ? process.argv[idx + 1] : null;
	})();
	const namesFilter = (() => {
		const idx = process.argv.indexOf("--names");
		if (idx === -1) return null;
		return process.argv[idx + 1].split(",").map((n) => n.trim());
	})();

	const playersJson = JSON.parse(fs.readFileSync(PLAYERS_PATH, "utf8"));

	// Top-N players per country to process (by total apps, then goals as tiebreak)
	const TOP_PER_COUNTRY = 20;

	// Collect players to process
	const toProcess = [];
	for (const [team, players] of Object.entries(playersJson)) {
		if (countryFilter && team !== countryFilter) continue;

		// Determine the top-N players for this country (only applies when no --names filter)
		const topNames = namesFilter
			? null
			: new Set(
					[...players]
						.filter((p) => p.img) // only consider players that have an image
						.sort(
							(a, b) =>
								(b.apps ?? 0) - (a.apps ?? 0) ||
								(b.goals ?? 0) - (a.goals ?? 0),
						)
						.slice(0, TOP_PER_COUNTRY)
						.map((p) => p.name),
				);

		for (const p of players) {
			if (!p.img) continue;
			if (p.imgLocked) continue; // imgLocked: true → never overwrite focus data
			if (namesFilter && !namesFilter.includes(p.name)) continue;
			if (topNames && !topNames.has(p.name)) continue; // skip outside top-N
			if (p.imgFocusY != null && !force) continue;
			toProcess.push({ p, team });
		}
	}

	const total = toProcess.length;
	console.log(`\nDetecting focus points for ${total} player images…`);
	if (force) console.log("(--force: re-processing all)");
	if (countryFilter) console.log(`(--country: ${countryFilter} only)`);
	if (namesFilter) console.log(`(--names: ${namesFilter.join(", ")})`);
	console.log("─".repeat(60));

	let done = 0;
	let failed = 0;
	let sinceLastSave = 0;

	function saveProgress() {
		if (sinceLastSave > 0) {
			fs.writeFileSync(
				PLAYERS_PATH,
				`${JSON.stringify(playersJson, null, 2)}\n`,
				"utf8",
			);
			sinceLastSave = 0;
		}
	}

	process.on("SIGINT", () => {
		console.log(`\n\nInterrupted — saving progress…`);
		saveProgress();
		console.log(
			`Processed ${done} / ${total}. Resume by running again (skips already-set).`,
		);
		process.exit(0);
	});

	for (let i = 0; i < toProcess.length; i++) {
		const { p, team } = toProcess[i];
		const prefix = `[${String(i + 1).padStart(5)}/${total}]`;

		try {
			const thumbUrl = p.img.replace(/\?width=\d+/, "?width=200");
			const cached = fs.existsSync(
				path.join(IMG_CACHE_DIR, cacheKey(thumbUrl)),
			);
			const data = await getFocusData(p.img);
			if (data != null) {
				p.imgFocusY = data.focusY;
				p.imgFocusX = data.focusX;
				p.imgAspect = data.imgAspect;
				p.imgScale = data.scale;
				done++;
				sinceLastSave++;
				const tag = data.faceDetected ? "face" : "entropy";
				process.stdout.write(
					`\r${prefix} ✓ ${p.name} (${team}) → focusY=${data.focusY}% focusX=${data.focusX}% scale=${data.scale}x [${tag}]           `,
				);
			} else {
				failed++;
				process.stdout.write(
					`\r${prefix} – ${p.name} (${team}) — no crop result        `,
				);
			}
		} catch (err) {
			failed++;
			process.stdout.write(
				`\r${prefix} ✗ ${p.name} (${team}) — ${err.message.slice(0, 50)}        `,
			);
		}

		// Only wait between requests when image wasn't cached (avoids Wikimedia 429)
		{
			const thumbUrl = p.img.replace(/\?width=\d+/, "?width=200");
			if (!fs.existsSync(path.join(IMG_CACHE_DIR, cacheKey(thumbUrl)))) {
				await sleep(DELAY_MS);
			}
		}

		if (sinceLastSave >= SAVE_EVERY) {
			saveProgress();
		}
	}

	console.log(`\n${"─".repeat(60)}`);
	console.log(`Done.`);
	console.log(`  ✓  Focus set:    ${done}`);
	console.log(`  ✗  Failed:       ${failed}`);

	saveProgress();
	console.log(`\nSaved → ${PLAYERS_PATH}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
