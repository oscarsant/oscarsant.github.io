(async function () {
	// Load team list and their individual data files
	const teamFiles = [
		{
			name: "Brazil",
			file: "data/brazil.json",
			rank: 1,
			points: 114,
			abbr: "BRA",
		},
		{
			name: "Germany",
			file: "data/germany.json",
			rank: 2,
			points: 110,
			abbr: "GER",
		},
		{
			name: "Argentina",
			file: "data/argentina.json",
			rank: 3,
			points: 101,
			abbr: "ARG",
		},
		{
			name: "France",
			file: "data/france.json",
			rank: 4,
			points: 96,
			abbr: "FRA",
		},
		{
			name: "Italy",
			file: "data/italy.json",
			rank: 5,
			points: 93,
			abbr: "ITA",
		},
	];

	// Load all team data
	const data = await Promise.all(
		teamFiles.map(async (teamInfo) => {
			const tournaments = await d3.json(teamInfo.file);
			return {
				team: teamInfo.name,
				rank: teamInfo.rank,
				points: teamInfo.points,
				abbr: teamInfo.abbr,
				tournaments: tournaments,
			};
		}),
	);

	const container = d3.select("#teams-container");
	const tt = d3.select("#tt");

	// Render all teams
	data.forEach((team) => {
		const section = container.append("section").attr("class", "team-section");

		// Header
		const head = section.append("div").attr("class", "head");

		const headLeft = head.append("div");
		headLeft.append("h2").text(team.team);

		const kpi = headLeft
			.append("div")
			.attr("class", "kpi")
			.style("margin-top", "10px");

		kpi
			.append("div")
			.attr("class", "pill")
			.html(`Rank <b>${team.rank ?? "—"}</b>`);
		kpi
			.append("div")
			.attr("class", "pill")
			.html(`Points <b>${team.points ?? "—"}</b>`);
		kpi
			.append("div")
			.attr("class", "pill")
			.html(`Appearances <b>${team.tournaments?.length ?? 0}</b>`);

		head
			.append("div")
			.attr("class", "crest")
			.text(team.abbr || team.team.slice(0, 3).toUpperCase());

		// Chart
		const vizDiv = section.append("div").attr("class", "viz");
		const svg = vizDiv
			.append("svg")
			.attr("height", 600)
			.attr("role", "img")
			.attr("aria-label", `${team.team} World Cup timeline`);

		renderChart(svg, team);
	});

	function renderChart(svg, team) {
		const margin = { top: 40, right: 20, bottom: 20, left: 45 };
		const W = svg.node().clientWidth;
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
		const x = d3.scaleLinear().domain([0.8, 6.2]).range([0, w]);

		// Vertical scale for years
		const y = d3.scaleBand().domain(years).range([0, h]).padding(0.1);

		const g = svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// Add subtle vertical grid lines for stages
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

		// Year labels
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
			.text((d) => d);

		// Add rectangles around year labels for host nations
		g.append("g")
			.selectAll("rect")
			.data(years.filter((year) => tournamentMap.get(year)?.host))
			.join("rect")
			.attr("x", -36)
			.attr("y", (d) => y(d) + y.bandwidth() / 2 - 11)
			.attr("width", 34)
			.attr("height", 22)
			.attr("fill", "none")
			.attr("stroke", "rgba(255,255,255,.6)")
			.attr("stroke-width", 1.5)
			.attr("rx", 3);

		// Add stage labels at the top
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
			.attr("font-weight", 600)
			.text((d) => d);

		// Draw lines and dots for each tournament
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

			// Calculate stageValue dynamically based on year
			// For 1974/1978, 3P and 4P should be at 2GS position (1.5)
			// For other years, 3P and 4P should be at SF position (4)
			let stageValue;
			if (
				(stage === "3P" || stage === "4P") &&
				(year === 1974 || year === 1978)
			) {
				stageValue = 1.5; // Same as 2GS for these years
			} else {
				stageValue = stageValues[stage] || 0;
			}

			// Skip if no participation
			if (stageValue === 0) {
				d3.select(this)
					.append("text")
					.attr("x", 5)
					.attr("y", barHeight / 2)
					.attr("dy", "0.35em")
					.attr("fill", "rgba(255,255,255,.3)")
					.attr("font-size", 9)
					.attr("font-style", "italic")
					.text(tournament.round.substring(0, 15));
				return;
			}

			// Get the stages that existed for this year
			const yearStages = tournamentFormats[year] || [
				"GS",
				"R16",
				"QF",
				"SF",
				"RU",
				"W",
			];

			// Map stages to their visual positions
			const stagePositions = yearStages.map((s) => ({
				code: s,
				value: stageValues[s],
			}));

			// Draw thin connecting line across stages that existed
			const minPos = Math.min(...stagePositions.map((s) => s.value));
			const maxPos = Math.max(...stagePositions.map((s) => s.value));

			d3.select(this)
				.append("line")
				.attr("x1", x(minPos))
				.attr("x2", x(maxPos))
				.attr("y1", barHeight / 2)
				.attr("y2", barHeight / 2)
				.attr("stroke", "rgba(255,255,255,.1)")
				.attr("stroke-width", 1);

			// Draw white line from first stage to last stage achieved
			d3.select(this)
				.append("line")
				.attr("x1", x(minPos))
				.attr("x2", x(stageValue))
				.attr("y1", barHeight / 2)
				.attr("y2", barHeight / 2)
				.attr("stroke", "rgba(255,255,255,.4)")
				.attr("stroke-width", 2);

			// Draw dots only for stages that existed in this tournament
			stagePositions.forEach((stg) => {
				const reached = stageValue >= stg.value;
				const isCurrent = stageValue === stg.value;
				const dotRadius = isCurrent && stg.code === "W" ? 8 : 5;

				// Determine color based on stage
				let dotColor = "rgba(255,255,255,.8)"; // default
				if (reached) {
					if (stg.code === "W") {
						dotColor = "#ffcc00"; // yellow for champion
					} else if (stg.code === "GS" || stg.code === "2GS") {
						dotColor = "#5db6ff"; // blue for group stages
					} else {
						dotColor = "#ff6b6b"; // red for knockout stages
					}
				}

				// Draw dot
				const dot = d3
					.select(this)
					.append("circle")
					.attr("cx", x(stg.value))
					.attr("cy", barHeight / 2)
					.attr("r", dotRadius)
					.attr("fill", reached ? dotColor : "none")
					.attr("stroke", reached ? dotColor : "rgba(255,255,255,.4)")
					.attr("stroke-width", 1.5)
					.style("cursor", "pointer");

				// Add hover interaction to each dot
				dot
					.on("mousemove", function (ev) {
						ev.stopPropagation();

						let tooltipContent = "";

						if (reached) {
							tooltipContent += `<div class="tt-sub">${stageLabel(stg.code)}`;

							if (isCurrent) {
								// This is where they were eliminated or won
								if (stg.code === "W") {
									// Count how many championships up to this year
									const championshipsUpToThisYear = team.tournaments.filter(
										(t) => t.year <= year && t.stage === "W",
									).length;
									const suffix =
										championshipsUpToThisYear === 1
											? "st"
											: championshipsUpToThisYear === 2
												? "nd"
												: championshipsUpToThisYear === 3
													? "rd"
													: "th";
									tooltipContent += ` • ${championshipsUpToThisYear}${suffix} Title`;
									// Don't show tournament.result here - we'll show match details below
								} else if (stg.code === "RU") {
									tooltipContent += ` • Runners-up`;
									// Don't show tournament.result here - we'll show match details below
								} else if (stg.code === "3P") {
									tooltipContent += ` • Won 3rd Place`;
									// Don't show tournament.result here - we'll show match details below
								} else if (stg.code === "4P") {
									tooltipContent += ` • Lost 3rd Place`;
									// Don't show tournament.result here - we'll show match details below
								} else if (stg.code === "GS" || stg.code === "2GS") {
									// For group stage, don't show group record
									tooltipContent += ` • Eliminated`;
								} else {
									// For other knockout stages where they were eliminated (R16, QF, SF)
									tooltipContent += ` • Eliminated`;
									// Don't show tournament.result here - we'll show match details below
								}

								// Add final position if available (only on elimination dot)
								// Don't show position for W, RU, or GS/2GS
								if (
									tournament.position &&
									stg.code !== "W" &&
									stg.code !== "RU" &&
									stg.code !== "GS" &&
									stg.code !== "2GS"
								) {
									const positionSuffix =
										tournament.position === 1
											? "st"
											: tournament.position === 2
												? "nd"
												: tournament.position === 3
													? "rd"
													: "th";
									tooltipContent += `<br><span style="color: rgba(255,255,255,0.5);">${tournament.position}${positionSuffix} overall</span>`;
								}
							} else {
								// They passed this stage - show stage-specific info
								if (stg.code === "GS" || stg.code === "2GS") {
									// Show group stage performance when hovering on GS dot (even if they advanced)
									tooltipContent += ` • Advanced`;
									// Don't show group record when they advanced - only show matches
								} else if (stg.code === "RU") {
									// For Final stage when they won the tournament
									tooltipContent += ` • Won`;
								} else {
									tooltipContent += ` • Advanced`;
								}
							}

							tooltipContent += `</div>`;

							// Add detailed match results if available
							if (tournament.matches && tournament.matches.length > 0) {
								let stageMatches = [];

								// Filter matches based on the stage
								if (stg.code === "W") {
									// Don't show matches for W - the final match is already shown in the F/RU stage
									stageMatches = [];
								} else if (stg.code === "RU") {
									// For Runners-up, only show the FINAL match
									stageMatches = tournament.matches.filter(
										(m) => m.stage === "F",
									);
								} else if (stg.code === "GS") {
									// Only show first group stage matches (not second group stage)
									stageMatches = tournament.matches.filter(
										(m) => m.stage === "GS",
									);
								} else if (stg.code === "2GS") {
									// Only show second group stage matches
									// But also include 3rd place match if their final stage was 3P or 4P
									stageMatches = tournament.matches.filter(
										(m) => m.stage === "2GS",
									);
									// For 1974/1978, if team finished 3P or 4P, also show the 3rd place playoff
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
									// If team finished 3P or 4P, also show the 3rd place playoff
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
										const resultIcon =
											match.result === "W"
												? "✓"
												: match.result === "L"
													? "✗"
													: "−";
										const resultColor =
											match.result === "W"
												? "#4ade80"
												: match.result === "L"
													? "#f87171"
													: "#fbbf24";
										tooltipContent += `<div style="font-size: 11px; margin: 3px 0; color: rgba(255,255,255,0.7);">`;
										tooltipContent += `<span style="color: ${resultColor};">${resultIcon}</span> `;
										tooltipContent += `${match.score} vs ${match.opponent}`;
										if (match.penalties) {
											tooltipContent += ` (${match.penalties} pen)`;
										}
										// Add label for 3rd place playoff matches only
										if (match.stage === "3P") {
											tooltipContent += ` <span style="color: rgba(255,255,255,0.4); font-style: italic;">• 3rd place playoff</span>`;
										}
										tooltipContent += `</div>`;
									});
									tooltipContent += `</div>`;
								}
							}
						} else {
							tooltipContent += `<div class="tt-sub">${stageLabel(
								stg.code,
							)} • Did not reach</div>`;
						}

						tt.style("opacity", 1)
							.style("left", ev.clientX + "px")
							.style("top", ev.clientY + "px")
							.html(tooltipContent);
					})
					.on("mouseleave", function (ev) {
						ev.stopPropagation();
						tt.style("opacity", 0);
					});

				// Add champion star if this is the final stage and they won
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
})();
