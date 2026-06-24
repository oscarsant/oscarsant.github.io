(async function () {
	// ── Load teams index ─────────────────────────────────────────────────────
	let teamsIndex = [];
	try {
		const res = await fetch("teams-index.json");
		teamsIndex = await res.json();
	} catch (e) {
		console.error("Failed to load teams-index.json", e);
		window.location.href = "index.html";
		return;
	}

	// Build a lookup map by key
	const teamFiles = Object.fromEntries(teamsIndex.map((t) => [t.key, t]));

	// Get team from URL parameter
	const urlParams = new URLSearchParams(window.location.search);
	const teamParam = urlParams.get("team") || "brazil";
	const initialTabParam = urlParams.get("tab") || "timeline";
	const teamInfo = teamFiles[teamParam];

	if (!teamInfo) {
		window.location.href = "index.html";
		return;
	}

	// Load team tournament data and players in parallel
	// All team data files are now in data/ subfolder
	const [tournaments, playersData] = await Promise.all([
		d3.json(`data/${teamParam}.json`),
		d3.json("players.json?v=20260623f"),
	]);
	const team = {
		...teamInfo,
		tournaments,
	};
	const players = (playersData[teamParam] || []).slice();

	// Update page elements
	document.title = `${team.name} — World Cup History`;
	document.getElementById("team-name-title").textContent = team.name;
	// Render championship trophies
	const titlesEl = document.getElementById("team-titles");
	if (titlesEl && team.titles > 0) {
		const champYears = team.tournaments
			.filter((t) => t.stage === "W")
			.map((t) => t.year)
			.sort((a, b) => a - b);
		titlesEl.innerHTML = champYears
			.map(() => `<img src="WC-Trophy.svg" class="team-title-icon" alt="" />`)
			.join("");
		titlesEl.title = champYears.join(", ");
	}
	document.getElementById("team-rank").textContent = team.rank;
	document.getElementById("team-points").textContent = team.points;
	document.getElementById("team-appearances").textContent = team.appearances;
	document.getElementById("team-badge").src = team.badge;
	document.getElementById("team-badge").alt = `${team.name} badge`;

	// Update team flag with flag icon
	const flagCode = getCountryCode(team.abbr);
	const teamFlagElement = document.getElementById("team-flag");
	teamFlagElement.className = "team-flag";
	teamFlagElement.innerHTML = `<span class="fi fi-${flagCode}"></span>`;

	// Update stats cards
	document.getElementById("stat-gp").textContent = team.gp;
	document.getElementById("stat-w").textContent = team.w;
	document.getElementById("stat-d").textContent = team.d;
	document.getElementById("stat-l").textContent = team.l;
	document.getElementById("stat-gs").textContent = team.gs;
	document.getElementById("stat-ga").textContent = team.ga;
	const gdEl = document.getElementById("stat-gd");
	gdEl.textContent = team.gd >= 0 ? `+${team.gd}` : team.gd;
	gdEl.style.color = team.gd < 0 ? "#fca5a5" : "";

	// Create Games bar chart
	createGamesChart(team);

	// Create Goals bar chart
	createGoalsChart(team);

	// Team selector — populate from index, set current team
	const teamSelectEl = document.getElementById("team-select");
	teamsIndex
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name))
		.forEach((t) => {
			const opt = document.createElement("option");
			opt.value = t.key;
			opt.textContent = `${t.name} (${t.abbr})`;
			if (t.key === teamParam) opt.selected = true;
			teamSelectEl.appendChild(opt);
		});
	teamSelectEl.addEventListener("change", (e) => {
		const activeTab =
			document.querySelector(".tab.active")?.dataset.tab || "timeline";
		window.location.href = `team-view.html?team=${e.target.value}&tab=${activeTab}`;
	});

	// Size dropdown to selected option text (no padding — wrapper owns all spacing)
	const _sizer = document.createElement("span");
	_sizer.style.cssText =
		"position:absolute;visibility:hidden;white-space:nowrap;font:500 0.8125rem/1 inherit;padding:0;";
	document.body.appendChild(_sizer);
	const fitSelect = (sel) => {
		_sizer.textContent = sel.options[sel.selectedIndex]?.text || "";
		sel.style.width = _sizer.offsetWidth + "px";
	};
	fitSelect(teamSelectEl);
	teamSelectEl.addEventListener("change", () => fitSelect(teamSelectEl));

	// Tab switching
	const tabBtns = document.querySelectorAll(".tab");
	const tabPanels = document.querySelectorAll(".tab-panel");
	const teamInfoHeader = document.getElementById("team-info-header");
	const TEAM_TABS = new Set(["timeline", "players"]);
	const VALID_TABS = new Set([
		"timeline",
		"players",
		"all-players",
		"head-to-head",
		"compare",
	]);
	let playersRendered = false;
	let allPlayersRendered = false;
	let h2hReady = false;
	let compareReady = false;

	function activateTab(tabKey, syncUrl = true) {
		if (!VALID_TABS.has(tabKey)) return;
		tabBtns.forEach((t) =>
			t.classList.toggle("active", t.dataset.tab === tabKey),
		);
		tabPanels.forEach((p) =>
			p.classList.toggle("active", p.dataset.panel === tabKey),
		);

		teamInfoHeader.classList.toggle(
			"team-info-header--hidden",
			!TEAM_TABS.has(tabKey),
		);

		if (tabKey === "players" && !playersRendered) {
			renderPlayersChart(players);
			playersRendered = true;
		}
		if (tabKey === "all-players" && !allPlayersRendered) {
			renderAllPlayersTab(playersData);
			allPlayersRendered = true;
		}
		if (tabKey === "head-to-head" && !h2hReady) {
			initH2H();
			h2hReady = true;
		}
		if (tabKey === "compare" && !compareReady) {
			renderCompareTab(teamParam);
			compareReady = true;
		}

		if (syncUrl) {
			const next = new URL(window.location.href);
			next.searchParams.set("team", teamParam);
			next.searchParams.set("tab", tabKey);
			window.history.replaceState({}, "", next);
		}
	}

	tabBtns.forEach((tab) => {
		tab.addEventListener("click", () => {
			activateTab(tab.dataset.tab);
		});
	});

	// Render D3 visualization
	const container = d3.select("#timeline-container");
	container.html(""); // clear skeleton
	const tt = d3.select("#tt");

	// Render chart
	const isMobile = window.innerWidth < 768;
	const svg = container
		.append("svg")
		.attr("height", isMobile ? 700 : 700)
		.attr("role", "img")
		.attr("aria-label", `${team.name} World Cup timeline`);

	const HOST_NATIONS = {
		uruguay: [1930],
		italy: [1934, 1990],
		france: [1938, 1998],
		brazil: [1950, 2014],
		switzerland: [1954],
		sweden: [1958],
		chile: [1962],
		england: [1966],
		mexico: [1970, 1986],
		germany: [1974, 2006],
		argentina: [1978],
		spain: [1982],
		usa: [1994, 2026],
		"south-korea": [2002],
		japan: [2002],
		"south-africa": [2010],
		russia: [2018],
		qatar: [2022],
	};

	renderChart(svg, team);

	// Dismiss tooltip on touch outside a dot or on scroll (mobile)
	document.addEventListener(
		"touchstart",
		function (ev) {
			if (!ev.target.closest("circle")) tt.style("opacity", 0);
		},
		{ passive: true },
	);
	document.addEventListener(
		"scroll",
		function () {
			tt.style("opacity", 0);
		},
		{ passive: true, capture: true },
	);

	function renderChart(svg, team) {
		const margin = { top: 40, right: 10, bottom: 20, left: 30 };
		const W = svg.node().clientWidth || 1200;
		const H = +svg.attr("height");
		const w = W - margin.left - margin.right;
		const h = H - margin.top - margin.bottom;

		const years = d3.sort(
			d3.union(team.tournaments.map((t) => t.year)),
			d3.ascending,
		);
		const tournamentMap = new Map(team.tournaments.map((t) => [t.year, t]));

		const tournamentFormats = TOURNAMENT_FORMATS;
		const stageValues = STAGE_VALUES;
		const x = d3.scaleLinear().domain([0.98, 6]).range([5, w]);
		const y = d3.scaleBand().domain(years).range([0, h]).padding(0.1);

		const g = svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// Add grid lines
		const stagePositions = [1, 2, 3, 4, 5, 6];
		g.append("g")
			.attr("class", "grid")
			.selectAll("line")
			.data(stagePositions)
			.join("line")
			.attr("x1", (d) => x(d))
			.attr("x2", (d) => x(d))
			.attr("y1", 0)
			.attr("y2", h)
			.attr("stroke", "rgba(255,255,255,.04)")
			.attr("stroke-width", 1);

		// Add year labels
		g.append("g")
			.selectAll("text")
			.data(years)
			.join("text")
			.attr("x", -5)
			.attr("y", (d) => y(d) + y.bandwidth() / 2)
			.attr("text-anchor", "end")
			.attr("dy", "0.35em")
			.attr("fill", "rgba(255,255,255,.5)")
			.attr("font-size", 11)
			.attr("font-weight", 500)
			.text((d) => (isMobile ? "'" + String(d).slice(2) : d));

		// Add host nation rectangles
		const hostYears = new Set(HOST_NATIONS[teamParam] || []);
		g.append("g")
			.selectAll("rect")
			.data(years.filter((year) => hostYears.has(year)))
			.join("rect")
			.attr("x", isMobile ? -22 : -32)
			.attr("y", (d) => y(d) + y.bandwidth() / 2 - 10)
			.attr("width", isMobile ? 19 : 30)
			.attr("height", 20)
			.attr("fill", "none")
			.attr("stroke", "rgba(246, 20, 20, 0.2)")
			.attr("stroke-width", 1)
			.attr("rx", 4);

		// Add stage labels
		const stageLabelsShort = ["GS", "R16", "QF", "SF", "F", "W"];
		g.append("g")
			.selectAll("text")
			.data(stageLabelsShort)
			.join("text")
			.attr("x", (d, i) => x(i + 1))
			.attr("y", -8)
			.attr("text-anchor", "middle")
			.attr("fill", "rgba(255,255,255,.4)")
			.attr("font-size", 10)
			.attr("font-weight", 500)
			.text((d) => d);

		// Draw tournament bars
		const bars = g
			.selectAll(".bar")
			.data(years)
			.join("g")
			.attr("class", "bar")
			.attr("transform", (d) => `translate(0,${y(d)})`);

		bars.each(function (year) {
			const tournament = tournamentMap.get(year);
			if (!tournament) return;

			const barHeight = y.bandwidth();
			const stage = tournament.stage;

			let stageValue;
			if (
				(stage === "3P" || stage === "4P") &&
				(year === 1974 || year === 1978)
			) {
				stageValue = 1.5;
			} else if ((stage === "3P" || stage === "4P") && year === 1950) {
				// All 4 Final Round teams reached the same stage — show at RU dot
				stageValue = 5;
			} else {
				stageValue = stageValues[stage] || 0;
			}

			if (stageValue === 0) {
				const dnqLabels = {
					DNQ: "Did not qualify",
					DNE: "Did not enter",
					WD: "Withdrew",
					BAN: "Banned",
				};
				d3.select(this)
					.append("text")
					.attr("class", "dnq-label")
					.attr("x", 5)
					.attr("y", barHeight / 2)
					.attr("dy", "0.35em")
					.attr("font-size", 9)
					.text(dnqLabels[stage] || stage);
				return;
			}

			const yearStages = tournamentFormats[year] || [
				"GS",
				"R16",
				"QF",
				"SF",
				"RU",
				"W",
			];
			const stagePositions = yearStages.map((s) => ({
				code: s,
				value: stageValues[s],
			}));

			const minPos = Math.min(...stagePositions.map((s) => s.value));
			const maxPos = Math.max(...stagePositions.map((s) => s.value));

			// Background line
			d3.select(this)
				.append("line")
				.attr("x1", x(minPos))
				.attr("x2", x(maxPos))
				.attr("y1", barHeight / 2)
				.attr("y2", barHeight / 2)
				.attr("stroke", "rgba(255,255,255,.1)")
				.attr("stroke-width", 1);

			// Progress line
			d3.select(this)
				.append("line")
				.attr("x1", x(minPos))
				.attr("x2", x(stageValue))
				.attr("y1", barHeight / 2)
				.attr("y2", barHeight / 2)
				.attr("stroke", "rgba(255,255,255,.4)")
				.attr("stroke-width", 2);

			// Draw dots
			stagePositions.forEach((stg) => {
				const reached = stageValue >= stg.value;
				const isCurrent = stageValue === stg.value;
				const dotRadius = isCurrent && stg.code === "W" ? 8 : 5;

				let dotColor = "rgba(255,255,255,.8)";
				if (reached) {
					if (stg.code === "W") {
						dotColor = "#fde68a"; // Pastel yellow for champions
					} else if (stg.code === "GS" || stg.code === "2GS") {
						dotColor = "#93c5fd"; // Pastel blue for group stage
					} else if (stg.code === "RU" && year === 1950) {
						// 1950 had a final group stage, not a knockout final
						dotColor = "#93c5fd"; // Pastel blue
					} else {
						dotColor = "#fca5a5"; // Pastel red for knockout stages
					}
				}

				// Check if this stage had a penalty shootout
				let hadPenalties = false;
				if (tournament.matches && reached) {
					// Check all reached stages, not just current
					// For Runner-up (RU), check "F" stage matches
					// Skip W (Champion) since penalties are already shown on RU/F
					if (stg.code === "RU") {
						hadPenalties = tournament.matches.some(
							(m) => m.stage === "F" && m.penalties,
						);
					} else if (stg.code !== "W") {
						// For other stages (except W), check the exact stage code
						hadPenalties = tournament.matches.some(
							(m) => m.stage === stg.code && m.penalties,
						);
					}
				}

				// Add penalty indicator circle (outer ring)
				if (hadPenalties) {
					d3.select(this)
						.append("circle")
						.attr("cx", x(stg.value))
						.attr("cy", barHeight / 2)
						.attr("r", dotRadius + 4)
						.attr("fill", "none")
						.attr("stroke", dotColor)
						.attr("stroke-width", 1)
						.attr("opacity", 1)
						.style("pointer-events", "none");
				}

				const dot = d3
					.select(this)
					.append("circle")
					.attr("cx", x(stg.value))
					.attr("cy", barHeight / 2)
					.attr("r", dotRadius)
					.attr("fill", reached ? dotColor : "none")
					.attr("stroke", reached ? dotColor : "rgba(255,255,255,.4)")
					.attr("stroke-width", 1.5)
					.style(
						"cursor",
						!reached || (isCurrent && stg.code === "W") ? "default" : "pointer",
					)
					.classed(
						"dot--interactive",
						reached && !(isCurrent && stg.code === "W"),
					);

				// Tooltip
				dot
					.on("mousemove", function (ev) {
						ev.stopPropagation();
						// No tooltip for champion star or not-reached dots
						if (isCurrent && stg.code === "W") return;
						if (!reached) return;
						let tooltipContent = "";

						if (reached) {
							tooltipContent += `<div class="tt-sub">${stageLabel(stg.code)}`;

							if (isCurrent) {
								if (stg.code === "RU") {
									tooltipContent += ` • Runners-up`;
								} else if (stg.code === "3P") {
									tooltipContent += ` • 3rd Place`;
								} else if (stg.code === "4P") {
									tooltipContent += ` • 4th Place`;
								}
							}

							tooltipContent += `</div>`;

							// Add match details
							if (tournament.matches && tournament.matches.length > 0) {
								let stageMatches = [];

								if (stg.code === "W" || stg.code === "RU") {
									stageMatches = tournament.matches.filter(
										(m) => m.stage === "F",
									);
								} else if (stg.code === "GS") {
									stageMatches = tournament.matches.filter(
										(m) => m.stage === "GS",
									);
								} else if (stg.code === "2GS") {
									stageMatches = tournament.matches.filter(
										(m) => m.stage === "2GS",
									);
									if (tournament.stage === "3P" || tournament.stage === "4P") {
										const thirdPlaceMatch = tournament.matches.filter(
											(m) => m.stage === "3P",
										);
										stageMatches = [...stageMatches, ...thirdPlaceMatch];
									}
								} else if (stg.code === "R16") {
									stageMatches = tournament.matches.filter(
										(m) => m.stage === "R16",
									);
								} else if (stg.code === "QF") {
									stageMatches = tournament.matches.filter(
										(m) => m.stage === "QF",
									);
								} else if (stg.code === "SF") {
									stageMatches = tournament.matches.filter(
										(m) => m.stage === "SF",
									);
									if (tournament.stage === "3P" || tournament.stage === "4P") {
										const thirdPlaceMatch = tournament.matches.filter(
											(m) => m.stage === "3P",
										);
										stageMatches = [...stageMatches, ...thirdPlaceMatch];
									}
								} else if (stg.code === "3P" || stg.code === "4P") {
									stageMatches = tournament.matches.filter(
										(m) => m.stage === "3P",
									);
								}

								if (stageMatches.length > 0) {
									tooltipContent += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">`;
									stageMatches.forEach((match) => {
										const iconName =
											match.result === "W"
												? "check"
												: match.result === "L"
													? "close"
													: "remove";
										const iconColor =
											match.result === "W"
												? "#4ade80"
												: match.result === "L"
													? "#f87171"
													: "#fbbf24";
										const resultIcon = `<span class="material-symbols-outlined" style="font-size:14px;width:14px;height:14px;color:${iconColor};flex-shrink:0">${iconName}</span>`;
										tooltipContent += `<div style="font-size:13px;margin:6px 0;display:flex;align-items:center;gap:5px;">${resultIcon}${match.score} vs ${match.opponent}`;
										if (match.penalties) {
											tooltipContent += ` (${match.penalties} pen)`;
										}
										if (match.stage === "3P") {
											tooltipContent += ` <span style="color: rgba(255,255,255,0.4); font-style: italic;">• 3rd place playoff</span>`;
										}
										tooltipContent += `</div>`;
									});
									tooltipContent += `</div>`;
								}
							}
						}

						tt.style("opacity", 1).html(tooltipContent);
						const ttNode = tt.node();
						const ttW = ttNode.offsetWidth || 200;
						const ttH = ttNode.offsetHeight || 80;
						const vw = window.innerWidth;
						const vh = window.innerHeight;
						const offset = 1;
						const onRightHalf = ev.clientX > vw / 2;
						let ttLeft = onRightHalf
							? ev.clientX - ttW - offset
							: ev.clientX + offset;
						let ttTop = ev.clientY + offset;
						ttLeft = Math.max(8, Math.min(ttLeft, vw - ttW - 8));
						ttTop = Math.max(8, Math.min(ttTop, vh - ttH - 8));
						tt.style("left", ttLeft + "px").style("top", ttTop + "px");
					})
					.on("mouseleave", function (ev) {
						ev.stopPropagation();
						tt.style("opacity", 0);
					})
					.on("touchstart", function (ev) {
						ev.stopPropagation();
						const touch = ev.touches[0];
						const syntheticEv = {
							clientX: touch.clientX,
							clientY: touch.clientY,
							stopPropagation: () => {},
						};
						const mouseHandler = d3.select(this).on("mousemove");
						if (mouseHandler) mouseHandler.call(this, syntheticEv);
					});

				// Add star for champions
				if (isCurrent && stg.code === "W") {
					d3.select(this)
						.append("path")
						.attr("d", starPath(dotRadius * 0.7))
						.attr("transform", `translate(${x(stg.value)}, ${barHeight / 2})`)
						.attr("fill", "#000")
						.style("pointer-events", "none");
				}
			});
		});
	}

	// Functions for creating visualizations
	function createGamesChart(team) {
		const container = d3.select("#games-bar-chart");
		container.selectAll("*").remove();

		const data = [
			{ label: "W", value: team.w, color: "#a7f3d0" },
			{ label: "D", value: team.d, color: "#fde68a" },
			{ label: "L", value: team.l, color: "#fca5a5" },
		];

		const width = container.node().clientWidth;
		const height = 5;

		const svg = container
			.append("svg")
			.attr("width", width)
			.attr("height", height);

		const x = d3.scaleLinear().domain([0, team.gp]).range([0, width]);

		// Calculate cumulative positions for stacking
		let cumulative = 0;
		const stackedData = data.map((d) => {
			const start = cumulative;
			cumulative += d.value;
			return {
				...d,
				start,
				end: cumulative,
			};
		});

		// Draw stacked bars
		stackedData.forEach((d, i) => {
			const barWidth = x(d.value);

			svg
				.append("rect")
				.attr("x", x(d.start))
				.attr("y", 0)
				.attr("width", 0)
				.attr("height", height)
				.attr("fill", d.color)
				.attr("rx", i === 0 ? 3 : i === data.length - 1 ? 3 : 0)
				.transition()
				.duration(1000)
				.delay(i * 150)
				.attr("width", barWidth);
		});
	}

	function createGoalsChart(team) {
		const container = d3.select("#goals-bar-chart");
		container.selectAll("*").remove();

		const width = container.node().clientWidth;
		const height = 5;

		const svg = container
			.append("svg")
			.attr("width", width)
			.attr("height", height);

		const centerX = width / 2;

		// Use the larger value to set the scale
		const maxValue = Math.max(team.gs, team.ga);
		const x = d3
			.scaleLinear()
			.domain([0, maxValue])
			.range([0, width / 2]);

		// Goals Scored (right side)
		svg
			.append("rect")
			.attr("x", centerX)
			.attr("y", 0)
			.attr("width", 0)
			.attr("height", height)
			.attr("fill", "#a7f3d0")
			.attr("rx", 3)
			.transition()
			.duration(1000)
			.attr("width", x(team.gs));

		// Goals Against (left side)
		svg
			.append("rect")
			.attr("x", centerX)
			.attr("y", 0)
			.attr("width", 0)
			.attr("height", height)
			.attr("fill", "#fca5a5")
			.attr("rx", 3)
			.transition()
			.duration(1000)
			.delay(200)
			.attr("x", centerX - x(team.ga))
			.attr("width", x(team.ga));

		// Goal Difference region (shaded overlay)
		if (team.gd !== 0) {
			const gdColor = team.gd > 0 ? "#a7f3d0" : "#fca5a5";
			const gdWidth = x(Math.abs(team.gd));
			const gdX = team.gd > 0 ? centerX : centerX - gdWidth;

			svg
				.append("rect")
				.attr("x", gdX)
				.attr("y", 0)
				.attr("width", gdWidth)
				.attr("height", height)
				.attr("fill", gdColor)
				.attr("opacity", 0)
				.attr("rx", 2)
				.transition()
				.duration(800)
				.delay(1400)
				.attr("opacity", 0.3);
		}
	}

	// ── Shared player-card utilities ─────────────────────────────────────────
	const CHART_MAX_UNITS = 10;
	const ALL_WC_EDITIONS = Object.keys(TOURNAMENT_FORMATS)
		.map((y) => Number(y))
		.filter(Number.isFinite)
		.sort((a, b) => a - b);
	const CHART_SLOTS = Math.max(1, ALL_WC_EDITIONS.length);
	const posColors = {
		FW: "#fca5a5",
		MF: "#93c5fd",
		DF: "#86efac",
		GK: "#fde68a",
	};
	const TEAM_CHAMPIONSHIP_YEARS = {
		brazil: [1958, 1962, 1970, 1994, 2002],
		germany: [1954, 1974, 1990, 2014],
		italy: [1934, 1938, 1982, 2006],
		argentina: [1978, 1986, 2022],
		france: [1998, 2018],
		uruguay: [1930, 1950],
		england: [1966],
		spain: [2010],
	};

	const parseNonNegative = (v) => {
		const n = Number(v);
		return Number.isFinite(n) && n >= 0 ? n : null;
	};

	const editionMaxGames = (year) => {
		if (!Number.isFinite(Number(year))) return 0;
		const y = Number(year);
		if (y === 2026) return 8; // 48-team format: GS(3) + R32 + R16 + QF + SF + Final
		if (y >= 1986) return 7;
		if (y === 1982) return 7;
		if (y === 1974 || y === 1978) return 7;
		if (y >= 1958 && y <= 1970) return 6;
		if (y === 1954) return 5;
		if (y === 1950) return 6;
		if (y === 1934 || y === 1938) return 4;
		if (y === 1930) return 5;
		return 0;
	};

	const allocateByWeights = (total, weights) => {
		const safeTotal = Math.max(0, Number(total) || 0);
		const safeWeights = weights.map((w) => Math.max(0, Number(w) || 0));
		const sumW = safeWeights.reduce((a, b) => a + b, 0) || 1;
		const raw = safeWeights.map((w) => (safeTotal * w) / sumW);
		const base = raw.map((v) => Math.floor(v));
		let rem = safeTotal - base.reduce((a, b) => a + b, 0);
		const order = raw
			.map((v, i) => ({ i, frac: v - Math.floor(v) }))
			.sort((a, b) => b.frac - a.frac)
			.map((d) => d.i);
		let ptr = 0;
		while (rem > 0) {
			base[order[ptr % order.length]] += 1;
			rem -= 1;
			ptr += 1;
		}
		return base;
	};

	const allocateWithCaps = (total, weights, caps) => {
		const safeCaps = caps.map((c) => Math.max(0, Math.floor(Number(c) || 0)));
		const capSum = safeCaps.reduce((a, b) => a + b, 0);
		let remaining = Math.min(
			Math.max(0, Math.floor(Number(total) || 0)),
			capSum,
		);
		const out = Array.from({ length: safeCaps.length }, () => 0);
		while (remaining > 0) {
			const available = safeCaps
				.map((cap, i) => ({
					i,
					left: cap - out[i],
					w: Math.max(0, Number(weights[i]) || 0),
				}))
				.filter((d) => d.left > 0);
			if (!available.length) break;
			const baseWeights = available.map((d) => d.w || 1);
			const chunk = allocateByWeights(remaining, baseWeights);
			let placed = 0;
			available.forEach((d, j) => {
				if (remaining <= 0) return;
				const add = Math.min(chunk[j] || 0, d.left, remaining);
				if (add > 0) {
					out[d.i] += add;
					remaining -= add;
					placed += add;
				}
			});
			if (placed === 0) {
				const idx = available[0].i;
				out[idx] += 1;
				remaining -= 1;
			}
		}
		return out;
	};

	const buildSeries = (p) => {
		const years = [...(p.years || [])].sort((a, b) => a - b);
		if (years.length === 0)
			return { years: [], apps: [], goals: [], capacities: [] };
		const byYear = p.byYear && typeof p.byYear === "object" ? p.byYear : null;
		const explicitApps = years.map((year) =>
			parseNonNegative(byYear?.[year]?.apps),
		);
		const explicitGoals = years.map((year) =>
			parseNonNegative(byYear?.[year]?.goals),
		);
		const capacities = years.map((year, i) => {
			const explicitMax = parseNonNegative(byYear?.[year]?.maxApps);
			if (explicitMax !== null) return Math.min(CHART_MAX_UNITS, explicitMax);
			const editionCap = editionMaxGames(year);
			if (editionCap > 0) return Math.min(CHART_MAX_UNITS, editionCap);
			const explicitApp = parseNonNegative(explicitApps[i]);
			if (explicitApp !== null) return Math.min(CHART_MAX_UNITS, explicitApp);
			return 0;
		});
		const apps = Array.from({ length: years.length }, (_, i) => {
			const v = explicitApps[i];
			const g = explicitGoals[i];
			if (v === null) return null;
			if (v === 0 && g !== null && g > 0) return null;
			return Math.min(v, capacities[i]);
		});
		const knownAppsSum = apps.reduce((sum, v) => sum + (v === null ? 0 : v), 0);
		const appUnknownIdx = apps
			.map((v, i) => (v === null ? i : -1))
			.filter((i) => i >= 0);
		const appRemainder = Math.max(0, (Number(p.apps) || 0) - knownAppsSum);
		const appCapsLeft = appUnknownIdx.map((i) => capacities[i]);
		const appWeights = appUnknownIdx.map((i) => Math.max(1, capacities[i]));
		const appDistributed = allocateWithCaps(
			appRemainder,
			appWeights,
			appCapsLeft,
		);
		appUnknownIdx.forEach((i, j) => {
			apps[i] = appDistributed[j] || 0;
		});
		const goals = Array.from({ length: years.length }, (_, i) => {
			const v = explicitGoals[i];
			if (v === null) return null;
			return v;
		});
		const knownGoalsSum = goals.reduce(
			(sum, v) => sum + (v === null ? 0 : v),
			0,
		);
		const goalUnknownIdx = goals
			.map((v, i) => (v === null ? i : -1))
			.filter((i) => i >= 0);
		const goalRemainder = Math.max(0, (Number(p.goals) || 0) - knownGoalsSum);
		const goalCapsLeft = goalUnknownIdx.map((i) => Math.max(0, apps[i] || 0));
		const goalWeights = goalUnknownIdx.map((i) => Math.max(1, apps[i] || 0));
		const goalDistributed = allocateWithCaps(
			goalRemainder,
			goalWeights,
			goalCapsLeft,
		);
		goalUnknownIdx.forEach((i, j) => {
			goals[i] = goalDistributed[j] || 0;
		});
		return { years, apps, goals, capacities };
	};

	const buildMiniChart = (series, lineColor) => {
		const n = series.years.length;
		if (!n) return "";
		const editions = ALL_WC_EDITIONS;
		const yearToSlot = new Map(editions.map((y, i) => [y, i]));
		const maxUnits = CHART_MAX_UNITS;
		const slots = CHART_SLOTS;
		const width = Math.max(280, slots * 30);
		const totalApps = series.apps.reduce((sum, v) => sum + (Number(v) || 0), 0);
		const totalGoals = series.goals.reduce(
			(sum, v) => sum + (Number(v) || 0),
			0,
		);
		const goalPoints = series.years
			.map((year, i) => {
				const slotIndex = yearToSlot.get(Number(year));
				if (slotIndex === undefined) return null;
				const g = Math.max(0, series.goals[i] || 0);
				const safeGoal = Math.min(g, maxUnits);
				const yPct = (1 - safeGoal / maxUnits) * 100;
				return {
					x: (width / slots) * (slotIndex + 0.5),
					y: (yPct / 100) * 110,
					xPct: ((slotIndex + 0.5) / slots) * 100,
					yPct,
					isZero: g === 0,
				};
			})
			.filter(
				(p) => p !== null && Number.isFinite(p.x) && Number.isFinite(p.y),
			);
		const points = goalPoints
			.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
			.join(" ");
		const gridLines = Array.from({ length: maxUnits - 1 }, (_, i) => {
			const level = i + 1;
			const y = ((1 - level / maxUnits) * 110).toFixed(2);
			return `<line x1="0" y1="${y}" x2="${width}" y2="${y}" class="ap-goal-grid-line"/>`;
		}).join("");
		const dots = goalPoints
			.filter((p) => !p.isZero)
			.map(
				(p) =>
					`<span class="ap-goal-dot" style="--goal-line:${lineColor};left:${p.xPct.toFixed(3)}%;top:${p.yPct.toFixed(3)}%;"></span>`,
			)
			.join("");
		const appsByYear = new Map(
			series.years.map((year, i) => [
				Number(year),
				Math.max(0, Number(series.apps[i]) || 0),
			]),
		);
		const cols = editions
			.map((year, i) => {
				const apps = Math.min(maxUnits, appsByYear.get(year) || 0);
				const cap = editionMaxGames(year) || maxUnits;
				const appDots = Array.from({ length: cap }, (_, j) => {
					const topPct = (1 - (j + 1) / maxUnits) * 100;
					return `<span class="ap-app-dot${j < apps ? " is-played" : " is-cap"}" style="top:${topPct.toFixed(2)}%"></span>`;
				}).join("");
				const isOdd = i % 2 === 1;
				const isKeyYear = (slots - 1 - i) % 2 === 0;
				const label = `'${String(year).slice(2)}`;
				return `<div class="ap-chart-col${isOdd ? " is-odd" : ""}${apps === 0 ? " no-apps" : ""}${isKeyYear ? " is-key-year" : ""}"><div class="ap-app-stack">${appDots}</div><div class="ap-year">${label}</div></div>`;
			})
			.join("");
		return `
			<div class="ap-chart" style="--ap-units:${maxUnits};--ap-cols:${slots}">
				<div class="ap-plot">
					<div class="ap-chart-cols">${cols}</div>
					<svg class="ap-goal-line" viewBox="0 0 ${width} 110" preserveAspectRatio="none" aria-hidden="true">
						${gridLines}
						<polyline class="ap-goal-poly" points="${points}" style="--goal-line:${lineColor};"></polyline>
					</svg>
					<div class="ap-goal-dots" aria-hidden="true">${dots}</div>
				</div>
				<div class="ap-numbers" aria-label="By the numbers">
					<div class="ap-number-row">
						<span class="ap-number-key">Aps</span>
						<span class="ap-number-val">${totalApps}</span>
					</div>
					<div class="ap-number-row">
						<span class="ap-number-key">Gls</span>
						<span class="ap-number-val">${totalGoals}</span>
					</div>
					<div class="ap-number-row">
						<span class="ap-number-key">G/G</span>
						<span class="ap-number-val">${totalApps > 0 ? (totalGoals / totalApps).toFixed(2) : "—"}</span>
					</div>
				</div>
			</div>`;
	};

	const buildNameHtml = (p) => {
		const given =
			p.given && p.given !== "not applicable" ? p.given.trim() : null;
		const family = p.family ? p.family.trim() : null;
		if (given && family) {
			return `<span class="ap-name-given">${given}</span> <strong class="ap-name-family">${family}</strong>`;
		}
		if (family) return `<strong class="ap-name-family">${family}</strong>`;
		return `<strong class="ap-name-family">${p.name}</strong>`;
	};

	const buildAvatar = (p, lineColor) => {
		const initials = (() => {
			const given =
				p.given && p.given !== "not applicable" ? p.given.trim() : null;
			const family = p.family ? p.family.trim() : null;
			if (given && family) return given[0] + family[0];
			const parts = (family || p.name).split(" ").filter(Boolean);
			return parts.length >= 2
				? parts[0][0] + parts[parts.length - 1][0]
				: (parts[0] || "?")[0];
		})();
		if (p.img) {
			if (p.imgFocusY != null && p.imgScale && p.imgScale > 1) {
				// bgY: CSS bg-position % to center the face vertically.
				// Formula: bgY = (focusY * scale - 50) / (scale - 1)
				const bgY = Math.min(
					100,
					Math.max(
						0,
						Math.round((p.imgFocusY * p.imgScale - 50) / (p.imgScale - 1)),
					),
				);
				// bgX: same formula but horizontal. Rendered width = imgAspect * scale.
				// If rendered image is wider than container, we can scroll horizontally.
				const focusX = p.imgFocusX ?? 50;
				const renderedWScale = (p.imgAspect ?? 1) * p.imgScale;
				const bgX =
					renderedWScale > 1
						? Math.min(
								100,
								Math.max(
									0,
									Math.round(
										(focusX * renderedWScale - 50) / (renderedWScale - 1),
									),
								),
							)
						: 50;
				const sizePct = Math.round(p.imgScale * 100);
				const bgStyle = `background:url('${p.img}') ${bgX}% ${bgY}% / auto ${sizePct}% no-repeat`;
				return `<div class="ap-avatar" style="${bgStyle}"><img src="${p.img}" style="display:none" loading="lazy" onerror="this.parentElement.removeAttribute('style');this.parentElement.dataset.noimg='1'"></div>`;
			}
			const focusStyle =
				p.imgFocusY != null
					? ` style="object-position:center ${p.imgFocusY}%"`
					: "";
			return `<div class="ap-avatar"><img class="ap-avatar-img" src="${p.img}" alt="${p.name}" loading="lazy"${focusStyle} onerror="this.parentElement.dataset.noimg='1';this.remove()"></div>`;
		}
		return `<div class="ap-avatar ap-avatar--initials" style="--av-color:${lineColor}">${initials.toUpperCase()}</div>`;
	};

	/**
	 * Render player cards into a container element.
	 * Single source of truth — both the "Players" tab and the "All Players" tab use this.
	 * @param {Array}   list                    enriched player objects
	 * @param {Element} container               DOM element whose innerHTML will be replaced
	 * @param {Object}  [opts]
	 * @param {boolean} [opts.showTeamChip=true] show flag+code badge (set false in single-team view)
	 */
	function renderPlayerCards(list, container, { showTeamChip = true } = {}) {
		if (list.length === 0) {
			container.innerHTML = `<p class="ap-empty">No players found.</p>`;
			return;
		}

		const PAGE_SIZE = 24;
		let rendered = 0;
		if (renderPlayerCards._observer) {
			renderPlayerCards._observer.disconnect();
			renderPlayerCards._observer = null;
		}

		function buildCard(p) {
			const flagCode = getCountryCode(p.abbr);
			const series = buildSeries(p);
			const lineColor = posColors[p.pos] || "#7fb0ff";
			const lastYear = p.years ? Math.max(...p.years) : 0;
			const isActive = lastYear >= 2022;
			const teamKey = p.team || teamParam;
			const champYearsForTeam = TEAM_CHAMPIONSHIP_YEARS[teamKey] || [];
			const playerChampYears = (p.years || [])
				.filter((y) => champYearsForTeam.includes(y))
				.sort((a, b) => a - b);
			const trophyHtml =
				playerChampYears.length > 0
					? `<span class="ap-trophy">${playerChampYears.map((y) => `<img src="WC-Trophy.svg" class="ap-trophy-icon" alt="" />`).join("")}<span class="ap-trophy-years">${playerChampYears.map((y) => `'${String(y).slice(2)}`).join(" ")}</span></span>`
					: "";
			return `
			<div class="ap-card">
				<div class="ap-main">
					<div class="ap-top-row">
						<div class="ap-header">
							${buildAvatar(p, lineColor)}
							<div class="ap-name-block">
								<div class="ap-name">${buildNameHtml(p)}</div>
								<div class="ap-badges-row">
									<span class="ap-pos" style="color:${posColors[p.pos] || "#aaa"};background:${posColors[p.pos] || "#aaa"}18">${p.pos}</span>
									<span class="ap-status ${isActive ? "ap-status--active" : "ap-status--retired"}">${isActive ? "Active" : "Retired"}</span>
									${trophyHtml}
								</div>
							</div>
						</div>
						${showTeamChip ? `<div class="ap-team-chip"><span class="ap-team-code">${p.abbr}</span><span class="fi fi-${flagCode} ap-team-flag"></span></div>` : ""}
					</div>
					${buildMiniChart(series, lineColor)}
				</div>
			</div>`;
		}

		function renderBatch() {
			const batch = list.slice(rendered, rendered + PAGE_SIZE);
			if (!batch.length) return false;
			const sentinel = container.querySelector(".ap-load-sentinel");
			if (sentinel) sentinel.remove();
			container.insertAdjacentHTML("beforeend", batch.map(buildCard).join(""));
			rendered += batch.length;
			if (rendered < list.length) {
				container.insertAdjacentHTML(
					"beforeend",
					'<div class="ap-load-sentinel" aria-hidden="true"></div>',
				);
				return true;
			}
			return false;
		}

		container.innerHTML = "";
		const hasMore = renderBatch();
		if (hasMore) {
			const sentinel = container.querySelector(".ap-load-sentinel");
			const obs = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting) {
						const more = renderBatch();
						if (!more) {
							obs.disconnect();
							renderPlayerCards._observer = null;
						} else {
							obs.unobserve(entries[0].target);
							const next = container.querySelector(".ap-load-sentinel");
							if (next) obs.observe(next);
						}
					}
				},
				{ rootMargin: "400px" },
			);
			obs.observe(sentinel);
			renderPlayerCards._observer = obs;
		}
	}
	// All shared card utilities are now initialized — safe to activate non-timeline tabs
	if (VALID_TABS.has(initialTabParam) && initialTabParam !== "timeline") {
		activateTab(initialTabParam, false);
	}

	function renderPlayersChart(teamPlayers) {
		let currentPos = "all";
		let currentSort = "goals";
		// Ensure each player has the current team's abbr (it may already be set in players.json)
		// Add live 2026 totals so sort reflects current-tournament activity
		const enriched = teamPlayers.map((p) => {
			const live = p.byYear?.["2026"];
			return {
				abbr: team.abbr,
				...p,
				goals: (p.goals || 0) + (live?.goals || 0),
				apps: (p.apps || 0) + (live?.apps || 0),
			};
		});
		const container = document.getElementById("players-chart");

		function getFiltered() {
			return enriched
				.filter((p) => (p.apps || 0) >= 1)
				.filter((p) => currentPos === "all" || p.pos === currentPos)
				.sort((a, b) => {
					if (currentSort === "name") return a.name.localeCompare(b.name);
					const primary = (b[currentSort] || 0) - (a[currentSort] || 0);
					if (primary !== 0) return primary;
					const secondary =
						currentSort === "goals"
							? (b.apps || 0) - (a.apps || 0)
							: (b.goals || 0) - (a.goals || 0);
					if (secondary !== 0) return secondary;
					return a.name.localeCompare(b.name);
				});
		}

		function draw() {
			if (renderPlayerCards._observer) {
				renderPlayerCards._observer.disconnect();
				renderPlayerCards._observer = null;
			}
			renderPlayerCards(getFiltered(), container, { showTeamChip: false });
		}

		draw();

		// Position filter controls
		document.querySelectorAll(".pos-filter").forEach((btn) => {
			btn.addEventListener("click", () => {
				document
					.querySelectorAll(".pos-filter")
					.forEach((b) => b.classList.remove("active"));
				btn.classList.add("active");
				currentPos = btn.dataset.pos;
				draw();
			});
		});

		// Sort controls
		document.querySelectorAll(".sort-btn").forEach((btn) => {
			btn.addEventListener("click", () => {
				document
					.querySelectorAll(".sort-btn")
					.forEach((b) => b.classList.remove("active"));
				btn.classList.add("active");
				currentSort = btn.dataset.sort;
				draw();
			});
		});
	}

	function initH2H() {
		// Pre-select the current team's label + flag
		const flagA = getCountryCode(team.abbr);
		document.getElementById("h2h-label-a").textContent = team.name;
		document.getElementById("h2h-flag-a").innerHTML =
			`<span class="fi fi-${flagA}"></span>`;

		// Remove current team from opponent dropdown
		const sel = document.getElementById("h2h-select");
		// Populate from teamsIndex, exclude current team
		sel.innerHTML = '<option value="">Pick opponent…</option>';
		teamsIndex
			.filter((t) => t.key !== teamParam)
			.sort((a, b) => a.name.localeCompare(b.name))
			.forEach((t) => {
				const opt = document.createElement("option");
				opt.value = t.key;
				opt.textContent = t.name;
				sel.appendChild(opt);
			});

		sel.style.width = "";
		const flagBEl = document.getElementById("h2h-flag-b");
		sel.addEventListener("change", async () => {
			const oppKey = sel.value;
			if (!oppKey) {
				flagBEl.innerHTML = "";
				return;
			}
			const oppMeta = teamFiles[oppKey];
			flagBEl.innerHTML = `<span class="fi fi-${getCountryCode(oppMeta.abbr)}"></span>`;
			const oppTournaments = await d3.json(`data/${oppKey}.json`);
			renderH2H(
				team,
				oppMeta,
				oppTournaments,
				team.tournaments,
				oppTournaments,
			);
		});
	}

	function renderH2H(teamA, metaB, tournsB, detailedA, detailedB) {
		const container = document.getElementById("h2h-content");
		container.innerHTML = "";

		const confColors = {
			CONMEBOL: "#a7f3d0",
			UEFA: "#93c5fd",
			AFC: "#fde68a",
			CAF: "#fca5a5",
			CONCACAF: "#d9f99d",
			OFC: "#e9d5ff",
		};
		const colorA = confColors[teamA.conf] || "#aaa";
		const colorB = confColors[metaB.conf] || "#aaa";

		const PARTICIPATED = new Set([
			"GS",
			"2GS",
			"R16",
			"QF",
			"SF",
			"3P",
			"4P",
			"RU",
			"W",
		]);
		const stageRank = {
			GS: 1,
			"2GS": 2,
			R16: 3,
			QF: 4,
			SF: 5,
			"3P": 6,
			"4P": 6,
			RU: 7,
			W: 8,
		};

		const yearsA = new Map(teamA.tournaments.map((t) => [t.year, t.stage]));
		const yearsB = new Map(tournsB.map((t) => [t.year, t.stage]));

		const h2hCodeAliases = {
			germany: ["GER", "FRG"],
			"east-germany": ["DDR"],
			russia: ["RUS", "URS"],
			serbia: ["SRB", "YUG", "SCG"],
			"czech-republic": ["CZE", "TCH"],
			slovakia: ["SVK", "TCH"],
			netherlands: ["NED", "HOL"],
			iran: ["IRN", "IRI"],
		};
		const h2hNameAliases = {
			"united-states": ["usa", "united states", "u.s.a.", "u.s."],
			"south-korea": ["south korea", "korea republic", "korea rep"],
			"north-korea": ["north korea", "korea dpr", "dpr korea"],
			"saudi-arabia": ["saudi arabia"],
			"czech-republic": ["czech republic", "czechoslovakia"],
			slovakia: ["slovakia", "czechoslovakia"],
			russia: ["russia", "soviet union"],
			serbia: ["serbia", "yugoslavia", "serbia and montenegro"],
			"east-germany": ["east germany"],
		};

		const norm = (v) =>
			String(v || "")
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, " ")
				.trim();
		const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

		const codesA = new Set(
			[teamA.abbr, ...(h2hCodeAliases[teamParam] || [])]
				.filter(Boolean)
				.map((c) => String(c).toUpperCase()),
		);
		const codesB = new Set(
			[metaB.abbr, ...(h2hCodeAliases[metaB.key] || [])]
				.filter(Boolean)
				.map((c) => String(c).toUpperCase()),
		);
		const namesA = new Set([
			norm(teamA.name),
			...(h2hNameAliases[teamParam] || []).map(norm),
		]);
		const namesB = new Set([
			norm(metaB.name),
			...(h2hNameAliases[metaB.key] || []).map(norm),
		]);

		const hasOpponent = (text, opponentCodes, opponentNames) => {
			const upper = String(text || "").toUpperCase();
			const normalized = norm(text);
			const codeMatch = [...opponentCodes].some((code) =>
				new RegExp(`\\b${escapeRegex(code)}\\b`).test(upper),
			);
			if (codeMatch) return true;
			return [...opponentNames].some(
				(name) =>
					name && new RegExp(`\\b${escapeRegex(name)}\\b`).test(normalized),
			);
		};

		const collectMeetings = (
			detailed,
			opponentCodes,
			opponentNames,
			teamName,
		) => {
			if (!Array.isArray(detailed)) return [];
			const out = [];
			detailed.forEach((entry) => {
				if (!entry) return;

				if (Array.isArray(entry.matches) && entry.matches.length) {
					entry.matches.forEach((m) => {
						if (!m) return;
						const byCode = m.opponent
							? opponentCodes.has(String(m.opponent).toUpperCase())
							: false;
						const byName = m.opponent_full
							? opponentNames.has(norm(m.opponent_full))
							: false;
						if (!byCode && !byName) return;

						out.push({
							year: entry.year,
							stage: m.stage || entry.stage,
							score: m.score || null,
							teamName: teamName,
							opponentName: m.opponent_full || m.opponent || "",
							date: m.date || "",
						});
					});
					return;
				}

				if (!entry.result || typeof entry.result !== "string") return;
				if (!hasOpponent(entry.result, opponentCodes, opponentNames)) return;

				out.push({
					year: entry.year,
					stage: entry.stage,
					score: null,
					teamName: teamName,
					opponentName: "",
					result: entry.result,
					date: "",
				});
			});
			return out;
		};

		const fromA = collectMeetings(detailedA, codesB, namesB, teamA.name);
		const fromB = collectMeetings(detailedB, codesA, namesA, metaB.name);

		const normStageKey = (s) =>
			s === "W" || s === "RU" || s === "F" || s === "FINAL"
				? "FINAL"
				: s === "3P" || s === "4P"
					? "THIRD"
					: s || "";
		const meetings = [...fromA, ...fromB]
			.reduce((acc, m) => {
				// Deduplicate: W and RU are the same final; 3P and 4P are the same third-place game
				const k = `${m.year}|${normStageKey(m.stage)}`;
				if (!acc.some((x) => `${x.year}|${normStageKey(x.stage)}` === k)) {
					acc.push(m);
				}
				return acc;
			}, [])
			.sort(
				(a, b) =>
					b.year - a.year || String(b.date).localeCompare(String(a.date)),
			);

		// Common years: both teams participated
		const commonYears = [...yearsA.keys()]
			.filter(
				(y) =>
					yearsB.has(y) &&
					PARTICIPATED.has(yearsA.get(y)) &&
					PARTICIPATED.has(yearsB.get(y)),
			)
			.sort((a, b) => b - a);

		// ── Meetings vs each other (first) ───────────────────────────────────
		const meetingsEl = document.createElement("div");
		meetingsEl.className = "h2h-common h2h-meetings";
		meetingsEl.innerHTML = `<h3 class="h2h-common-title">Matches vs Each Other <span class="h2h-common-count">${meetings.length}</span></h3>`;

		if (meetings.length === 0) {
			meetingsEl.innerHTML += `<p class="ap-empty">No direct head-to-head match details are available for this pair in the current dataset.</p>`;
		} else {
			const grid = document.createElement("div");
			grid.className = "h2h-common-grid";
			meetings.forEach((m) => {
				const scoreDisplay =
					m.score && m.opponentName
						? `<span class="h2h-match-team">${m.teamName}</span><span class="h2h-match-score">${m.score}</span><span class="h2h-match-team">${m.opponentName}</span>`
						: `<span class="h2h-match-team h2h-match-team--full">${m.result || m.opponentName}</span>`;
				grid.innerHTML += `
					<div class="h2h-common-card">
						<div class="h2h-common-stages">
							<span class="h2h-common-year">${m.year}</span>
							<span class="h2h-common-sep">|</span>
							<span class="h2h-common-stage">${stageLabel(m.stage)}</span>
						</div>
						<div class="h2h-match-result">${scoreDisplay}</div>
					</div>`;
			});
			meetingsEl.appendChild(grid);
		}
		container.appendChild(meetingsEl);

		// ── Common World Cups (second) ────────────────────────────────────────
		const commonEl = document.createElement("div");
		commonEl.className = "h2h-common";
		commonEl.innerHTML = `<h3 class="h2h-common-title">Common World Cups <span class="h2h-common-count">${commonYears.length}</span></h3>`;

		if (commonYears.length === 0) {
			commonEl.innerHTML += `<p class="ap-empty">These teams have never appeared at the same World Cup.</p>`;
		} else {
			const grid = document.createElement("div");
			grid.className = "h2h-common-grid";
			commonYears.forEach((year) => {
				const stA = yearsA.get(year);
				const stB = yearsB.get(year);
				const aAdvanced = (stageRank[stA] || 0) > (stageRank[stB] || 0);
				const bAdvanced = (stageRank[stB] || 0) > (stageRank[stA] || 0);
				grid.innerHTML += `
					<div class="h2h-common-card">
						<div class="h2h-common-stages h2h-common-stages--centered">
							<span class="h2h-common-stage${aAdvanced ? " h2h-common-stage--better" : ""}" style="${aAdvanced ? `color:${colorA}` : ""}">${stageLabel(stA)}</span>
							<span class="h2h-common-year">${year}</span>
							<span class="h2h-common-stage${bAdvanced ? " h2h-common-stage--better" : ""}" style="${bAdvanced ? `color:${colorB}` : ""}">${stageLabel(stB)}</span>
						</div>
					</div>`;
			});
			commonEl.appendChild(grid);
		}
		container.appendChild(commonEl);

		// ── General side-by-side stat rows (third) ────────────────────────────
		const stats = [
			{ label: "Titles", a: teamA.titles, b: metaB.titles },
			{ label: "Appearances", a: teamA.appearances, b: metaB.appearances },
			{ label: "Matches played", a: teamA.gp, b: metaB.gp },
			{ label: "Wins", a: teamA.w, b: metaB.w },
			{ label: "Draws", a: teamA.d, b: metaB.d },
			{ label: "Losses", a: teamA.l, b: metaB.l },
			{ label: "Goals scored", a: teamA.gs, b: metaB.gs },
			{ label: "Goals against", a: teamA.ga, b: metaB.ga },
			{ label: "Win %", a: teamA.winPct + "%", b: metaB.winPct + "%" },
		];

		const statsEl = document.createElement("div");
		statsEl.className = "h2h-stats";
		stats.forEach(({ label, a, b }) => {
			const numA = parseFloat(a);
			const numB = parseFloat(b);
			const aWins = !isNaN(numA) && !isNaN(numB) && numA > numB;
			const bWins = !isNaN(numA) && !isNaN(numB) && numB > numA;
			// For goals against, lower is better
			const gaLabel = label === "Goals against";
			const aHighlight = gaLabel ? bWins : aWins;
			const bHighlight = gaLabel ? aWins : bWins;
			statsEl.innerHTML += `
				<div class="h2h-stat-row">
					<span class="h2h-stat-val${aHighlight ? " h2h-stat-leader" : ""}" style="${aHighlight ? `color:${colorA}` : ""}">${a}</span>
					<span class="h2h-stat-label">${label}</span>
					<span class="h2h-stat-val${bHighlight ? " h2h-stat-leader" : ""}" style="${bHighlight ? `color:${colorB}` : ""}">${b}</span>
				</div>`;
		});
		statsEl.insertAdjacentHTML(
			"afterbegin",
			`<h3 class="h2h-common-title">General Team Info</h3>`,
		);
		container.appendChild(statsEl);
	}

	async function renderAllPlayersTab(playersData) {
		const confColors = {
			CONMEBOL: "#a7f3d0",
			UEFA: "#93c5fd",
			AFC: "#fde68a",
			CAF: "#fca5a5",
			CONCACAF: "#d9f99d",
			OFC: "#e9d5ff",
		};
		const teamMeta = Object.fromEntries(
			teamsIndex.map((t) => [
				t.key,
				{ label: t.name, abbr: t.abbr, color: confColors[t.conf] || "#aaa" },
			]),
		);
		const allPlayers = Object.entries(playersData).flatMap(([key, arr]) =>
			arr.map((p) => {
				const live = p.byYear?.["2026"];
				return {
					...p,
					team: key,
					...teamMeta[key],
					goals: (p.goals || 0) + (live?.goals || 0),
					apps: (p.apps || 0) + (live?.apps || 0),
				};
			}),
		);

		const container = document.getElementById("all-players-list");

		let currentPos = "all";
		let currentSort = "goals";
		let query = "";

		function getFiltered() {
			return allPlayers
				.filter((p) => (p.apps || 0) >= 1)
				.filter((p) => currentPos === "all" || p.pos === currentPos)
				.filter((p) => {
					if (!query) return true;
					const q = query.toLowerCase();
					return (
						p.name.toLowerCase().includes(q) ||
						p.label.toLowerCase().includes(q)
					);
				})
				.sort((a, b) => {
					if (currentSort === "name") return a.name.localeCompare(b.name);
					const primary = (b[currentSort] || 0) - (a[currentSort] || 0);
					if (primary !== 0) return primary;
					const secondary =
						currentSort === "goals"
							? (b.apps || 0) - (a.apps || 0)
							: (b.goals || 0) - (a.goals || 0);
					if (secondary !== 0) return secondary;
					return a.name.localeCompare(b.name);
				});
		}

		function draw() {
			if (renderPlayerCards._observer) {
				renderPlayerCards._observer.disconnect();
				renderPlayerCards._observer = null;
			}
			const filtered = getFiltered();
			container.innerHTML = "";
			renderPlayerCards(filtered, container, { showTeamChip: true });
		}

		draw();

		// Search
		document
			.getElementById("all-players-search")
			.addEventListener("input", (e) => {
				query = e.target.value.trim();
				draw();
			});

		// Position filter
		document.querySelectorAll(".ap-filter").forEach((btn) => {
			btn.addEventListener("click", () => {
				document
					.querySelectorAll(".ap-filter")
					.forEach((b) => b.classList.remove("active"));
				btn.classList.add("active");
				currentPos = btn.dataset.apPos;
				draw();
			});
		});

		// Sort
		document.querySelectorAll(".ap-sort").forEach((btn) => {
			btn.addEventListener("click", () => {
				document
					.querySelectorAll(".ap-sort")
					.forEach((b) => b.classList.remove("active"));
				btn.classList.add("active");
				currentSort = btn.dataset.apSort;
				draw();
			});
		});
	}

	// ── Compare Tab ──────────────────────────────────────────────────────────
	async function renderCompareTab(currentKey) {
		const container = document.getElementById("compare-container");
		if (!container) return;
		container.innerHTML = `<p class="cmp-loading">Loading…</p>`;

		let values;
		try {
			const res = await fetch("wc2026-values.json");
			values = await res.json();
		} catch (e) {
			container.innerHTML = `<p class="cmp-error">Failed to load comparison data.</p>`;
			return;
		}

		const maxVal = d3.max(values, (d) => d.marketValue);
		const maxSal = d3.max(values, (d) => d.salaryBudget);
		const maxAge = d3.max(values, (d) => d.avgAge);
		const minVal = d3.min(values, (d) => d.marketValue);
		const minSal = d3.min(values, (d) => d.salaryBudget);
		const minAge = d3.min(values, (d) => d.avgAge);
		const avgVal = d3.mean(values, (d) => d.marketValue);
		const avgSal = d3.mean(values, (d) => d.salaryBudget);
		const avgAge = d3.mean(values, (d) => d.avgAge);
		const minValEntry = values.reduce((a, b) =>
			a.marketValue < b.marketValue ? a : b,
		);
		const maxValEntry = values.reduce((a, b) =>
			a.marketValue > b.marketValue ? a : b,
		);
		const minSalEntry = values.reduce((a, b) =>
			a.salaryBudget < b.salaryBudget ? a : b,
		);
		const maxSalEntry = values.reduce((a, b) =>
			a.salaryBudget > b.salaryBudget ? a : b,
		);

		const metricColor = {
			marketValue: "#34d399",
			salaryBudget: "#f59e0b",
			avgAge: "#60a5fa",
		};

		let activeMetric = "marketValue";
		let sortDir = "desc"; // "desc" = high→low (default), "asc" = low→high
		const selectedComparable = values.some((d) => d.key === currentKey);
		const selectedTeamName = teamFiles[currentKey]?.name || "This team";

		function inlineValuePair(mv, sal) {
			const pctMv = +((mv / Math.max(1, maxVal)) * 100).toFixed(1);
			const pctSal = +((sal / Math.max(1, maxSal)) * 100).toFixed(1);
			const mvBar = `<div class="cmp-inline-line"><div class="cmp-inline-line-base"></div><div class="cmp-inline-line-fill" style="width:${pctMv}%;background:${metricColor.marketValue}"></div></div>`;
			const salBar = `<div class="cmp-inline-line"><div class="cmp-inline-line-base"></div><div class="cmp-inline-line-fill" style="width:${pctSal}%;background:${metricColor.salaryBudget}"></div></div>`;
			return `<div class="cmp-row-vpair">
				<div class="cmp-row-vbar">
					<span class="cmp-row-vbar-num">${mv.toLocaleString()}<span class="cmp-row-vbar-u"> M€</span></span>
					${mvBar}
				</div>
				<div class="cmp-row-vbar">
					<span class="cmp-row-vbar-num">${sal.toLocaleString()}<span class="cmp-row-vbar-u"> M€</span></span>
					${salBar}
				</div>
			</div>`;
		}

		// ── Age gauge helpers ──────────────────────────────────────────────────
		const DONUT_COLOR = "#60a5fa";

		function ageGaugeSvg(avgAge, cx, cy, r, sw, numFontClass, subFontClass) {
			const SA = 135,
				SWEEP = 270;
			const AGE_MIN = 18,
				AGE_MAX = 40;
			const agePct = Math.max(
				0.02,
				Math.min(0.98, (avgAge - AGE_MIN) / (AGE_MAX - AGE_MIN)),
			);
			const toRad = (deg) => (deg * Math.PI) / 180;
			const pt = (deg) => ({
				x: +(cx + r * Math.cos(toRad(deg))).toFixed(3),
				y: +(cy + r * Math.sin(toRad(deg))).toFixed(3),
			});
			const markerAngle = SA + agePct * SWEEP;
			const bgStart = pt(SA),
				bgEnd = pt(SA + SWEEP);
			const fillEnd = pt(markerAngle);
			const bgLarge = SWEEP > 180 ? 1 : 0;
			const fillLarge = agePct * SWEEP > 180 ? 1 : 0;
			return [
				`<path d="M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${bgLarge} 1 ${bgEnd.x} ${bgEnd.y}" fill="none" stroke="${DONUT_COLOR}" stroke-width="${sw}" stroke-linecap="round" opacity="0.18" vector-effect="non-scaling-stroke"/>`,
				`<path d="M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${fillLarge} 1 ${fillEnd.x} ${fillEnd.y}" fill="none" stroke="${DONUT_COLOR}" stroke-width="${sw}" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`,
				`<line x1="${bgStart.x}" y1="${bgStart.y}" x2="${bgEnd.x}" y2="${bgEnd.y}" stroke="rgba(255,255,255,0.12)" stroke-width="0.5" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/>`,
			].join("");
		}

		function inlineAgeDonut(d) {
			const CX = 20,
				CY = 20,
				R = 14,
				SW = 3;
			const inner = ageGaugeSvg(d.avgAge, CX, CY, R, SW);
			return `<div class="cmp-row-age-donut"><svg viewBox="0 4 40 28" class="cmp-row-age-svg" aria-label="Age ${d.avgAge}">${inner}<text x="${CX}" y="${CY + 3}" text-anchor="middle" font-weight="700" fill="#fff" class="cmp-donut-num">${d.avgAge}</text></svg></div>`;
		}

		function detailPanelMarkup(d, ranked, extraClass = "") {
			const ageRank = ranked.filter((v) => v.avgAge < d.avgAge).length + 1;
			const minAgeEntry = ranked.reduce((a, b) =>
				a.avgAge <= b.avgAge ? a : b,
			);
			const maxAgeEntry = ranked.reduce((a, b) =>
				a.avgAge >= b.avgAge ? a : b,
			);

			// ── Age gauge SVG ─────────────────────────────────────────────────────
			const CX = 60,
				CY = 60,
				R = 44,
				SW = 4;
			const inner = ageGaugeSvg(d.avgAge, CX, CY, R, SW);
			const ageSvg = `
				<div class="cmp-age-donut">
					<svg viewBox="0 0 120 120" class="cmp-age-donut-svg" aria-label="Avg age ${d.avgAge}">
						${inner}
						<text x="15" y="108" text-anchor="middle" fill="rgba(255,255,255,0.35)">Young</text>
						<text x="105" y="108" text-anchor="middle" fill="rgba(255,255,255,0.35)">Old</text>
						<text x="${CX}" y="${CY + 5}" text-anchor="middle" font-weight="700" fill="#fff" class="cmp-donut-num">${d.avgAge}</text>
						<text x="${CX}" y="${CY + 17}" text-anchor="middle" fill="rgba(255,255,255,0.35)" letter-spacing="0.6" class="cmp-donut-sub">YRS AVG</text>
					</svg>
					<div class="cmp-age-donut-rank">#${ageRank} youngest</div>
				</div>`;

			// ── Range chart helper ──────────────────────────────────────────────
			function rangeChart(val, metricKey, label, minEntry, maxEntry, color) {
				const maxV = maxEntry[metricKey];
				const pct = +((val / Math.max(1, maxV)) * 100).toFixed(1);
				return `
					<div class="cmp-range-chart">
						<div class="cmp-range-chart-label">${label}</div>
						<div class="cmp-range-chart-total">${val.toLocaleString()}<span class="cmp-range-chart-unit"> M€</span></div>
						<div class="cmp-range-track-outer">
							<div class="cmp-range-track-bg"></div>
							<div class="cmp-range-track-fill" style="width:${pct}%;background:${color}"></div>
						</div>
						<div class="cmp-range-extremes">
							<span class="cmp-range-extreme">0M</span>
							<span class="cmp-range-extreme cmp-range-extreme--right">${maxV}M <span class="cmp-range-extreme-team">${maxEntry.abbr}</span></span>
						</div>
					</div>`;
			}

			const mvChart = rangeChart(
				d.marketValue,
				"marketValue",
				"Market Value",
				minValEntry,
				maxValEntry,
				metricColor.marketValue,
			);
			const salChart = rangeChart(
				d.salaryBudget,
				"salaryBudget",
				"Wage Bill",
				minSalEntry,
				maxSalEntry,
				metricColor.salaryBudget,
			);

			const extremes = [
				{
					label: "Youngest Squad",
					team: minAgeEntry.name,
					sub: `${minAgeEntry.avgAge} yrs avg`,
				},
				{
					label: "Oldest Squad",
					team: maxAgeEntry.name,
					sub: `${maxAgeEntry.avgAge} yrs avg`,
				},
				{
					label: "Most Valuable",
					team: maxValEntry.name,
					sub: `${maxValEntry.marketValue.toLocaleString()}M€`,
				},
				{
					label: "Least Valuable",
					team: minValEntry.name,
					sub: `${minValEntry.marketValue.toLocaleString()}M€`,
				},
				{
					label: "Best Paid",
					team: maxSalEntry.name,
					sub: `${maxSalEntry.salaryBudget.toLocaleString()}M€`,
				},
				{
					label: "Worst Paid",
					team: minSalEntry.name,
					sub: `${minSalEntry.salaryBudget.toLocaleString()}M€`,
				},
			]
				.map(
					({ label, team, sub }) => `
				<div class="cmp-stat-extreme-card">
					<span class="cmp-stat-extreme-label">${label}</span>
					<span class="cmp-stat-extreme-team">${team}</span>
					<span class="cmp-stat-extreme-sub">${sub}</span>
				</div>`,
				)
				.join("");

			return `
				<div class="cmp-expand-panel ${extraClass}">
					<div class="cmp-expand-charts">
						${ageSvg}
						<div class="cmp-expand-money-charts">
							${mvChart}
							${salChart}
						</div>
					</div>
					<div class="cmp-stat-extremes">${extremes}
					</div>
				</div>`;
		}

		function buildRow(d, ranked) {
			const isCurrent = d.key === currentKey;
			const countryCode = getCountryCode(d.abbr);
			const row = document.createElement("div");
			row.className = `cmp-bar-row${isCurrent ? " cmp-bar-row--current" : ""}`;
			row.dataset.key = d.key;
			row.innerHTML = `
				<div class="cmp-bar-main">
					<div class="cmp-bar-team cmp-sticky-col cmp-sticky-col--team" title="${d.name}">
						<span class="fi fi-${countryCode} cmp-bar-flag" aria-hidden="true"></span>
						<span class="cmp-bar-abbr">${d.abbr}</span>
					</div>
					${inlineValuePair(d.marketValue, d.salaryBudget)}
					${inlineAgeDonut(d)}
				</div>
			`;
			return row;
		}

		function render() {
			if (!selectedComparable) {
				container.innerHTML = `<div class="cmp-unavailable"><strong>${selectedTeamName}</strong> is not part of the current WC2026 comparison set, so it cannot be compared in this tab. Pick a qualified team from the selector to use Compare.</div>`;
				return;
			}

			const ranked = [...values]
				.sort((a, b) => {
					const valA = a[activeMetric];
					const valB = b[activeMetric];
					return sortDir === "asc" ? valA - valB : valB - valA;
				})
				.map((d, i) => ({ ...d, rank: i + 1 }));

			const teamEntry = ranked.find((d) => d.key === currentKey);
			const rank = selectedComparable && teamEntry ? teamEntry.rank : "N/A";

			const dirIcon = (metric) =>
				activeMetric === metric ? (sortDir === "asc" ? " ↑" : " ↓") : "";

			container.innerHTML = `
				<div class="cmp-header">
					<div class="pos-filters">
						<button class="cmp-metric-btn${activeMetric === "marketValue" ? " active" : ""}" data-metric="marketValue">Market Value${dirIcon("marketValue")}</button>
						<button class="cmp-metric-btn${activeMetric === "salaryBudget" ? " active" : ""}" data-metric="salaryBudget">Wage Bill${dirIcon("salaryBudget")}</button>
						<button class="cmp-metric-btn${activeMetric === "avgAge" ? " active" : ""}" data-metric="avgAge">Avg Age${dirIcon("avgAge")}</button>
					</div>
					<span class="cmp-rank-badge">#${rank} of ${values.length}</span>
				</div>
				<div class="cmp-table-scroll">
					<div class="cmp-table">
						<div class="cmp-col-headers">
							<div class="cmp-col-header-team cmp-sticky-col cmp-sticky-col--team">CTY</div>
							<div class="cmp-col-header cmp-col-header--pair">
								<span class="cmp-col-header-sub${activeMetric === "marketValue" ? " cmp-col-header--active" : ""}">Market Value</span>
								<span class="cmp-col-header-sub${activeMetric === "salaryBudget" ? " cmp-col-header--active" : ""}">Wage</span>
							</div>
							<div class="cmp-col-header${activeMetric === "avgAge" ? " cmp-col-header--active" : ""}">Avg Age</div>
						</div>
						<div class="cmp-chart-wrap">
							<div class="cmp-bars" id="cmp-bars"></div>
						</div>
					</div>
				</div>
				<p class="cmp-note">Market values estimated from Transfermarkt (June 2026).</p>
			`;

			const barsEl = document.getElementById("cmp-bars");
			ranked.forEach((d) => barsEl.appendChild(buildRow(d, ranked)));

			container.querySelectorAll(".cmp-metric-btn").forEach((btn) => {
				btn.addEventListener("click", () => {
					if (btn.dataset.metric === activeMetric) {
						sortDir = sortDir === "desc" ? "asc" : "desc";
					} else {
						activeMetric = btn.dataset.metric;
						sortDir = "desc";
					}
					render();
				});
			});
		}

		render();
	}
})();
