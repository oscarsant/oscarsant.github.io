#!/usr/bin/env node
/**
 * Fetches Wikimedia Commons image URLs for players via the Wikidata API (P18 property).
 *
 * For each player it:
 *   1. Looks up the player's Wikidata entity (via QID override or name search)
 *   2. Reads their P18 "image" claim → a Wikimedia Commons filename
 *   3. Writes "img": "https://commons.wikimedia.org/wiki/Special:FilePath/..." into players.json
 *
 * ─── HOW TO CHANGE / OVERRIDE AN IMAGE ──────────────────────────────────────
 *  Option A – Edit players.json directly (quickest):
 *    Find the player and set or change their "img" field to any URL you like.
 *    Example:  "img": "https://commons.wikimedia.org/wiki/Special:FilePath/SomeFile.jpg?width=300"
 *    To remove an image entirely, delete the "img" line.
 *
 *  Option B – Add a Wikidata QID override here (more robust for re-runs):
 *    Add an entry to WIKIDATA_OVERRIDES below.
 *    Find the correct QID by searching https://www.wikidata.org/
 *    Then re-run this script with --force to refresh that player.
 *
 *  Option C – Use a direct Commons file URL:
 *    Browse https://commons.wikimedia.org/, find the file you want,
 *    and use:  "img": "https://commons.wikimedia.org/wiki/Special:FilePath/<filename>?width=300"
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Run (fetch missing images only):  node enrich-players-commons-img.js
 * Run (re-fetch ALL, including already set):  node enrich-players-commons-img.js --force
 * Dry run (no writes):  node enrich-players-commons-img.js --dry
 */

const fs = require("fs");
const path = require("path");

const PLAYERS_PATH = path.join(__dirname, "players.json");
const DELAY_MS = 300; // ms between Wikidata API calls
const RETRY_DELAY_MS = 5000;
const IMG_WIDTH = 300; // thumbnail width for Commons Special:FilePath

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function unaccent(s) {
	return String(s)
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}

/**
 * Wikidata QID overrides.
 * Maps player `name` (exactly as stored in players.json) → Wikidata QID.
 *
 * Only needed for single-name players (given: "not applicable") where the
 * Wikidata name search is ambiguous or returns the wrong entity first.
 * Players stored with full names (e.g. "Zinedine Zidane") are found correctly
 * by the auto-search and do NOT need an override here.
 *
 * To add an override:
 *   1. Find the player in players.json and note their exact "name" value
 *   2. Search https://www.wikidata.org/ for the player
 *   3. Copy the QID from the URL (e.g. https://www.wikidata.org/wiki/Q12897 → "Q12897")
 *   4. Add  "Exact Name": "QXXXXX",  below
 */
const WIKIDATA_OVERRIDES = {
	// ── Brazil (single-name players) ────────────────────────────────────────────
	Ronaldo: "Q529207", // Ronaldo Nazário — search returns Cristiano first
	Pelé: "Q12897",
	Garrincha: "Q180642",
	Ronaldinho: "Q39444", // search returns samba musician first
	// "Müller":  "Q??????", // Brazilian Müller (Sérgio Müller, 1986-94) — find at https://www.wikidata.org/ by searching "Sérgio Müller footballer"

	// ── Spain (single-name players) ─────────────────────────────────────────────
	Raúl: "Q11576", // Raúl González Blanco — search returns given-name page first
	Xavi: "Q17500", // Xavi Hernández — search returns given-name page first
};

/** Build Wikidata search candidate strings in priority order */
function searchCandidates(p) {
	const given = p.given && p.given !== "not applicable" ? p.given.trim() : null;
	const family = p.family ? p.family.trim() : null;
	const name = p.name.trim();

	const candidates = [];

	if (given && family) {
		// Full name (most specific)
		candidates.push(`${given} ${family}`);
		const ug = unaccent(given);
		const uf = unaccent(family);
		if (ug !== given || uf !== family) candidates.push(`${ug} ${uf}`);
	}

	// Single / known name
	candidates.push(name);
	const un = unaccent(name);
	if (un !== name) candidates.push(un);

	return [...new Set(candidates)];
}

/** Skip tokens that indicate this is not a person entity */
const SKIP_TOKENS = [
	"family name",
	"given name",
	"surname",
	"disambiguation",
	"district",
	"municipality",
	"club",
	"film",
	"tv series",
	"novel",
	"album",
	"song",
];
const FOOTBALL_TOKENS = [
	"football",
	"footballer",
	"soccer",
	"striker",
	"midfielder",
	"goalkeeper",
	"defender",
	"winger",
	"forward",
];

