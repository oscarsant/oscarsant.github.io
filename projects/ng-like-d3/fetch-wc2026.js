#!/usr/bin/env node
/**
 * fetch-wc2026.js  — ESPN-only WC2026 data fetcher
 *
 * Sources:  ESPN unofficial API (scoreboard + match summary)
 * Outputs:
 *   data/{teamKey}.json  — adds/updates the 2026 tournament entry
 *   players.json         — updates byYear["2026"] apps + goals per player
 *   .espn-cache.json     — event + player stats cache (committed to git)
 *
 * Run:
 *   node fetch-wc2026.js              incremental (only new events)
 *   node fetch-wc2026.js --team france single team
 *   node fetch-wc2026.js --dry-run    print, no writes
 *   node fetch-wc2026.js --force      re-sweep all dates, re-fetch all summaries
 */

"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const DATA_DIR = path.join(__dirname, "data");
const CACHE_FILE = path.join(__dirname, ".espn-cache.json");

// WC2026 window
const WC_START = new Date("2026-06-11T00:00:00Z");
const WC_END = new Date("2026-07-20T00:00:00Z"); // day after final

// ── ESPN team displayName → our data key ─────────────────────────────────
const ESPN_TO_KEY = {
	Algeria: "algeria",
	Argentina: "argentina",
	Australia: "australia",
	Austria: "austria",
	Belgium: "belgium",
	Brazil: "brazil",
	Canada: "canada",
	"Cape Verde": "cape-verde",
	Colombia: "colombia",
	Croatia: "croatia",
	Curaçao: "curacao",
	Curacao: "curacao",
	"Czech Republic": "czech-republic",
	Czechia: "czech-republic",
	"Congo DR": "dr-congo",
	"DR Congo": "dr-congo",
	Ecuador: "ecuador",
	Egypt: "egypt",
	England: "england",
	France: "france",
	Germany: "germany",
	Ghana: "ghana",
	Haiti: "haiti",
	Iran: "iran",
	Iraq: "iraq",
	"Ivory Coast": "ivory-coast",
	"Côte d'Ivoire": "ivory-coast",
	Japan: "japan",
	Jordan: "jordan",
	Mexico: "mexico",
	Morocco: "morocco",
	Netherlands: "netherlands",
	"New Zealand": "new-zealand",
	Norway: "norway",
	Panama: "panama",
	Paraguay: "paraguay",
	Portugal: "portugal",
	Qatar: "qatar",
	"Saudi Arabia": "saudi-arabia",
	Scotland: "scotland",
	Senegal: "senegal",
	"South Africa": "south-africa",
	"South Korea": "south-korea",
	"Korea Republic": "south-korea",
	Spain: "spain",
	Sweden: "sweden",
	Switzerland: "switzerland",
	Tunisia: "tunisia",
	Turkey: "turkey",
	Türkiye: "turkey",
	Uruguay: "uruguay",
	"United States": "usa",
	USA: "usa",
	Uzbekistan: "uzbekistan",
	Wales: "wales",
	"Bosnia & Herzegovina": "bosnia",
	"Bosnia and Herzegovina": "bosnia",
};

// ── Opponent name → abbr ──────────────────────────────────────────────────
const NAME_TO_ABBR = (() => {
	const map = {};
	try {
		JSON.parse(
			fs.readFileSync(path.join(__dirname, "teams-index.json"), "utf8"),
		).forEach((t) => {
			map[t.name.toLowerCase()] = t.abbr;
		});
	} catch (_) {}
	try {
		JSON.parse(
			fs.readFileSync(path.join(__dirname, "wc2026-values.json"), "utf8"),
		).forEach((t) => {
			map[t.name.toLowerCase()] = t.abbr;
		});
	} catch (_) {}
	Object.assign(map, {
		"united states": "USA",
		usa: "USA",
		"south korea": "KOR",
		"korea republic": "KOR",
		"ivory coast": "CIV",
		"côte d'ivoire": "CIV",
		"dr congo": "COD",
		"congo dr": "COD",
		"cape verde": "CPV",
		"new zealand": "NZL",
		"saudi arabia": "KSA",
		türkiye: "TUR",
		curaçao: "CUR",
		curacao: "CUR",
		"bosnia & herzegovina": "BIH",
		"bosnia and herzegovina": "BIH",
		"czech republic": "CZE",
		czechia: "CZE",
	});
	return map;
})();

