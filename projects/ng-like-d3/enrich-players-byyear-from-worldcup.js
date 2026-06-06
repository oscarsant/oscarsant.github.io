#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const APPEARANCES_URL =
	"https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv/player_appearances.csv";
const GOALS_URL =
	"https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv/goals.csv";

const TEAM_CODE_ALIASES = {
	GER: "DEU",
	SUI: "CHE",
	CRO: "HRV",
	POR: "PRT",
	PAR: "PRY",
	CZE: "CZE",
	NED: "NLD",
	IRN: "IRN",
	KSA: "SAU",
};

function parseCsv(text) {
	const rows = [];
	let row = [];
	let field = "";
	let i = 0;
	let inQuotes = false;

	while (i < text.length) {
		const ch = text[i];

		if (inQuotes) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i += 1;
				} else {
					inQuotes = false;
				}
			} else {
				field += ch;
			}
		} else {
			if (ch === '"') {
				inQuotes = true;
			} else if (ch === ",") {
				row.push(field);
				field = "";
			} else if (ch === "\n") {
				row.push(field);
				rows.push(row);
				row = [];
				field = "";
			} else if (ch === "\r") {
				// Ignore CR
			} else {
				field += ch;
			}
		}

		i += 1;
	}

	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	if (!rows.length) return [];

	const headers = rows[0].map((h) => h.trim());
	const out = [];

	for (let r = 1; r < rows.length; r += 1) {
		const vals = rows[r];
		if (!vals || vals.length === 0) continue;
		const obj = {};
		for (let c = 0; c < headers.length; c += 1) {
			obj[headers[c]] = vals[c] ?? "";
		}
		out.push(obj);
	}

	return out;
}

function normalizeName(s) {
	return String(s || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/\./g, " ")
		.replace(/[^a-zA-Z0-9\s]/g, " ")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();
}

function tokenSet(s) {
	return new Set(normalizeName(s).split(" ").filter(Boolean));
}

function jaccard(a, b) {
	if (!a.size || !b.size) return 0;
	let inter = 0;
	for (const v of a) {
		if (b.has(v)) inter += 1;
	}
	const union = a.size + b.size - inter;
	return union ? inter / union : 0;
}

function yearFromTournamentId(tournamentId) {
	const m = String(tournamentId || "").match(/(\d{4})/);
	return m ? Number(m[1]) : null;
}

function chooseBestCandidate(localPlayer, candidates) {
	const localName = localPlayer.name;
	const localTokens = tokenSet(localName);
	const localNorm = normalizeName(localName);
	const localYears = new Set((localPlayer.years || []).map((y) => Number(y)));

	let best = null;

	for (const c of candidates) {
		const overlapYears = c.years.filter((y) => localYears.has(y)).length;
		if (overlapYears === 0) continue;

		const candDisplay = `${c.givenName} ${c.familyName}`.trim();
		const candNorm = normalizeName(candDisplay);
		const candFamilyNorm = normalizeName(c.familyName);
		const candTokens = tokenSet(candDisplay);

		let score = 0;

		if (localNorm === candNorm) score += 100;
		score += jaccard(localTokens, candTokens) * 60;

		if (candFamilyNorm && localNorm.includes(candFamilyNorm)) {
			score += 25;
		}

		const localLast =
			normalizeName(localName).split(" ").filter(Boolean).slice(-1)[0] || "";
		const candLast =
			candFamilyNorm.split(" ").filter(Boolean).slice(-1)[0] || "";
		if (localLast && candLast && localLast === candLast) {
			score += 30;
		}

		score += Math.min(20, overlapYears * 5);

		if (!best || score > best.score) {
			best = { candidate: c, score, overlapYears };
		}
	}

	if (!best) return null;
	if (best.score < 35) return null;
	return best.candidate;
}