/** Search Wikidata by name and return a QID for a footballer, or null */
async function searchWikidata(name) {
	const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&format=json&limit=10`;
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const res = await fetch(url, {
				headers: { "User-Agent": "wc-history-viz/1.0 (personal project)" },
			});
			if (res.status === 429) {
				await sleep(RETRY_DELAY_MS * (attempt + 1));
				continue;
			}
			if (!res.ok) return null;
			const data = await res.json();
			if (!data.search?.length) return null;

			// Pass 1: look for an explicitly football-related result
			for (const item of data.search) {
				const desc = (item.description || "").toLowerCase();
				if (SKIP_TOKENS.some((t) => desc.includes(t))) continue;
				if (FOOTBALL_TOKENS.some((t) => desc.includes(t))) return item.id;
			}

			// Pass 2: first result that isn't a name/place/media entity
			for (const item of data.search) {
				const desc = (item.description || "").toLowerCase();
				if (!SKIP_TOKENS.some((t) => desc.includes(t))) return item.id;
			}

			return null;
		} catch {
			await sleep(RETRY_DELAY_MS);
		}
	}
	return null;
}

/** Fetch the P18 image filename from Wikidata and return a Commons URL, or null */
async function getCommonsUrl(qid) {
	const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json`;
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const res = await fetch(url, {
				headers: { "User-Agent": "wc-history-viz/1.0 (personal project)" },
			});
			if (res.status === 429) {
				await sleep(RETRY_DELAY_MS * (attempt + 1));
				continue;
			}
			if (!res.ok) return null;
			const data = await res.json();
			const p18 = data.entities?.[qid]?.claims?.P18;
			if (!p18?.length) return null;
			const filename = p18[0].mainsnak?.datavalue?.value;
			if (!filename) return null;
			const encoded = encodeURIComponent(filename.replace(/ /g, "_"));
			return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${IMG_WIDTH}`;
		} catch {
			await sleep(RETRY_DELAY_MS);
		}
	}
	return null;
}

const SAVE_EVERY = 50; // save players.json after every N processed players

async function main() {
	const force = process.argv.includes("--force");
	const dry = process.argv.includes("--dry");

	const playersJson = JSON.parse(fs.readFileSync(PLAYERS_PATH, "utf8"));
	let updated = 0;
	let skipped = 0;
	let already = 0;
	let sinceLastSave = 0;

	const allPlayers = Object.entries(playersJson).flatMap(([team, players]) =>
		players.map((p) => ({ p, team })),
	);

	console.log(
		`\nFetching Wikimedia Commons images for ${allPlayers.length} players…`,
	);
	if (force) console.log("(--force: re-fetching all including existing img)");
	if (dry) console.log("(--dry: no changes will be written)");
	console.log("─".repeat(60));

	function saveProgress() {
		if (!dry && sinceLastSave > 0) {
			fs.writeFileSync(
				PLAYERS_PATH,
				`${JSON.stringify(playersJson, null, 2)}\n`,
				"utf8",
			);
			sinceLastSave = 0;
		}
	}

	// Save on Ctrl+C so progress isn't lost
	process.on("SIGINT", () => {
		console.log(`\n\nInterrupted — saving progress…`);
		saveProgress();
		console.log(
			`Saved ${updated} images so far. Resume by running the script again (already-set imgs are skipped).`,
		);
		process.exit(0);
	});

	for (let idx = 0; idx < allPlayers.length; idx++) {
		const { p, team } = allPlayers[idx];
		const prefix = `[${String(idx + 1).padStart(5)}/${allPlayers.length}]`;

		if (p.img && !force) {
			already++;
			continue;
		}

		// 1. QID from override map
		let qid = WIKIDATA_OVERRIDES[p.name];

		// 2. Search by name candidates
		if (!qid) {
			const candidates = searchCandidates(p);
			for (const candidate of candidates) {
				qid = await searchWikidata(candidate);
				if (qid) break;
				await sleep(DELAY_MS);
			}
		}

		if (!qid) {
			skipped++;
			process.stdout.write(
				`\r${prefix} – ${p.name} (${team}) — no Wikidata entity        `,
			);
			await sleep(DELAY_MS);
			continue;
		}

		const imgUrl = await getCommonsUrl(qid);

		if (imgUrl) {
			if (!dry) p.img = imgUrl;
			updated++;
			sinceLastSave++;
			process.stdout.write(
				`\r${prefix} ✓ ${p.name} (${team}) [${qid}]           `,
			);
		} else {
			skipped++;
			process.stdout.write(
				`\r${prefix} – ${p.name} (${team}) [${qid}] — no P18 image        `,
			);
		}

		await sleep(DELAY_MS);

		// Periodically save so progress isn't lost on interruption
		if (sinceLastSave >= SAVE_EVERY) {
			saveProgress();
		}
	}

	console.log(`\n${"─".repeat(60)}`);
	console.log(`Done.`);
	console.log(`  ✓  Updated:           ${updated}`);
	console.log(`  ↩  Already had img:   ${already}`);
	console.log(`  –  No image found:    ${skipped}`);

	saveProgress();

	if (dry) {
		console.log(`\n(Dry run — players.json was NOT modified)`);
	} else {
		console.log(`\nSaved → ${PLAYERS_PATH}`);
	}

	console.log(`\nTo override a specific player's image:`);
	console.log(`  1. Open players.json and find the player by name`);
	console.log(`  2. Edit their "img" field to any URL you prefer`);
	console.log(
		`  3. Or add their Wikidata QID to WIKIDATA_OVERRIDES and re-run with --force`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