function getAbbr(name) {
	if (!name) return "UNK";
	return NAME_TO_ABBR[name.toLowerCase()] || name.toUpperCase().slice(0, 3);
}

// ── Stage detection from ESPN competition notes ───────────────────────────
function parseNotes(notes) {
	const text = (notes || []).map((n) => n.headline || "").join(" ");
	const gm = text.match(/Group\s+([A-L])/i);
	if (gm) return { stage: "GS", group: gm[1].toUpperCase() };
	if (/round of 32/i.test(text)) return { stage: "R32", group: null };
	if (/round of 16/i.test(text)) return { stage: "R16", group: null };
	if (/quarter.?final/i.test(text)) return { stage: "QF", group: null };
	if (/semi.?final/i.test(text)) return { stage: "SF", group: null };
	if (/third place/i.test(text)) return { stage: "3P", group: null };
	if (/\bfinal\b/i.test(text)) return { stage: "F", group: null };
	return { stage: "GS", group: null };
}

// ── Highest stage reached ─────────────────────────────────────────────────
const STAGE_ORDER = ["GS", "R32", "R16", "QF", "SF", "3P", "F", "W"];
function bestStage(stages) {
	let best = "GS";
	stages.forEach((s) => {
		if (STAGE_ORDER.indexOf(s) > STAGE_ORDER.indexOf(best)) best = s;
	});
	return best;
}

// ── Date utilities ────────────────────────────────────────────────────────
function toDateStr(d) {
	return d.toISOString().slice(0, 10);
}
function toESPN(d) {
	return toDateStr(d).replace(/-/g, "");
}
function addDays(d, n) {
	const x = new Date(d);
	x.setUTCDate(x.getUTCDate() + n);
	return x;
}
function todayUTC() {
	return new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
}

