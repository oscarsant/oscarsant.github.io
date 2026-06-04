(async function () {
	// ── Load all teams from index ────────────────────────────────────────────
	let teams = [];
	try {
		const res = await fetch("teams-index.json");
		teams = await res.json();
	} catch (e) {
		console.error("Failed to load teams-index.json", e);
		return;
	}

	// ── DOM refs ─────────────────────────────────────────────────────────────
	const input = document.getElementById("team-search");
	const listbox = document.getElementById("search-dropdown");
	const btn = document.getElementById("toggle-dropdown");
	const sr = document.getElementById("sr-announce");

	// ── State ─────────────────────────────────────────────────────────────────
	let open = false;
	let active = -1;
	let filtered = [...teams].sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
	let selected = null;
	let selectedKey = null;
	let confFilter = "ALL";

	// ── Confederation chips (Browse All section) ──────────────────────────────
	const CONFS = ["ALL", "UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"];
	const confBar = document.getElementById("conf-filters");
	if (confBar) {
		CONFS.forEach((c) => {
			const chipBtn = document.createElement("button");
			chipBtn.className = "conf-chip" + (c === "ALL" ? " active" : "");
			chipBtn.textContent = c;
			chipBtn.dataset.conf = c;
			chipBtn.addEventListener("click", () => {
				confFilter = c;
				confBar
					.querySelectorAll(".conf-chip")
					.forEach((b) => b.classList.toggle("active", b.dataset.conf === c));
				renderTeamGrid();
			});
			confBar.appendChild(chipBtn);
		});
	}

	// ── Build a single team card ──────────────────────────────────────────────
	const buildTeamCard = (team) => {
		const titlesDisplay = team.titles > 0 ? team.titles : "—";
		const badgeImg = team.badge
			? `<img src="${team.badge}" alt="${team.name} badge" class="team-badge" loading="lazy" onerror="this.style.display='none'">`
			: "";
		return `
      <a href="team-view.html?team=${team.key}" class="team-card-new">
        ${badgeImg}
        <div class="team-card-header">
          <h3>${team.name}</h3>
          <div class="team-meta">${team.gp} matches</div>
        </div>
        <div class="team-stats-row">
          <div class="stat-col">
            <div class="stat-value">${titlesDisplay}</div>
            <div class="stat-label">TITLES</div>
          </div>
          <div class="stat-col">
            <div class="stat-value">${team.appearances}</div>
            <div class="stat-label">APPS</div>
          </div>
          <div class="stat-col">
            <div class="stat-value">${team.winPct}%</div>
            <div class="stat-label">WIN%</div>
          </div>
        </div>
      </a>`;
	};

	// ── Render the Browse All team grid ──────────────────────────────────────
	const renderTeamGrid = () => {
		const grid = document.getElementById("team-grid");
		if (!grid) return;
		const visible = (
			confFilter === "ALL" ? teams : teams.filter((t) => t.conf === confFilter)
		)
			.slice()
			.sort((a, b) => a.name.localeCompare(b.name));
		grid.innerHTML = visible.map(buildTeamCard).join("");
	};

	// ── Render dropdown ──────────────────────────────────────────────────────
	const render = () => {
		listbox.innerHTML = "";

		if (filtered.length === 0) {
			listbox.innerHTML = '<div class="search-no-results">No teams found</div>';
			return;
		}

		filtered.forEach((team, i) => {
			const d = document.createElement("div");
			d.className = "search-result-item";
			d.id = "opt-" + i;
			d.setAttribute("role", "option");
			d.setAttribute("aria-selected", String(selected === team.name));
			if (active === i) d.setAttribute("data-active", "true");

			const countryCode = getCountryCode(team.abbr);
			const trophies = team.titles > 0
				? Array.from({ length: team.titles }, () => '<img src="WC-Trophy.svg" class="trophy-icon" alt="" />').join("")
				: "";
			d.innerHTML = `
        <span class="result-crest fi fi-${countryCode}"></span>
        <span class="result-name">${team.name}</span>
        <span class="result-meta">${trophies}<span class="result-apps">${team.appearances} Apps</span></span>
      `;
			d.onclick = () => choose(i);
			listbox.appendChild(d);
		});
	};

	// ── Dropdown open/close ───────────────────────────────────────────────────
	const setOpen = (v) => {
		open = v;
		input.setAttribute("aria-expanded", String(v));
		listbox.classList.toggle("open", v);
		if (!v) active = -1;
		btn.classList.toggle("open", v);
	};

	// ── Choose a team ─────────────────────────────────────────────────────────
	const choose = (i) => {
		selected = filtered[i].name;
		selectedKey = filtered[i].key;
		input.value = selected;
		sr.textContent = "Selected " + selected;
		setOpen(false);
		window.location.href = `team-view.html?team=${filtered[i].key}`;
	};

	const getExploreTeamKey = () => {
		if (selectedKey) return selectedKey;
		const q = input.value.trim().toLowerCase();
		if (!q) return "brazil";
		const matched = teams.find(
			(t) => t.name.toLowerCase() === q || t.abbr.toLowerCase() === q,
		);
		return matched ? matched.key : "brazil";
	};

	// ── Explore cards route to specific team-view tabs ───────────────────────
	document.querySelectorAll(".viz-card[data-target-tab]").forEach((card) => {
		const tabKey = card.dataset.targetTab;
		card.setAttribute("role", "link");
		card.setAttribute("tabindex", "0");

		const go = () => {
			const teamKey = getExploreTeamKey();
			window.location.href = `team-view.html?team=${teamKey}&tab=${tabKey}`;
		};

		card.addEventListener("click", go);
		card.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				go();
			}
		});
	});

	// ── Filter list (dropdown ordered by performance) ────────────────────────
	const filter = () => {
		const q = input.value.toLowerCase();
		filtered = teams
			.filter((o) => {
				const matchConf = confFilter === "ALL" || o.conf === confFilter;
				const matchText =
					o.name.toLowerCase().includes(q) || o.abbr.toLowerCase().includes(q);
				return matchConf && matchText;
			})
			.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
		active = -1;
		render();
	};

	// ── Event listeners ───────────────────────────────────────────────────────
	input.onfocus = () => {
		filter();
		setOpen(true);
	};

	input.onkeydown = (e) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!open) {
				setOpen(true);
				filter();
			} else {
				active = Math.min(active + 1, filtered.length - 1);
				render();
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (!open) {
				setOpen(true);
				filter();
			} else {
				active = Math.max(active - 1, 0);
				render();
			}
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (active >= 0 && filtered[active]) choose(active);
		} else if (e.key === "Escape") {
			e.preventDefault();
			setOpen(false);
			input.blur();
		}
	};

	btn.onclick = () => {
		setOpen(!open);
		if (open) filter();
	};

	document.onclick = (e) => {
		if (!e.target.closest(".search-container")) {
			setOpen(false);
		}
	};

	input.addEventListener("input", () => {
		selectedKey = null;
		filter();
		setOpen(true);
		const exploreBtn = document.getElementById("explore-button");
		if (exploreBtn && input.value.trim()) {
			const matchedTeam = teams.find(
				(t) =>
					t.name.toLowerCase() === input.value.toLowerCase() ||
					t.abbr.toLowerCase() === input.value.toLowerCase(),
			);
			if (matchedTeam) {
				exploreBtn.textContent = `Explore ${matchedTeam.name} \u2192`;
				exploreBtn.onclick = () =>
					(window.location.href = `team-view.html?team=${matchedTeam.key}`);
			}
		}
	});

	render();
	renderTeamGrid();
})();
