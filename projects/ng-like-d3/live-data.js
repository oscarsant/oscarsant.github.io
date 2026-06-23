/**
 * live-data.js
 * Fetches current season results + next fixture for the selected national team
 * using TheSportsDB free API (v1, no key required).
 *
 * Usage:
 *   initLiveData(teamKey)   — call once after page load
 *   destroyLiveData()       — call when navigating away
 */

(function () {
	"use strict";

	const TSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";
	const CACHE_TTL = 60 * 1000; // 60 seconds
	const REFRESH_INTERVAL = 60 * 1000;
	const CONTAINER_ID = "live-data-bar";

	// Map our internal team keys → TheSportsDB team names
	const TEAM_NAME_MAP = {
		argentina: "Argentina",
		australia: "Australia",
		austria: "Austria",
		belgium: "Belgium",
		bolivia: "Bolivia",
		bosnia: "Bosnia and Herzegovina",
		brazil: "Brazil",
		bulgaria: "Bulgaria",
		cameroon: "Cameroon",
		canada: "Canada",
		chile: "Chile",
		china: "China",
		colombia: "Colombia",
		"costa-rica": "Costa Rica",
		croatia: "Croatia",
		"czech-republic": "Czech Republic",
		denmark: "Denmark",
		ecuador: "Ecuador",
		egypt: "Egypt",
		england: "England",
		france: "France",
		germany: "Germany",
		ghana: "Ghana",
		greece: "Greece",
		honduras: "Honduras",
		hungary: "Hungary",
		iceland: "Iceland",
		iran: "Iran",
		ireland: "Republic of Ireland",
		israel: "Israel",
		italy: "Italy",
		"ivory-coast": "Ivory Coast",
		japan: "Japan",
		mexico: "Mexico",
		morocco: "Morocco",
		netherlands: "Netherlands",
		nigeria: "Nigeria",
		norway: "Norway",
		panama: "Panama",
		paraguay: "Paraguay",
		peru: "Peru",
		poland: "Poland",
		portugal: "Portugal",
		qatar: "Qatar",
		romania: "Romania",
		russia: "Russia",
		"saudi-arabia": "Saudi Arabia",
		scotland: "Scotland",
		senegal: "Senegal",
		serbia: "Serbia",
		slovakia: "Slovakia",
		slovenia: "Slovenia",
		"south-africa": "South Africa",
		"south-korea": "South Korea",
		spain: "Spain",
		sweden: "Sweden",
		switzerland: "Switzerland",
		togo: "Togo",
		trinidad: "Trinidad and Tobago",
		tunisia: "Tunisia",
		turkey: "Turkey",
		ukraine: "Ukraine",
		uruguay: "Uruguay",
		usa: "USA",
		wales: "Wales",
	};

	let _refreshTimer = null;
	let _currentTeamKey = null;
	let _tsdbTeamId = null;

	// ── localStorage cache helpers ─────────────────────────────────────────────

	function cacheSet(key, data) {
		try {
			localStorage.setItem(
				"livedata_" + key,
				JSON.stringify({ ts: Date.now(), data }),
			);
		} catch (_) {}
	}

	function cacheGet(key) {
		try {
			const raw = localStorage.getItem("livedata_" + key);
			if (!raw) return null;
			const { ts, data } = JSON.parse(raw);
			if (Date.now() - ts > CACHE_TTL) return null;
			return data;
		} catch (_) {
			return null;
		}
	}

	// ── API fetch with cache ───────────────────────────────────────────────────

	async function apiFetch(path) {
		const cached = cacheGet(path);
		if (cached !== null) return cached;
		const res = await fetch(TSDB_BASE + path);
		if (!res.ok) throw new Error(`TSDB ${res.status}: ${path}`);
		const json = await res.json();
		cacheSet(path, json);
		return json;
	}

	// ── Resolve TSDB team ID from name ────────────────────────────────────────

	async function resolveTeamId(teamName) {
		const cacheKey = "teamid_" + teamName;
		const cached = cacheGet(cacheKey);
		if (cached) return cached;

		const data = await apiFetch(
			`/searchteams.php?t=${encodeURIComponent(teamName)}`,
		);
		const teams = data.teams || [];
		// prefer national (Soccer / International) team over club
		const team =
			teams.find(
				(t) =>
					t.strSport === "Soccer" &&
					(t.strLeague?.toLowerCase().includes("international") ||
						t.strCountry?.toLowerCase() === teamName.toLowerCase() ||
						t.strTeam?.toLowerCase() === teamName.toLowerCase()),
			) || teams[0];

		if (!team) return null;
		const id = team.idTeam;
		cacheSet(cacheKey, id);
		return id;
	}

	// ── Fetch last 5 results ──────────────────────────────────────────────────

	async function fetchLastResults(teamId) {
		const data = await apiFetch(`/eventslast.php?id=${teamId}`);
		return (data.results || []).slice(0, 5);
	}

	// ── Fetch next fixture ────────────────────────────────────────────────────

	async function fetchNextFixture(teamId) {
		const data = await apiFetch(`/eventsnext.php?id=${teamId}`);
		return (data.events || [])[0] || null;
	}

	// ── Build / update the DOM bar ────────────────────────────────────────────

	function ensureContainer() {
		let el = document.getElementById(CONTAINER_ID);
		if (!el) {
			el = document.createElement("div");
			el.id = CONTAINER_ID;
			el.className = "live-data-bar";
			// Insert right after team-info-header
			const header = document.getElementById("team-info-header");
			if (header && header.parentNode) {
				header.parentNode.insertBefore(el, header.nextSibling);
			}
		}
		return el;
	}

	function formatDate(dateStr) {
		if (!dateStr) return "";
		const d = new Date(dateStr);
		if (isNaN(d)) return dateStr;
		return d.toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	}

	function resultClass(event, teamId) {
		const homeId = event.idHomeTeam;
		const awayId = event.idAwayTeam;
		const hs = parseInt(event.intHomeScore, 10);
		const as = parseInt(event.intAwayScore, 10);
		if (isNaN(hs) || isNaN(as)) return "live-result--draw";
		const teamIsHome = homeId === teamId;
		const teamScore = teamIsHome ? hs : as;
		const oppScore = teamIsHome ? as : hs;
		if (teamScore > oppScore) return "live-result--win";
		if (teamScore < oppScore) return "live-result--loss";
		return "live-result--draw";
	}

	function renderBar(container, results, next, teamId) {
		// D3 enter/update/exit for result pills
		const sel = d3.select(container);

		// Header row
		let header = sel.select(".live-bar-header");
		if (header.empty()) {
			header = sel.append("div").attr("class", "live-bar-header");
			header.append("span").attr("class", "live-badge").text("LIVE");
			header
				.append("span")
				.attr("class", "live-bar-label")
				.text("Current season");
			header.append("span").attr("class", "live-updated-at");
		}
		header
			.select(".live-updated-at")
			.text(
				"Updated " +
					new Date().toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					}),
			);

		// Results row
		let resultsRow = sel.select(".live-results-row");
		if (resultsRow.empty())
			resultsRow = sel.append("div").attr("class", "live-results-row");

		const pills = resultsRow
			.selectAll(".live-result-pill")
			.data(results, (d) => d.idEvent);

		const enter = pills
			.enter()
			.append("div")
			.attr("class", (d) => "live-result-pill " + resultClass(d, teamId))
			.attr(
				"title",
				(d) =>
					`${d.strHomeTeam} ${d.intHomeScore}–${d.intAwayScore} ${d.strAwayTeam}\n${formatDate(d.dateEvent)}`,
			);

		enter
			.append("span")
			.attr("class", "live-pill-opp")
			.text((d) => {
				const isHome = d.idHomeTeam === teamId;
				return (isHome ? d.strAwayTeam : d.strHomeTeam) || "?";
			});
		enter
			.append("span")
			.attr("class", "live-pill-score")
			.text((d) => `${d.intHomeScore ?? "?"}–${d.intAwayScore ?? "?"}`);

		pills.exit().remove();

		// Next fixture
		let nextEl = sel.select(".live-next");
		if (nextEl.empty()) nextEl = sel.append("div").attr("class", "live-next");

		if (next) {
			const isHome = next.idHomeTeam === teamId;
			const opp = isHome ? next.strAwayTeam : next.strHomeTeam;
			nextEl.html(
				`<span class="live-next-label">Next</span>` +
					`<span class="live-next-opp">${opp}</span>` +
					`<span class="live-next-date">${formatDate(next.dateEvent)}</span>`,
			);
		} else {
			nextEl.html("");
		}
	}

	// ── Main refresh cycle ────────────────────────────────────────────────────

	async function refresh() {
		if (!_tsdbTeamId) return;
		try {
			const [results, next] = await Promise.all([
				fetchLastResults(_tsdbTeamId),
				fetchNextFixture(_tsdbTeamId),
			]);
			const container = ensureContainer();
			renderBar(container, results, next, _tsdbTeamId);
			container.classList.remove("live-data-bar--error");
		} catch (err) {
			console.warn("[live-data] refresh failed:", err.message);
			const container = document.getElementById(CONTAINER_ID);
			if (container) container.classList.add("live-data-bar--error");
		}
	}

	// ── Public API ─────────────────────────────────────────────────────────────

	window.initLiveData = async function (teamKey) {
		_currentTeamKey = teamKey;
		const teamName = TEAM_NAME_MAP[teamKey];
		if (!teamName) return; // not a mapped team, silently skip

		try {
			_tsdbTeamId = await resolveTeamId(teamName);
			if (!_tsdbTeamId) return;

			await refresh();
			clearInterval(_refreshTimer);
			_refreshTimer = setInterval(refresh, REFRESH_INTERVAL);
		} catch (err) {
			console.warn("[live-data] init failed:", err.message);
		}
	};

	window.destroyLiveData = function () {
		clearInterval(_refreshTimer);
		_refreshTimer = null;
		_tsdbTeamId = null;
		const el = document.getElementById(CONTAINER_ID);
		if (el) el.remove();
	};
})();