async function fetchText(url) {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch ${url}: ${res.status}`);
	}
	return await res.text();
}

async function main() {
	const cwd = process.cwd();
	const playersPath = path.join(cwd, "players.json");
	const teamsPath = path.join(cwd, "teams-index.json");

	const playersJson = JSON.parse(fs.readFileSync(playersPath, "utf8"));
	const teamsIndex = JSON.parse(fs.readFileSync(teamsPath, "utf8"));

	const teamCodeByKey = Object.fromEntries(
		teamsIndex.map((t) => [t.key, String(t.abbr || "")]),
	);

	const [appearancesText, goalsText] = await Promise.all([
		fetchText(APPEARANCES_URL),
		fetchText(GOALS_URL),
	]);

	const appearances = parseCsv(appearancesText);
	const goals = parseCsv(goalsText);

	const playersByCode = new Map();

	for (const row of appearances) {
		const teamCode = String(row.team_code || "").trim();
		const playerId = String(row.player_id || "").trim();
		const year = yearFromTournamentId(row.tournament_id);
		if (!teamCode || !playerId || !year) continue;

		const given = String(row.given_name || "").trim();
		const family = String(row.family_name || "").trim();

		const key = `${teamCode}|${playerId}`;
		let rec = playersByCode.get(key);
		if (!rec) {
			rec = {
				teamCode,
				playerId,
				givenName: given,
				familyName: family,
				yearsSet: new Set(),
				appsByYear: new Map(),
				goalsByYear: new Map(),
			};
			playersByCode.set(key, rec);
		}

		rec.yearsSet.add(year);
		rec.appsByYear.set(year, (rec.appsByYear.get(year) || 0) + 1);
	}

	for (const row of goals) {
		const teamCode = String(row.player_team_code || row.team_code || "").trim();
		const playerId = String(row.player_id || "").trim();
		const year = yearFromTournamentId(row.tournament_id);
		const ownGoal = String(row.own_goal || "0") === "1";
		if (!teamCode || !playerId || !year || ownGoal) continue;

		const key = `${teamCode}|${playerId}`;
		const rec = playersByCode.get(key);
		if (!rec) continue;

		rec.goalsByYear.set(year, (rec.goalsByYear.get(year) || 0) + 1);
	}

	const candidatesByTeamCode = new Map();
	for (const rec of playersByCode.values()) {
		const c = {
			playerId: rec.playerId,
			givenName: rec.givenName,
			familyName: rec.familyName,
			years: Array.from(rec.yearsSet),
			appsByYear: rec.appsByYear,
			goalsByYear: rec.goalsByYear,
		};
		if (!candidatesByTeamCode.has(rec.teamCode)) {
			candidatesByTeamCode.set(rec.teamCode, []);
		}
		candidatesByTeamCode.get(rec.teamCode).push(c);
	}

	let matchedPlayers = 0;
	let skippedPlayers = 0;

	for (const [teamKey, players] of Object.entries(playersJson)) {
		const localTeamCode = teamCodeByKey[teamKey];
		const teamCode = TEAM_CODE_ALIASES[localTeamCode] || localTeamCode;
		const candidates = candidatesByTeamCode.get(teamCode) || [];

		for (const p of players) {
			const best = chooseBestCandidate(p, candidates);
			if (!best) {
				skippedPlayers += 1;
				continue;
			}

			const byYear = {};
			const sortedYears = [...(p.years || [])].sort(
				(a, b) => Number(a) - Number(b),
			);

			for (const y of sortedYears) {
				const year = Number(y);
				const apps = Number(best.appsByYear.get(year) || 0);
				const goalsVal = Number(best.goalsByYear.get(year) || 0);

				if (apps > 0 || goalsVal > 0) {
					byYear[String(year)] = { apps, goals: goalsVal };
				}
			}

			if (Object.keys(byYear).length) {
				p.byYear = byYear;
				// Save given/family names from the dataset for display purposes
				if (best.givenName) p.given = best.givenName;
				if (best.familyName) p.family = best.familyName;
				matchedPlayers += 1;
			} else {
				skippedPlayers += 1;
			}
		}
	}

	fs.writeFileSync(
		playersPath,
		`${JSON.stringify(playersJson, null, 2)}\n`,
		"utf8",
	);

	console.log(`Matched players with byYear data: ${matchedPlayers}`);
	console.log(`Players without resolvable byYear data: ${skippedPlayers}`);
	console.log(`Updated file: ${playersPath}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
