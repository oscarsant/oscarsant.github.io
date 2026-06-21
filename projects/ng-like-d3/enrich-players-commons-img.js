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
const DELAY_MS = 1000; // ms between API calls — keep Wikimedia happy
const RETRY_DELAY_MS = 15000; // base wait on 429 (multiplied by attempt number)
const IMG_WIDTH = 300; // thumbnail width for Commons Special:FilePath

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function unaccent(s) {
	return String(s)
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}

/** Extract the bare filename from a Commons Special:FilePath URL for comparison */
function commonsFilename(url) {
	if (!url) return null;
	const m = url.match(/Special:FilePath\/([^?]+)/);
	if (!m) return null;
	return decodeURIComponent(m[1]).toLowerCase().replace(/_/g, " ").trim();
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
	// ── Brazil (single-name players & hard-to-find) ─────────────────────────────
	Ronaldo: "Q529207", // Ronaldo Nazário — search returns Cristiano first
	Pelé: "Q12897",
	Garrincha: "Q180642",
	Ronaldinho: "Q39444", // search returns samba musician first
	Rivellino: "Q224059", // Roberto Rivellino
	Zico: "Q176504", // Arthur Antunes Coimbra
	"Thiago Silva": "Q189229",
	Alisson: "Q314956", // Alisson Becker (GK) — search may return others
	Aldair: "Q466434",
	Branco: "Q469614", // Cláudio Ibrahim Vaz Leiro
	Barbosa: "Q1884651", // Moacyr Barbosa Nascimento
	Didi: "Q323085", // Valdir Pereira "Didi"
	Ramires: "Q312882",
	Félix: "Q633513", // Félix Miéli Venerando (GK, 1970 WC) — name search returns wrong result
	// "Müller":  "Q??????", // Brazilian Müller (Sérgio Müller, 1986-94)

	// ── Spain (single-name players) ─────────────────────────────────────────────
	Raúl: "Q11576", // Raúl González Blanco — search returns given-name page first
	Xavi: "Q17500", // Xavi Hernández — search returns given-name page first
};

/**
 * Players to permanently skip — their Wikidata P18 image is wrong/irrelevant.
 * Format: "name" (exact match) or "team::name" (team-scoped).
 */
const SKIP_PLAYERS = new Set([
	"brazil::Müller", // returns Lörrach-Müller-Markt (shop photo)
	"brazil::Chico", // returns ChicoSquare (city square)
	"brazil::Romeu", // returns Palestra Italia match scoreline photo
	"brazil::Raí", // returns 2025 investment fund event photo
	"brazil::Fernando", // returns President Fernando Henrique Cardoso
	"brazil::Itália", // returns Norway-Italy 2025 match photo
	"brazil::Pedro", // returns Pedro Rodríguez (Spanish player)
	"brazil::Cris", // returns Cristiano Ronaldo
	"brazil::Britto", // returns botanist Nathaniel Lord Britton
	// "brazil::Félix", // returns playwright Lope de Vega — overridden via WIKIDATA_OVERRIDES with correct QID Q633513
	"brazil::Walter", // returns Walt Disney
	"brazil::Tim", // returns Time Magazine first cover
]);

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
	// Name/disambiguation entities
	"family name",
	"given name",
	"surname",
	"disambiguation",
	// Places & geography
	"district",
	"municipality",
	"city",
	"town",
	"village",
	"commune",
	"parish",
	"county",
	"province",
	"region",
	"country",
	"island",
	"mountain",
	"river",
	"lake",
	"street",
	"road",
	"stadium",
	"building",
	"tower",
	"bridge",
	"park",
	"neighbourhood",
	"neighborhood",
	"quarter",
	"settlement",
	"administrative",
	"territorial",
	"locality",
	"civil parish",
	"ward",
	// Media & other non-person
	"club",
	"film",
	"tv series",
	"television",
	"novel",
	"album",
	"song",
	"band",
	"organization",
	"company",
	"association",
	"foundation",
	"political party",
	"newspaper",
	"magazine",
	"video game",
	"anime",
	"manga",
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
	"athlete",
	"player",
	"coach",
	"manager",
];

