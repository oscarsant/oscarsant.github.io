#!/usr/bin/env node
/**
 * Fetches Wikipedia thumbnail URLs for all players and writes them into players.json.
 * Uses the Wikipedia REST summary endpoint. Adds a small delay between requests to be polite.
 * Run: node enrich-players-wikipedia-img.js
 */

const fs = require("fs");
const path = require("path");

const PLAYERS_PATH = path.join(__dirname, "players.json");
const DELAY_MS = 250; // ms between requests
const RETRY_DELAY_MS = 5000; // ms to wait on rate-limit before retrying

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

/** Strip diacritics so accented names resolve on Wikipedia (e.g. Higuaín → Higuain) */
function unaccent(s) {
	return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Manual overrides: maps p.name → exact Wikipedia title when auto-detection fails */
const WIKI_OVERRIDES = {
	"Xavi": "Xavi Hernández",
	"Raúl": "Raúl (footballer)",
	"Ronaldo": "Ronaldo (Brazilian footballer)",
	"Neymar Jr.": "Neymar",
	"G. Müller": "Gerd Müller",
	"T. Müller": "Thomas Müller",
	"Ramos": "Sergio Ramos",
	"Casillas": "Iker Casillas",
	"Busquets": "Sergio Busquets",
	"Charlton": "Bobby Charlton",
	"Moore": "Bobby Moore",
	"Hurst": "Geoff Hurst",
	"Shilton": "Peter Shilton",
	"Owen": "Michael Owen",
	"Seeler": "Uwe Seeler",
	"Völler": "Rudi Völler",
	"Rummenigge": "Karl-Heinz Rummenigge",
	"Matthäus": "Lothar Matthäus",
	"Klinsmann": "Jürgen Klinsmann",
	"Lahm": "Philipp Lahm",
	"Rahn": "Helmut Rahn",
};

/** Build candidate Wikipedia titles to try in order */
function titleCandidates(p) {
	const given = p.given && p.given !== "not applicable" ? p.given.trim() : null;
	const family = p.family ? p.family.trim() : null;
	const name = p.name.trim();

	const candidates = [];

	// Manual override takes priority
	if (WIKI_OVERRIDES[name]) {
		candidates.push(WIKI_OVERRIDES[name]);
		candidates.push(`${WIKI_OVERRIDES[name]} (footballer)`);
	}

	if (given && family) {
		const g = unaccent(given);
		const f = unaccent(family);
		// unaccented first (handles Higuaín → "Gonzalo Higuain")
		candidates.push(`${g} ${f}`);
		candidates.push(`${g} ${f} (footballer)`);
		candidates.push(`${g} ${f} (soccer)`);
		// original accented (handles e.g. "Raúl González" if that's the WP title)
		if (given !== g || family !== f) {
			candidates.push(`${given} ${family}`);
			candidates.push(`${given} ${family} (footballer)`);
		}
	}
	if (family) {
		const f = unaccent(family);
		if (f !== unaccent(name)) candidates.push(f);
		// accented variant if different (e.g. "Raúl")
		if (family !== f && family !== name) candidates.push(family);
	}
	// unaccented name
	candidates.push(unaccent(name));
	candidates.push(`${unaccent(name)} (footballer)`);
	// original accented name if different (handles "Raúl (footballer)")
	if (name !== unaccent(name)) {
		candidates.push(name);
		candidates.push(`${name} (footballer)`);
	}

	// Deduplicate while preserving order
	return [...new Set(candidates)];
}

async function fetchSummary(title) {
	const encoded = encodeURIComponent(title.replace(/ /g, "_"));
	const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
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
			const text = await res.text();
			let data;
			try { data = JSON.parse(text); } catch { await sleep(RETRY_DELAY_MS); continue; }
			if (data.type === "disambiguation") return null;
			const thumb = data.thumbnail?.source || data.originalimage?.source || null;
			return thumb || null;
		} catch {
			return null;
		}
	}
	return null;
}

async function main() {
	const playersJson = JSON.parse(fs.readFileSync(PLAYERS_PATH, "utf8"));
	let updated = 0;
	let skipped = 0;
	let already = 0;

	const allPlayers = Object.entries(playersJson).flatMap(([team, players]) =>
		players.map((p) => ({ p, team })),
	);

	console.log(`Fetching Wikipedia images for ${allPlayers.length} players…`);

	for (let idx = 0; idx < allPlayers.length; idx++) {
		const { p, team } = allPlayers[idx];

		if (p.img) {
			already++;
			continue;
		}

		const candidates = titleCandidates(p);
		let found = null;

		for (const title of candidates) {
			const img = await fetchSummary(title);
			if (img) {
				found = img;
				break;
			}
			await sleep(DELAY_MS);
		}

		if (found) {
			p.img = found;
			updated++;
			process.stdout.write(`\r[${idx + 1}/${allPlayers.length}] ✓ ${p.name} (${team})            `);
		} else {
			skipped++;
			process.stdout.write(`\r[${idx + 1}/${allPlayers.length}] – ${p.name} (${team}) — no image    `);
		}

		await sleep(DELAY_MS);
	}

	console.log(`\n\nDone. Updated: ${updated}, Already had img: ${already}, No image found: ${skipped}`);
	fs.writeFileSync(PLAYERS_PATH, `${JSON.stringify(playersJson, null, 2)}\n`, "utf8");
	console.log(`Saved: ${PLAYERS_PATH}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
