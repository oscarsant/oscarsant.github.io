// ─── Shared Utilities ────────────────────────────────────────────────────────
// Loaded before landing.js, team-view.js, and main.js.

// Maps FIFA three-letter abbreviations to ISO 3166-1-alpha-2 codes
// used by the flag-icons library.
const getCountryCode = (abbr) => {
	const countryMap = {
		// CONMEBOL
		ARG: "ar",
		BRA: "br",
		BOL: "bo",
		CHI: "cl",
		COL: "co",
		ECU: "ec",
		PAR: "py",
		PER: "pe",
		URU: "uy",
		VEN: "ve",
		// UEFA
		ALB: "al",
		AND: "ad",
		AUT: "at",
		BEL: "be",
		BIH: "ba",
		BUL: "bg",
		CRO: "hr",
		CYP: "cy",
		CZE: "cz",
		DEN: "dk",
		ENG: "gb-eng",
		EST: "ee",
		FIN: "fi",
		FRA: "fr",
		GEO: "ge",
		GER: "de",
		FRG: "de",
		GRE: "gr",
		HUN: "hu",
		ISL: "is",
		IRL: "ie",
		ITA: "it",
		KOS: "xk",
		LAT: "lv",
		LIE: "li",
		LTU: "lt",
		LUX: "lu",
		MKD: "mk",
		MLT: "mt",
		MDA: "md",
		MNE: "me",
		NED: "nl",
		NIR: "gb-nir",
		NOR: "no",
		POL: "pl",
		POR: "pt",
		ROU: "ro",
		RUS: "ru",
		SCO: "gb-sct",
		SRB: "rs",
		SVK: "sk",
		SVN: "si",
		ESP: "es",
		SWE: "se",
		SUI: "ch",
		TUR: "tr",
		UKR: "ua",
		WAL: "gb-wls",
		// Historical UEFA
		TCH: "cz",
		YUG: "rs",
		URS: "ru",
		DDR: "de",
		SCG: "rs",
		// CONCACAF
		CAN: "ca",
		CRC: "cr",
		CUB: "cu",
		CUR: "cw",
		HAI: "ht",
		HON: "hn",
		JAM: "jm",
		MEX: "mx",
		PAN: "pa",
		SLV: "sv",
		TRI: "tt",
		USA: "us",
		// CAF
		ALG: "dz",
		ANG: "ao",
		CMR: "cm",
		CPV: "cv",
		CIV: "ci",
		COD: "cd",
		EGY: "eg",
		ETH: "et",
		GAB: "ga",
		GHA: "gh",
		GUI: "gn",
		KEN: "ke",
		LIB: "lr",
		MAR: "ma",
		MOZ: "mz",
		NGR: "ng",
		SEN: "sn",
		RSA: "za",
		TOG: "tg",
		TUN: "tn",
		UGA: "ug",
		ZAI: "cd",
		// AFC
		AUS: "au",
		BHR: "bh",
		CHN: "cn",
		IND: "in",
		IDN: "id",
		IRN: "ir",
		IRQ: "iq",
		ISR: "il",
		JOR: "jo",
		JOR: "jo",
		JPN: "jp",
		KOR: "kr",
		KWT: "kw",
		LBN: "lb",
		PRK: "kp",
		QAT: "qa",
		KSA: "sa",
		SYR: "sy",
		THA: "th",
		UAE: "ae",
		UZB: "uz",
		// OFC
		NZL: "nz",
		// Historical AFC/OFC
		EUA: "au", // Australia old code used in some records
		DEI: "id", // Dutch East Indies → Indonesia flag
	};
	return countryMap[abbr] || abbr.toLowerCase();
};

// Human-readable label for each tournament stage code.
const stageLabel = (s) =>
	({
		GS: "Group stage",
		"2GS": "Second group stage",
		R16: "Round of 16",
		QF: "Quarter-finals",
		SF: "Semi-finals",
		"3P": "Third place",
		"4P": "Fourth place",
		RU: "Final",
		W: "Champions",
	})[s] || s;

// SVG path string for a 5-pointed star centred at the origin.
// No D3 dependency — safe to use on pages that don't load D3.
function starPath(r = 7) {
	const a = Math.PI / 5;
	const pts = Array.from({ length: 10 }, (_, i) => {
		const rr = i % 2 ? r * 0.45 : r;
		const ang = -Math.PI / 2 + i * a;
		return [Math.cos(ang) * rr, Math.sin(ang) * rr];
	});
	return "M" + pts.map((p) => p.join(",")).join("L") + "Z";
}

// Stage formats by World Cup year — defines which stages existed.
const TOURNAMENT_FORMATS = {
	1930: ["GS", "SF", "RU", "W"],
	1934: ["R16", "QF", "SF", "RU", "W"],
	1938: ["R16", "QF", "SF", "RU", "W"],
	1950: ["GS", "RU", "W"], // Final round-robin, no knockout final
	1954: ["GS", "QF", "SF", "RU", "W"],
	1958: ["GS", "QF", "SF", "RU", "W"],
	1962: ["GS", "QF", "SF", "RU", "W"],
	1966: ["GS", "QF", "SF", "RU", "W"],
	1970: ["GS", "QF", "SF", "RU", "W"],
	1974: ["GS", "2GS", "RU", "W"], // Two group stages; 3rd place via 2GS playoff
	1978: ["GS", "2GS", "RU", "W"],
	1982: ["GS", "2GS", "SF", "RU", "W"],
	1986: ["GS", "R16", "QF", "SF", "RU", "W"],
	1990: ["GS", "R16", "QF", "SF", "RU", "W"],
	1994: ["GS", "R16", "QF", "SF", "RU", "W"],
	1998: ["GS", "R16", "QF", "SF", "RU", "W"],
	2002: ["GS", "R16", "QF", "SF", "RU", "W"],
	2006: ["GS", "R16", "QF", "SF", "RU", "W"],
	2010: ["GS", "R16", "QF", "SF", "RU", "W"],
	2014: ["GS", "R16", "QF", "SF", "RU", "W"],
	2018: ["GS", "R16", "QF", "SF", "RU", "W"],
	2022: ["GS", "R16", "QF", "SF", "RU", "W"],
};

// Maps each stage code to a numeric x-axis position used by the D3 timeline.
// Stages with value 0 are non-participations and are rendered as text labels.
const STAGE_VALUES = {
	GS: 1,
	R16: 2,
	"2GS": 1.5, // Between GS and R16
	QF: 3,
	"3P": 4,
	"4P": 4,
	SF: 4,
	RU: 5,
	W: 6,
	DNQ: 0,
	DNE: 0,
	WD: 0,
	BAN: 0,
};