/** Person-indicator tokens — Pass 2 only accepts results that look like a human */
const PERSON_TOKENS = [
	"footballer",
	"soccer",
	"player",
	"athlete",
	"coach",
	"manager",
	"actor",
	"politician",
	"singer",
	"musician",
	"writer",
	"author",
	"born",
	"national",
	"international",
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

			// Pass 2: accept a person-looking result that isn't a place/media entity
			// (stricter than before — must have at least one person-indicator token)
			for (const item of data.search) {
				const desc = (item.description || "").toLowerCase();
				if (SKIP_TOKENS.some((t) => desc.includes(t))) continue;
				if (PERSON_TOKENS.some((t) => desc.includes(t))) return item.id;
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

/**
 * Fallback: query Wikipedia's pageimages API for the player's main article image.
 * Tries full name first, then given+family, then name alone — returns a Commons URL or null.
 */
async function getWikipediaImage(p) {
	const candidates = [];
	const given = p.given && p.given !== "not applicable" ? p.given.trim() : null;
	const family = p.family ? p.family.trim() : null;
	if (given && family) candidates.push(`${given} ${family}`);
	candidates.push(p.name.trim());
	// Also try unaccented versions
	if (given && family) {
		const ug = unaccent(given),
			uf = unaccent(family);
		if (ug !== given || uf !== family) candidates.push(`${ug} ${uf}`);
	}
	const un = unaccent(p.name.trim());
	if (un !== p.name.trim()) candidates.push(un);

	for (const title of [...new Set(candidates)]) {
		const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&redirects=1&format=json`;
		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				const res = await fetch(url, {
					headers: { "User-Agent": "wc-history-viz/1.0 (personal project)" },
				});
				if (res.status === 429) {
					await sleep(RETRY_DELAY_MS);
					continue;
				}
				if (!res.ok) break;
				const data = await res.json();
				const pages = Object.values(data.query?.pages || {});
				if (!pages.length || pages[0].missing !== undefined) break;
				const src = pages[0].original?.source;
				if (!src) break;
				// Extract the filename from the upload URL and build a Special:FilePath URL
				// e.g. https://upload.wikimedia.org/wikipedia/commons/a/ab/Filename.jpg
				const match = src.match(
					/\/wikipedia\/commons\/[a-f0-9]\/[a-f0-9]{2}\/(.+)$/,
				);
				if (!match) break;
				const encoded = encodeURIComponent(decodeURIComponent(match[1]));
				return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${IMG_WIDTH}`;
			} catch {
				await sleep(RETRY_DELAY_MS);
			}
		}
	}
	return null;
}

const SAVE_EVERY = 50; // save players.json after every N processed players