// ── HTTP helper ───────────────────────────────────────────────────────────
function get(url, attempt = 0) {
	return new Promise((resolve, reject) => {
		https
			.get(url, { headers: { "User-Agent": "wc-history-viz/3.0" } }, (res) => {
				if (res.statusCode === 301 || res.statusCode === 302)
					return get(res.headers.location, attempt).then(resolve).catch(reject);
				let data = "";
				res.on("data", (c) => (data += c));
				res.on("end", async () => {
					if (res.statusCode === 429 || res.statusCode === 503) {
						if (attempt >= 3) return reject(new Error(`Rate-limited: ${url}`));
						await sleep(3000 * (attempt + 1));
						return get(url, attempt + 1)
							.then(resolve)
							.catch(reject);
					}
					try {
						resolve(JSON.parse(data));
					} catch (e) {
						reject(new Error(`JSON parse fail (${res.statusCode}): ${url}`));
					}
				});
				res.on("error", reject);
			})
			.on("error", reject);
	});
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Cache helpers ─────────────────────────────────────────────────────────
function loadCache() {
	try {
		return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
	} catch (_) {}
	return { lastSweepDate: null, events: {}, processed: {} };
}
function saveCache(c) {
	fs.writeFileSync(CACHE_FILE, JSON.stringify(c, null, 2) + "\n", "utf8");
}

// ── ESPN: fetch scoreboard for one date, returns array of event metadata ──
async function fetchScoreboard(dateStr) {
	const data = await get(`${ESPN}/scoreboard?dates=${dateStr}`);
	return (data.events || []).map((ev) => {
		const comp = (ev.competitions || [])[0] || {};
		const competitors = comp.competitors || [];
		const home =
			competitors.find((c) => c.homeAway === "home") || competitors[0] || {};
		const away =
			competitors.find((c) => c.homeAway === "away") || competitors[1] || {};
		const completed = comp.status?.type?.completed || false;
		const inProgress = (comp.status?.type?.name || "").includes("IN_PROGRESS");
		const { stage, group } = parseNotes(comp.notes);
		return {
			id: ev.id,
			date:
				(ev.date || "").slice(0, 10) ||
				dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
			homeTeam: home.team?.displayName || "",
			awayTeam: away.team?.displayName || "",
			homeScore: completed || inProgress ? parseInt(home.score, 10) : null,
			awayScore: completed || inProgress ? parseInt(away.score, 10) : null,
			completed,
			inProgress,
			stage,
			group,
			venue: comp.venue?.fullName || null,
		};
	});
}

// ── ESPN position → our 2-letter code ───────────────────────────────────
function mapPos(abbr) {
	if (!abbr) return "MF";
	const a = abbr.toUpperCase();
	if (a === "GK" || a === "G") return "GK";
	if (
		["CB", "RB", "LB", "FB", "WB", "SW", "D", "DEF", "LWB", "RWB"].includes(a)
	)
		return "DF";
	if (["ST", "CF", "LW", "RW", "F", "FW", "SS", "WF"].includes(a)) return "FW";
	return "MF"; // CM, DM, AM, CAM, CDM, M, MF, etc.
}

// ── ESPN: fetch match summary → per-team player stats ────────────────────
// Returns { teamKey: { playerName: {apps, goals, pos} } }
async function fetchSummary(eventId) {
	let s;
	try {
		s = await get(`${ESPN}/summary?event=${eventId}`);
	} catch (_) {
		return {};
	}

	// Build roster first: teamKey → Set<name> + who played
	const rosterByKey = {};
	const result = {};
	(s.rosters || []).forEach((r) => {
		const teamName = r.team?.displayName || r.team?.name || "";
		const key = ESPN_TO_KEY[teamName];
		if (!key) return;
		rosterByKey[key] = new Set();
		result[key] = {};
		(r.roster || []).forEach((entry) => {
			const name = entry.athlete?.displayName;
			if (!name) return;
			const pos = mapPos(entry.position?.abbreviation);
			rosterByKey[key].add(name);
			if (!entry.starter && !entry.subbedIn) return; // in squad but didn't play
			result[key][name] = { apps: 1, goals: 0, pos };
		});
	});

	// Scoring plays — attribute to the team the player is rostered on
	const comp = (s.header?.competitions || [])[0];
	(comp?.details || [])
		.filter((d) => d.scoringPlay && !d.ownGoal)
		.forEach((d) => {
			const name = (d.participants || [])[0]?.athlete?.displayName;
			if (!name) return;
			for (const [key, roster] of Object.entries(rosterByKey)) {
				if (roster.has(name)) {
					if (!result[key][name]) result[key][name] = { apps: 0, goals: 0 };
					result[key][name].goals += 1;
					break;
				}
			}
		});

	return result;
}

// ── Build one match entry from an event (from one team's POV) ────────────
function buildMatch(ev, teamKey) {
	const isHome = ESPN_TO_KEY[ev.homeTeam] === teamKey;
	const oppName = isHome ? ev.awayTeam : ev.homeTeam;
	const ourScore = isHome ? ev.homeScore : ev.awayScore;
	const oppScore = isHome ? ev.awayScore : ev.homeScore;

	let score = "TBD",
		result = "?";
	if (ev.completed && ourScore !== null && oppScore !== null) {
		score = `${ourScore}-${oppScore}`;
		result = ourScore > oppScore ? "W" : ourScore < oppScore ? "L" : "D";
	} else if (ev.inProgress && ourScore !== null) {
		score = `${ourScore}-${oppScore}`;
	}

	const m = {
		stage: ev.stage,
		date: ev.date,
		opponent: getAbbr(oppName),
		opponent_full: oppName,
		score,
		result,
	};
	if (ev.group) m.group = ev.group;
	if (ev.venue) m.venue = ev.venue;
	return m;
}

// ── Write/update data/{key}.json ─────────────────────────────────────────
function writeTeamData(key, matches, force) {
	const dataFile = path.join(DATA_DIR, `${key}.json`);
	const tournaments = fs.existsSync(dataFile)
		? JSON.parse(fs.readFileSync(dataFile, "utf8"))
		: [];
	const played = matches.filter((m) => m.result !== "?");
	const stage = bestStage(played.map((m) => m.stage));
	const entry2026 = { year: 2026, stage, matches };
	const idx = tournaments.findIndex((t) => t.year === 2026);
	if (
		idx >= 0 &&
		!force &&
		JSON.stringify(tournaments[idx]) === JSON.stringify(entry2026)
	)
		return false;
	if (idx >= 0) tournaments[idx] = entry2026;
	else tournaments.push(entry2026);
	fs.writeFileSync(
		dataFile,
		JSON.stringify(tournaments, null, 2) + "\n",
		"utf8",
	);
	return true;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run");
	const force = args.includes("--force");
	const teamArg = args.includes("--team")
		? args[args.indexOf("--team") + 1]
		: null;

	const cache = loadCache();
	const playersPath = path.join(__dirname, "players.json");
	const playersJson = JSON.parse(fs.readFileSync(playersPath, "utf8"));

	// ── Step 1: Sweep scoreboard for new/updated events ───────────────────
	const sweepFrom = force
		? WC_START
		: cache.lastSweepDate
			? addDays(new Date(cache.lastSweepDate), -1)
			: WC_START;
	const sweepCap = new Date(Math.min(addDays(todayUTC(), 2), WC_END));

	console.log(
		`\n  Sweeping scoreboard ${toDateStr(sweepFrom)} → ${toDateStr(sweepCap)}…\n`,
	);

	let sweepNew = 0;
	for (let d = new Date(sweepFrom); d <= sweepCap; d = addDays(d, 1)) {
		const dateStr = toESPN(d);
		try {
			const evts = await fetchScoreboard(dateStr);
			for (const ev of evts) {
				const existing = cache.events[ev.id];
				// Update if new, or if completion status changed
				if (
					!existing ||
					(ev.completed && !existing.completed) ||
					ev.inProgress !== existing.inProgress
				) {
					cache.events[ev.id] = ev;
					sweepNew++;
				}
			}
		} catch (e) {
			process.stdout.write(`  ✗ scoreboard ${dateStr}: ${e.message}\n`);
		}
		await sleep(300);
	}
	cache.lastSweepDate = toDateStr(sweepCap);
	console.log(
		`  Found ${sweepNew} new/updated event(s) across ${Object.keys(cache.events).length} total.\n`,
	);

	// ── Step 2: Fetch summaries for completed, unprocessed events ─────────
	const needSummary = Object.values(cache.events)
		.filter((ev) => {
			if (!ev.completed) return false;
			if (force) return true;
			if (!cache.processed[ev.id]) return true;
			return false;
		})
		.filter((ev) => {
			if (!teamArg) return true;
			return (
				ESPN_TO_KEY[ev.homeTeam] === teamArg ||
				ESPN_TO_KEY[ev.awayTeam] === teamArg
			);
		});

	console.log(
		`  ${needSummary.length} match summar${needSummary.length === 1 ? "y" : "ies"} to fetch…\n`,
	);

	for (const ev of needSummary) {
		process.stdout.write(`  ${ev.date}  ${ev.homeTeam} vs ${ev.awayTeam}…`);
		const stats = await fetchSummary(ev.id);
		cache.processed[ev.id] = stats;
		const n = Object.values(stats).reduce(
			(s, t) => s + Object.keys(t).length,
			0,
		);
		process.stdout.write(` ✓ ${n} players tracked\n`);
		await sleep(500);
	}

	if (!dryRun) saveCache(cache);

	// ── Step 3: Rebuild team files + player stats from full cache ─────────
	const allKeys = teamArg
		? [teamArg]
		: [
				...new Set(
					Object.values(cache.events)
						.flatMap((ev) => [
							ESPN_TO_KEY[ev.homeTeam],
							ESPN_TO_KEY[ev.awayTeam],
						])
						.filter(Boolean),
				),
			].sort();

	let updatedTeams = 0,
		updatedPlayers = 0;
	console.log(`\n  Writing ${allKeys.length} team file(s)…\n`);

	for (const key of allKeys) {
		const teamEvts = Object.values(cache.events)
			.filter(
				(ev) =>
					ESPN_TO_KEY[ev.homeTeam] === key || ESPN_TO_KEY[ev.awayTeam] === key,
			)
			.sort((a, b) => a.date.localeCompare(b.date));
		if (!teamEvts.length) continue;

		const matches = teamEvts.map((ev) => buildMatch(ev, key));

		// Aggregate player stats across all processed events for this team
		const aggPlayers = {};
		teamEvts.forEach((ev) => {
			const stats = cache.processed[ev.id]?.[key];
			if (!stats) return;
			Object.entries(stats).forEach(([name, s]) => {
				if (!aggPlayers[name])
					aggPlayers[name] = { apps: 0, goals: 0, pos: s.pos || "MF" };
				aggPlayers[name].apps += s.apps || 0;
				aggPlayers[name].goals += s.goals || 0;
				// Keep pos from first appearance (shouldn't change)
				if (s.pos && aggPlayers[name].pos === "MF")
					aggPlayers[name].pos = s.pos;
			});
		});

		// Update data/{key}.json
		if (!dryRun && writeTeamData(key, matches, force)) updatedTeams++;

		// Update players.json byYear["2026"]
		if (!playersJson[key]) playersJson[key] = [];
		const teamPlayers = playersJson[key];
		const existingNames = new Set(teamPlayers.map((p) => p.name));
		// Also build a family-name lookup for fuzzy matching
		const familyLookup = new Map();
		teamPlayers.forEach((p) => {
			if (p.family && p.family !== "not applicable")
				familyLookup.set(p.family, p);
		});

		let playerHits = 0;
		// ── Update existing players ──────────────────────────────────────────
		for (const player of teamPlayers) {
			const live =
				aggPlayers[player.name] ||
				(player.family && player.family !== "not applicable"
					? aggPlayers[player.family]
					: null) ||
				null;
			if (!live) continue;
			if (!player.byYear) player.byYear = {};
			player.byYear["2026"] = { apps: live.apps, goals: live.goals };
			if (!player.years) player.years = [];
			if (!player.years.includes(2026)) player.years.push(2026);
			playerHits++;
			updatedPlayers++;
		}

		// ── Add new players seen in ESPN lineups but not in our data ─────────
		for (const [name, live] of Object.entries(aggPlayers)) {
			if (live.apps === 0) continue; // didn't actually play
			// Skip if already matched above (exact or family)
			if (existingNames.has(name)) continue;
			if (familyLookup.has(name)) continue;
			// Build minimal player entry
			const nameParts = name.trim().split(/\s+/);
			const given =
				nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : null;
			const family =
				nameParts.length > 1 ? nameParts[nameParts.length - 1] : name;
			const newPlayer = {
				name,
				family,
				given: given || "not applicable",
				pos: live.pos || "MF",
				apps: 0, // historical total (2026 tracked via byYear)
				goals: 0,
				years: [2026],
				byYear: { 2026: { apps: live.apps, goals: live.goals } },
			};
			teamPlayers.push(newPlayer);
			existingNames.add(name);
			playerHits++;
			updatedPlayers++;
		}

		const played = matches.filter((m) => m.result !== "?").length;
		const upcoming = matches.length - played;
		const stage = bestStage(
			matches.filter((m) => m.result !== "?").map((m) => m.stage),
		);
		process.stdout.write(
			`  ${key.padEnd(20)} ✓  ${played} played, ${upcoming} upcoming  stage:${stage}  ${playerHits} players\n`,
		);
	}

	// ── Step 4: Save players.json ─────────────────────────────────────────
	if (!dryRun && updatedPlayers > 0) {
		fs.writeFileSync(
			playersPath,
			JSON.stringify(playersJson, null, 2) + "\n",
			"utf8",
		);
	}

	console.log(
		`\n  Done. ${updatedTeams} team files updated, ${updatedPlayers} player records written.\n`,
	);
}

main().catch((err) => {
	console.error("\nFatal:", err.message);
	process.exit(1);
});