async function main() {
	const force = process.argv.includes("--force");
	const dry = process.argv.includes("--dry");
	const countryArg = (() => {
		const idx = process.argv.indexOf("--country");
		return idx !== -1 ? process.argv[idx + 1] : null;
	})();

	const playersJson = JSON.parse(fs.readFileSync(PLAYERS_PATH, "utf8"));
	let updated = 0;
	let skipped = 0;
	let already = 0;
	let sinceLastSave = 0;

	// ── Build eligible set: top 10 per sort × position category per country ──
	// Covers every view the user can see: goals/apps × all/FW/MF/DF/GK.
	const POSITIONS = [null, "FW", "MF", "DF", "GK"]; // null = all positions
	const eligibleSet = new Set();
	for (const [team, players] of Object.entries(playersJson)) {
		if (countryArg && team !== countryArg) continue;
		for (const pos of POSITIONS) {
			const subset = pos ? players.filter((p) => p.pos === pos) : players;
			const byGoals = [...subset]
				.filter((p) => p.goals > 0)
				.sort((a, b) => b.goals - a.goals)
				.slice(0, 10);
			const byApps = [...subset]
				.filter((p) => p.apps > 0)
				.sort((a, b) => b.apps - a.apps)
				.slice(0, 10);
			[...byGoals, ...byApps].forEach((p) => eligibleSet.add(p));
		}
	}

	// Score used for ordering within the eligible set
	const score = (p) => (p.goals || 0) * 2 + (p.apps || 0);

	const allPlayers = Object.entries(playersJson)
		.flatMap(([team, players]) => players.map((p) => ({ p, team })))
		.filter(({ p, team }) => {
			if (countryArg && team !== countryArg) return false;
			return eligibleSet.has(p);
		})
		.sort((a, b) => score(b.p) - score(a.p));

	console.log(
		`\nFetching Wikimedia Commons images for ${allPlayers.length} players…`,
	);
	console.log(
		`  Strategy: top 10 by goals + top 10 by apps × all/FW/MF/DF/GK per country`,
	);
	if (countryArg) console.log(`  Country filter: ${countryArg}`);
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

		// imgLocked: true → never overwrite, even with --force
		if (p.imgLocked) {
			already++;
			continue;
		}

		if (p.img && !force) {
			already++;
			continue;
		}

		// 1. QID from override map — checked first so explicit overrides bypass SKIP_PLAYERS
		let qid = WIKIDATA_OVERRIDES[p.name];

		// Skip players whose Wikidata image is known to be wrong (unless QID is overridden)
		if (
			!qid &&
			(SKIP_PLAYERS.has(`${team}::${p.name}`) || SKIP_PLAYERS.has(p.name))
		) {
			process.stdout.write(
				`\r${prefix} ⊘ ${p.name} (${team}) — permanently skipped            `,
			);
			continue;
		}

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
			// No Wikidata entity found — try Wikipedia pageimages as direct fallback
			await sleep(DELAY_MS); // breathe before hitting a second API
			const imgUrl = await getWikipediaImage(p);
			if (imgUrl) {
				if (!dry) {
					const changed = commonsFilename(p.img) !== commonsFilename(imgUrl);
					p.img = imgUrl;
					// Only clear focus data when the actual file changed, not just URL format
					if (changed) {
						delete p.imgFocusY;
						delete p.imgFocusX;
						delete p.imgScale;
						delete p.imgAspect;
					}
				}
				updated++;
				sinceLastSave++;
				process.stdout.write(
					`\r${prefix} ✓ ${p.name} (${team}) [wikipedia]           `,
				);
				await sleep(DELAY_MS);
				if (sinceLastSave >= SAVE_EVERY) saveProgress();
			} else {
				skipped++;
				process.stdout.write(
					`\r${prefix} – ${p.name} (${team}) — not found        `,
				);
				await sleep(DELAY_MS);
			}
			continue;
		}

		let imgUrl = await getCommonsUrl(qid);

		// Fallback: Wikidata QID found but no P18 set — try Wikipedia pageimages
		if (!imgUrl) {
			await sleep(DELAY_MS); // breathe before hitting a second API
			imgUrl = await getWikipediaImage(p);
		}

		if (imgUrl) {
			if (!dry) {
				const changed = commonsFilename(p.img) !== commonsFilename(imgUrl);
				p.img = imgUrl;
				// Only clear focus data when the actual file changed, not just URL format
				if (changed) {
					delete p.imgFocusY;
					delete p.imgFocusX;
					delete p.imgScale;
					delete p.imgAspect;
				}
			}
			updated++;
			sinceLastSave++;
			process.stdout.write(
				`\r${prefix} ✓ ${p.name} (${team}) [${qid}]           `,
			);
		} else {
			skipped++;
			process.stdout.write(
				`\r${prefix} – ${p.name} (${team}) [${qid}] — no image        `,
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
