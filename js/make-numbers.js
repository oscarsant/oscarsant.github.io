(function () {
	// ─── Data definitions ────────────────────────────────────────────────────

	const sourceDefaults = {
		ssdi: { label: "SSDI", defaultAmount: 1100, max: 3000, step: 50 },
		ssi: { label: "SSI", defaultAmount: 750, max: 2000, step: 50 },
		employment: {
			label: "Employment",
			defaultAmount: 3500,
			max: 12000,
			step: 100,
		},
		freelance: {
			label: "Freelance / Contract",
			defaultAmount: 1500,
			max: 10000,
			step: 100,
		},
		unemployment: {
			label: "Unemployment",
			defaultAmount: 800,
			max: 3000,
			step: 50,
		},
		pension: { label: "Pension", defaultAmount: 1200, max: 5000, step: 50 },
		rental: {
			label: "Rental income",
			defaultAmount: 1000,
			max: 8000,
			step: 100,
		},
		withdrawal401k: {
			label: "401(k) Withdrawal",
			defaultAmount: 1000,
			max: 10000,
			step: 100,
		},
		withdrawalIra: {
			label: "IRA Withdrawal",
			defaultAmount: 500,
			max: 8000,
			step: 100,
		},
		withdrawalRoth: {
			label: "Roth Withdrawal",
			defaultAmount: 500,
			max: 8000,
			step: 100,
		},
		withdrawalBrokerage: {
			label: "Brokerage Dist.",
			defaultAmount: 500,
			max: 8000,
			step: 100,
		},
		other: { label: "Other", defaultAmount: 500, max: 5000, step: 50 },
	};

	const expenseDefaults = {
		rent: {
			label: "Rent / Mortgage",
			defaultAmount: 1200,
			max: 5000,
			step: 50,
		},
		food: {
			label: "Food & Groceries",
			defaultAmount: 500,
			max: 3000,
			step: 50,
		},
		transport: { label: "Transport", defaultAmount: 300, max: 2000, step: 25 },
		utilities: { label: "Utilities", defaultAmount: 200, max: 1000, step: 25 },
		subscriptions: {
			label: "Subscriptions",
			defaultAmount: 80,
			max: 500,
			step: 10,
		},
		medical: { label: "Medical", defaultAmount: 200, max: 2000, step: 25 },
		childcare: { label: "Childcare", defaultAmount: 800, max: 4000, step: 50 },
		other: { label: "Other", defaultAmount: 200, max: 3000, step: 25 },
	};

	// hasOwed: true → shows Value + Owed sliders and computes equity
	// defaultGrowth → annual % used for per-asset projection (0–25)
	const assetDefaults = {
		k401: {
			label: "401(k)",
			defaultAmount: 25000,
			max: 1000000,
			step: 500,
			hasOwed: false,
			defaultGrowth: 7,
		},
		ira: {
			label: "IRA",
			defaultAmount: 10000,
			max: 500000,
			step: 500,
			hasOwed: false,
			defaultGrowth: 6,
		},
		roth: {
			label: "Roth IRA",
			defaultAmount: 10000,
			max: 500000,
			step: 500,
			hasOwed: false,
			defaultGrowth: 7,
		},
		brokerage: {
			label: "Brokerage",
			defaultAmount: 15000,
			max: 1000000,
			step: 500,
			hasOwed: false,
			defaultGrowth: 7,
		},
		savings: {
			label: "Savings",
			defaultAmount: 5000,
			max: 200000,
			step: 250,
			hasOwed: false,
			defaultGrowth: 2,
		},
		realestate: {
			label: "Real Estate",
			defaultAmount: 300000,
			max: 3000000,
			step: 5000,
			hasOwed: true,
			defaultGrowth: 3,
			defaultOwed: 220000,
			maxOwed: 2000000,
			stepOwed: 5000,
		},
		auto: {
			label: "Vehicle",
			defaultAmount: 25000,
			max: 200000,
			step: 500,
			hasOwed: true,
			defaultGrowth: -5,
			defaultOwed: 15000,
			maxOwed: 150000,
			stepOwed: 500,
		},
		hsa: {
			label: "HSA",
			defaultAmount: 3000,
			max: 100000,
			step: 250,
			hasOwed: false,
			defaultGrowth: 5,
		},
		crypto: {
			label: "Crypto",
			defaultAmount: 2000,
			max: 500000,
			step: 500,
			hasOwed: false,
			defaultGrowth: 15,
		},
		k529: {
			label: "529 Plan",
			defaultAmount: 5000,
			max: 300000,
			step: 500,
			hasOwed: false,
			defaultGrowth: 6,
		},
		emergency: {
			label: "Emergency Fund",
			defaultAmount: 6000,
			max: 100000,
			step: 500,
			hasOwed: false,
			defaultGrowth: 2,
		},
		other: {
			label: "Other",
			defaultAmount: 1000,
			max: 500000,
			step: 500,
			hasOwed: false,
			defaultGrowth: 4,
		},
	};

	// Maps withdrawal source types → the compatible asset type they draw from
	const withdrawalAssetMap = {
		withdrawal401k: "k401",
		withdrawalIra: "ira",
		withdrawalRoth: "roth",
		withdrawalBrokerage: "brokerage",
	};

	const debtDefaults = {
		creditcard: {
			label: "Credit Card",
			defaultAmount: 3000,
			max: 50000,
			step: 100,
		},
		studentloan: {
			label: "Student Loan",
			defaultAmount: 20000,
			max: 200000,
			step: 500,
		},
		carloan: {
			label: "Car Loan",
			defaultAmount: 15000,
			max: 100000,
			step: 500,
		},
		medical: {
			label: "Medical Debt",
			defaultAmount: 2000,
			max: 50000,
			step: 100,
		},
		personalloan: {
			label: "Personal Loan",
			defaultAmount: 5000,
			max: 100000,
			step: 250,
		},
		heloc: { label: "HELOC", defaultAmount: 30000, max: 500000, step: 1000 },
		bnpl: {
			label: "Buy Now Pay Later",
			defaultAmount: 500,
			max: 10000,
			step: 50,
		},
		other: { label: "Other Debt", defaultAmount: 1000, max: 100000, step: 250 },
	};

	// ─── State ───────────────────────────────────────────────────────────────
	// Assets with hasOwed store both `amount` (value) and `owed`
	// Equity = amount - owed; this is what feeds the projection

	const state = {
		sources: [],
		expenses: [],
		assets: [],
		debts: [],
		nextSourceId: 1,
		nextExpenseId: 1,
		nextAssetId: 1,
		nextDebtId: 1,
	};

	var YEARS = 10;

	// ─── Phone DOM refs ──────────────────────────────────────────────────────

	const projectedValueEl = document.getElementById("projectedValue");
	const netWorthHeroValueEl = document.getElementById("netWorthHeroValue");
	const projectionYearsLabelEl = document.getElementById(
		"projectionYearsLabel",
	);
	const totalIncomeValueEl = document.getElementById("totalIncomeValue");
	const expensesDisplayEl = document.getElementById("expensesDisplayValue");
	const freeCashEl = document.getElementById("freeCashValue");
		const projectionBarsEl = document.getElementById("projectionBars");
		const projectionDetailEl = document.getElementById("projectionDetail");
		const yearPickerEl = document.getElementById("yearPicker");

	// ─── Panel DOM refs ──────────────────────────────────────────────────────

	const sourcesList = document.getElementById("sourcesList");
	const expensesList = document.getElementById("expensesList");
	const assetsList = document.getElementById("assetsList");
	const debtList = document.getElementById("debtList");
	const incomePanelTotal = document.getElementById("incomePanelTotal");
	const spendingPanelTotal = document.getElementById("spendingPanelTotal");
	const assetsPanelTotal = document.getElementById("assetsPanelTotal");
	const debtPanelTotal = document.getElementById("debtPanelTotal");

	// ─── Sheet DOM refs ──────────────────────────────────────────────────────

	const incomeSheet = document.getElementById("incomeSheet");
	const incomeSheetBackdrop = document.getElementById("incomeSheetBackdrop");
	const incomeSheetClose = document.getElementById("incomeSheetClose");
	const incomeSheetGrid = document.getElementById("incomeSheetGrid");
	const spendingSheet = document.getElementById("spendingSheet");
	const spendingSheetBackdrop = document.getElementById(
		"spendingSheetBackdrop",
	);
	const spendingSheetClose = document.getElementById("spendingSheetClose");
	const spendingSheetGrid = document.getElementById("spendingSheetGrid");
	const assetsSheet = document.getElementById("assetsSheet");
	const assetsSheetBackdrop = document.getElementById("assetsSheetBackdrop");
	const assetsSheetClose = document.getElementById("assetsSheetClose");
	const assetsSheetGrid = document.getElementById("assetsSheetGrid");
	const debtSheet = document.getElementById("debtSheet");
	const debtSheetBackdrop = document.getElementById("debtSheetBackdrop");
	const debtSheetClose = document.getElementById("debtSheetClose");
	const debtSheetGrid = document.getElementById("debtSheetGrid");
	const openIncomeBtn = document.getElementById("openIncomeSheet");
	const openSpendingBtn = document.getElementById("openSpendingSheet");
	const openAssetsBtn = document.getElementById("openAssetsSheet");
	const openDebtBtn = document.getElementById("openDebtSheet");

	// ─── Formatters ──────────────────────────────────────────────────────────

	function formatCurrency(value) {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			maximumFractionDigits: 0,
		}).format(value);
	}

	function formatCompactCurrency(value) {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			notation: "compact",
			maximumFractionDigits: 1,
		}).format(value);
	}

	// ─── Math ────────────────────────────────────────────────────────────────

	function getAssetEquity(a) {
		// For equity assets: equity = value - owed (floor 0)
		return assetDefaults[a.type].hasOwed
			? Math.max(0, a.amount - (a.owed || 0))
			: a.amount;
	}

	function getTotalIncome() {
		return state.sources.reduce(function (sum, s) {
			return sum + s.amount;
		}, 0);
	}

	function getTotalExpenses() {
		return state.expenses.reduce(function (sum, e) {
			return sum + e.amount;
		}, 0);
	}

	function getTotalAssetEquity() {
		return state.assets.reduce(function (sum, a) {
			return sum + getAssetEquity(a);
		}, 0);
	}

	function getTotalDebt() {
		return state.debts.reduce(function (sum, d) {
			return sum + d.amount;
		}, 0);
	}

	function getNetWorth() {
		return getTotalAssetEquity() - getTotalDebt();
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function projectPortfolio(balance, annualReturn, years) {
		// Pure compound growth
		var months = years * 12;
		var monthlyRate = annualReturn / 12;
		var total = balance;
		for (var m = 0; m < months; m += 1) {
			total = total * (1 + monthlyRate);
		}
		return total;
	}

	// Compound growth minus a fixed monthly withdrawal amount
	function projectPortfolioWithWithdrawals(
		balance,
		annualReturn,
		years,
		monthlyWithdrawal,
	) {
		var months = years * 12;
		var monthlyRate = annualReturn / 12;
		var total = balance;
		for (var m = 0; m < months; m += 1) {
			total = total * (1 + monthlyRate) - monthlyWithdrawal;
			if (total <= 0) {
				return 0;
			}
		}
		return total;
	}

	// Compound growth on value + principal paydown on owed, returning net equity
	function projectEquityAssetWithPaydown(
		asset,
		annualReturn,
		years,
		monthlyPrincipal,
	) {
		var months = years * 12;
		var monthlyRate = annualReturn / 12;
		var value = asset.amount;
		var owed = asset.owed || 0;
		for (var m = 0; m < months; m += 1) {
			value = value * (1 + monthlyRate);
			owed = Math.max(0, owed - monthlyPrincipal);
		}
		return Math.max(0, value - owed);
	}

	// Project each asset; account for withdrawal draws and mortgage paydown
	function projectAllAssets(years) {
		return state.assets.reduce(function (sum, a) {
			var equity = getAssetEquity(a);
			var rate =
				(a.growthRate !== undefined
					? a.growthRate
					: assetDefaults[a.type].defaultGrowth) / 100;
			// Monthly principal from any linked mortgage expense
			var monthlyPrincipal = state.expenses.reduce(function (p, e) {
				if (e.type !== "rent" || e.linkedAssetId !== a.id) {
					return p;
				}
				var interest =
					e.interest !== undefined ? e.interest : Math.round(e.amount * 0.8);
				return p + Math.max(0, e.amount - interest);
			}, 0);
			// Monthly withdrawal from any linked income source
			var monthlyDraw = state.sources.reduce(function (w, s) {
				return s.linkedAssetId === a.id ? w + s.amount : w;
			}, 0);
			var projected;
			if (monthlyPrincipal > 0 && assetDefaults[a.type].hasOwed) {
				// Grow value + pay down owed, then subtract any withdrawal drag
				projected = projectEquityAssetWithPaydown(
					a,
					rate,
					years,
					monthlyPrincipal,
				);
				if (monthlyDraw > 0) {
					projected = Math.max(0, projected - monthlyDraw * years * 12);
				}
			} else if (monthlyDraw > 0) {
				projected = projectPortfolioWithWithdrawals(
					equity,
					rate,
					years,
					monthlyDraw,
				);
			} else {
				projected = projectPortfolio(equity, rate, years);
			}
			return sum + projected;
		}, 0);
	}

	// ─── Scroll lock ─────────────────────────────────────────────────────────

	function _blockScroll(e) {
		e.preventDefault();
	}

	function lockScroll() {
		window.addEventListener("wheel", _blockScroll, { passive: false });
		window.addEventListener("touchmove", _blockScroll, { passive: false });
	}

	function unlockScroll() {
		window.removeEventListener("wheel", _blockScroll);
		window.removeEventListener("touchmove", _blockScroll);
	}

	// ─── Sheet control ───────────────────────────────────────────────────────

	function openSheet(sheet) {
		sheet.classList.add("is-open");
		lockScroll();
	}

	function closeSheet(sheet) {
		sheet.classList.remove("is-open");
		unlockScroll();
		// Reset any visible name prompt inside this sheet
		var prompt = sheet.querySelector(".numbers-sheet__name-prompt");
		var input = sheet.querySelector(".numbers-sheet__name-input");
		if (prompt) {
			prompt.hidden = true;
		}
		if (input) {
			input.value = "";
		}
	}

	// ─── Category icons (Iconly Bulk-inspired two-tone inline SVGs) ───────────
	var _ico = (function () {
		var chart =
			'<rect fill="currentColor" fill-opacity=".35" x="2" y="15" width="4" height="6"/>' +
			'<rect fill="currentColor" fill-opacity=".35" x="9.5" y="11" width="5" height="10"/>' +
			'<rect fill="currentColor" fill-opacity=".35" x="17" y="7" width="5" height="14"/>' +
			'<circle fill="currentColor" cx="4" cy="13" r="2"/>' +
			'<circle fill="currentColor" cx="12" cy="9" r="2"/>' +
			'<circle fill="currentColor" cx="19.5" cy="5.5" r="2"/>';
		var house =
			'<path fill="currentColor" fill-opacity=".35" d="M20.5 10.5 12 4 3.5 10.5H5V21h5.5v-7h3v7H19V10.5z"/>' +
			'<rect fill="currentColor" x="9.5" y="14" width="5" height="7" rx=".5"/>';
		var car =
			'<path fill="currentColor" fill-opacity=".35" d="M5 11l2-5.5h10L19 11z"/>' +
			'<path fill="currentColor" d="M2 11h20v6.5a1 1 0 01-1 1H3a1 1 0 01-1-1V11z"/>' +
			'<circle fill="currentColor" cx="7" cy="20.5" r="2"/>' +
			'<circle fill="currentColor" cx="17" cy="20.5" r="2"/>';
		var shield =
			'<path fill="currentColor" fill-opacity=".35" d="M12 2L4 5.5v5.5c0 4.6 3.4 8.8 8 10.2 4.6-1.4 8-5.6 8-10.2V5.5z"/>';
		var crossCircle =
			'<circle fill="currentColor" fill-opacity=".35" cx="12" cy="12" r="10"/>' +
			'<rect fill="currentColor" x="10.5" y="7.5" width="3" height="9"/>' +
			'<rect fill="currentColor" x="7.5" y="10.5" width="9" height="3"/>';
		var gradCap =
			'<path fill="currentColor" fill-opacity=".35" d="M2.5 12 12 7.5 21.5 12 12 16.5z"/>' +
			'<path fill="currentColor" d="M7.5 14.5v4.5l4.5 2.5 4.5-2.5v-4.5l-4.5 2.5z"/>' +
			'<rect fill="currentColor" x="20" y="12" width="2" height="4.5" rx="1"/>';
		return {
			// ── expenses ──────────────────────────────────────────────────────
			rent: house,
			food:
				'<path fill="currentColor" fill-opacity=".35" d="M6.5 9h11l-1.5 10H8L6.5 9z"/>' +
				'<path fill="currentColor" d="M9.5 9V7a2.5 2.5 0 015 0v2z"/>',
			transport: car,
			utilities:
				'<path fill="currentColor" fill-opacity=".35" d="M14 2 5 14h7.5L10 22 21 10h-7.5z"/>',
			subscriptions:
				'<circle fill="currentColor" fill-opacity=".35" cx="12" cy="12" r="10"/>' +
				'<path fill="currentColor" d="M10 8.5l7.5 3.5-7.5 3.5z"/>',
			medical: crossCircle,
			childcare:
				'<circle fill="currentColor" fill-opacity=".35" cx="12" cy="7" r="4.5"/>' +
				'<path fill="currentColor" fill-opacity=".35" d="M4 21a8 8 0 1116 0H4z"/>' +
				'<path fill="currentColor" d="M8.5 21a3.5 3.5 0 017 0H8.5z"/>',
			// ── sources ───────────────────────────────────────────────────────
			ssdi:
				shield +
				'<circle fill="currentColor" cx="12" cy="9.5" r="2.5"/>' +
				'<path fill="currentColor" d="M8 17c0-2.2 1.8-4 4-4s4 1.8 4 4H8z"/>',
			ssi:
				shield +
				'<path fill="currentColor" d="M12 16.5l-3.5-3.5c-.9-.9-.9-2.3 0-3.2.9-.9 2.3-.9 3.2 0l.3.3.3-.3c.9-.9 2.3-.9 3.2 0 .9.9.9 2.3 0 3.2z"/>',
			employment:
				'<rect fill="currentColor" fill-opacity=".35" x="2" y="9" width="20" height="12" rx="2"/>' +
				'<path fill="currentColor" d="M16 9V7a2 2 0 00-2-2h-4a2 2 0 00-2 2v2h8z"/>',
			freelance:
				'<rect fill="currentColor" fill-opacity=".35" x="2" y="4" width="20" height="12" rx="2"/>' +
				'<path fill="currentColor" d="M0 18h24v1.5a1.5 1.5 0 01-1.5 1.5h-21A1.5 1.5 0 010 19.5z"/>',
			unemployment:
				'<circle fill="currentColor" fill-opacity=".35" cx="12" cy="7" r="5"/>' +
				'<path fill="currentColor" d="M3 21a9 9 0 1118 0H3z"/>',
			pension:
				'<rect fill="currentColor" fill-opacity=".35" x="3" y="6" width="18" height="15" rx="2"/>' +
				'<rect fill="currentColor" x="3" y="10" width="18" height="2.5"/>' +
				'<circle fill="currentColor" cx="8" cy="15.5" r="1.5"/>' +
				'<circle fill="currentColor" cx="12" cy="15.5" r="1.5"/>' +
				'<circle fill="currentColor" cx="16" cy="15.5" r="1.5"/>' +
				'<rect fill="currentColor" x="8" y="3.5" width="2" height="4" rx="1"/>' +
				'<rect fill="currentColor" x="14" y="3.5" width="2" height="4" rx="1"/>',
			rental:
				'<rect fill="currentColor" fill-opacity=".35" x="4" y="2.5" width="13.5" height="19" rx="1"/>' +
				'<rect fill="currentColor" x="7.5" y="6" width="2.5" height="3" rx=".5"/>' +
				'<rect fill="currentColor" x="12" y="6" width="2.5" height="3" rx=".5"/>' +
				'<rect fill="currentColor" x="7.5" y="12" width="2.5" height="3" rx=".5"/>' +
				'<rect fill="currentColor" x="12" y="12" width="2.5" height="3" rx=".5"/>' +
				'<rect fill="currentColor" x="10" y="17.5" width="3.5" height="4" rx=".5"/>',
			withdrawal401k: chart,
			withdrawalIra: chart,
			withdrawalRoth: chart,
			withdrawalBrokerage: chart,
			// ── assets ────────────────────────────────────────────────────────
			k401: chart,
			ira: chart,
			roth: chart,
			brokerage: chart,
			savings:
				'<ellipse fill="currentColor" fill-opacity=".35" cx="12" cy="8" rx="7.5" ry="2.5"/>' +
				'<path fill="currentColor" fill-opacity=".35" d="M4.5 8v3.5c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5V8"/>' +
				'<path fill="currentColor" d="M4.5 11.5v3.5c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-3.5c0 1.4-3.4 2.5-7.5 2.5S4.5 12.9 4.5 11.5z"/>',
			realestate: house,
			auto: car,
			hsa: crossCircle,
			crypto:
				'<path fill="currentColor" fill-opacity=".35" d="M12 3 22 10.5 12 21 2 10.5z"/>' +
				'<path fill="currentColor" d="M12 3 22 10.5H2z"/>',
			k529: gradCap,
			emergency:
				shield +
				'<rect fill="currentColor" x="10.5" y="8" width="3" height="6" rx="1.5"/>' +
				'<circle fill="currentColor" cx="12" cy="16.5" r="1.5"/>',
			// ── debts ─────────────────────────────────────────────────────────
			creditcard:
				'<rect fill="currentColor" fill-opacity=".35" x="2" y="6" width="20" height="12" rx="2"/>' +
				'<rect fill="currentColor" x="2" y="10" width="20" height="3.5"/>' +
				'<rect fill="currentColor" x="5" y="15.5" width="5" height="1.5" rx=".75"/>' +
				'<rect fill="currentColor" x="15" y="15.5" width="4" height="1.5" rx=".75"/>',
			studentloan: gradCap,
			carloan: car,
			personalloan:
				'<circle fill="currentColor" fill-opacity=".35" cx="9" cy="7.5" r="4"/>' +
				'<path fill="currentColor" fill-opacity=".35" d="M3 21a6 6 0 0112 0H3z"/>' +
				'<rect fill="currentColor" x="16.5" y="11" width="6" height="9" rx="1"/>' +
				'<circle fill="currentColor" cx="19.5" cy="16" r="2"/>',
			other:
				'<circle fill="currentColor" cx="5" cy="12" r="2.5"/>' +
				'<circle fill="currentColor" cx="12" cy="12" r="2.5"/>' +
				'<circle fill="currentColor" cx="19" cy="12" r="2.5"/>',
		};
	})();

	function getCategoryIcon(type) {
		var paths = _ico[type] || _ico.other;
		return (
			'<svg class="numbers-cat-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
			paths +
			"</svg>"
		);
	}

	// ─── Render helpers ──────────────────────────────────────────────────────

	var DRAG_HANDLE_SVG =
		'<span class="numbers-drag-handle" aria-label="Drag to reorder">' +
		'<svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">' +
		'<circle cx="3" cy="3" r="1.5" fill="currentColor"/>' +
		'<circle cx="3" cy="8" r="1.5" fill="currentColor"/>' +
		'<circle cx="3" cy="13" r="1.5" fill="currentColor"/>' +
		'<circle cx="7" cy="3" r="1.5" fill="currentColor"/>' +
		'<circle cx="7" cy="8" r="1.5" fill="currentColor"/>' +
		'<circle cx="7" cy="13" r="1.5" fill="currentColor"/>' +
		"</svg></span>";

	// Simple item (income source, expense, plain debt; or plain asset when growthRate defined)
	// showDragHandle: pass true only for asset items
	function buildSimpleItemHTML(item, defaults, growthRate, growthLabel) {
		var cfg = defaults[item.type];
		var growthHTML = "";
		if (growthRate !== undefined) {
			growthHTML =
				'<div class="numbers-equity-row numbers-equity-row--growth">' +
				'<span class="numbers-equity-row__label">' +
				(growthLabel || "Est. annual return") +
				"</span>" +
				'<div class="numbers-growth-wrap">' +
				'<input class="numbers-growth-input" type="number" min="-15" max="30" step="0.5" value="' +
				growthRate +
				'" data-growth-input="' +
				item.id +
				'" />' +
				'<span class="numbers-growth-pct">%</span>' +
				"</div>" +
				"</div>" +
				'<input class="numbers-range numbers-range--growth" type="range" min="-15" max="30" step="0.5" value="' +
				growthRate +
				'" data-item-id="' +
				item.id +
				'" data-field="growth" />';
		}
		var linkHTML = "";
		if (withdrawalAssetMap[item.type] !== undefined) {
			var compatibleType = withdrawalAssetMap[item.type];
			var compatibleAssets = state.assets.filter(function (a) {
				return a.type === compatibleType;
			});
			var optHTML =
				'<option value="">Not linked</option>' +
				compatibleAssets
					.map(function (a) {
						var aCfg = assetDefaults[a.type];
						var sel = item.linkedAssetId === a.id ? " selected" : "";
						return (
							'<option value="' +
							a.id +
							'"' +
							sel +
							">" +
							(a.customLabel || aCfg.label) +
							" (" +
							formatCompactCurrency(getAssetEquity(a)) +
							")</option>"
						);
					})
					.join("");
			linkHTML =
				'<div class="numbers-equity-row numbers-source-item__link-row">' +
				'<span class="numbers-equity-row__label">From account</span>' +
				'<select class="numbers-link-select" data-link-source="' +
				item.id +
				'">' +
				optHTML +
				"</select>" +
				"</div>";
		}
		return (
			'<div class="numbers-source-item" data-id="' +
			item.id +
			'">' +
			'<div class="numbers-source-item__header">' +
			DRAG_HANDLE_SVG +
			'<span class="numbers-source-item__label">' +
			getCategoryIcon(item.type) +
			(item.customLabel || cfg.label) +
			"</span>" +
			'<div class="numbers-source-item__header-right">' +
			'<div class="numbers-item-input-wrap">' +
			'<span class="numbers-item-input-prefix">$</span>' +
			'<input class="numbers-item-input" type="number" min="0" max="' +
			cfg.max +
			'" step="' +
			cfg.step +
			'" value="' +
			item.amount +
			'" data-amount-input="' +
			item.id +
			'" />' +
			"</div>" +
			'<button class="numbers-source-item__chevron" type="button" data-toggle="' +
			item.id +
			'" aria-label="Expand"><svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
			"</div>" +
			"</div>" +
			'<div class="numbers-source-item__body">' +
			'<input class="numbers-range" type="range" min="0" max="' +
			cfg.max +
			'" step="' +
			cfg.step +
			'" value="' +
			item.amount +
			'" data-item-id="' +
			item.id +
			'" />' +
			linkHTML +
			growthHTML +
			'<button class="numbers-source-item__delete" type="button" data-remove="' +
			item.id +
			'" aria-label="Delete">Delete</button>' +
			"</div>" +
			"</div>"
		);
	}

	// Rent / Mortgage item — total payment + interest/principal breakdown
	function buildRentItemHTML(item) {
		var cfg = expenseDefaults.rent;
		var interest =
			item.interest !== undefined
				? item.interest
				: Math.round(item.amount * 0.8);
		var principal = item.amount - interest;
		var intPct =
			item.amount > 0 ? Math.round((interest / item.amount) * 100) : 80;
		var princPct = 100 - intPct;
		return (
			'<div class="numbers-source-item numbers-source-item--equity" data-id="' +
			item.id +
			'">' +
			'<div class="numbers-source-item__header">' +
			DRAG_HANDLE_SVG +
			'<span class="numbers-source-item__label">' +
			getCategoryIcon("rent") +
			(item.customLabel || cfg.label) +
			"</span>" +
			'<div class="numbers-source-item__header-right">' +
			'<div class="numbers-item-input-wrap">' +
			'<span class="numbers-item-input-prefix">$</span>' +
			'<input class="numbers-item-input" type="number" min="0" max="' +
			cfg.max +
			'" step="' +
			cfg.step +
			'" value="' +
			item.amount +
			'" data-amount-input="' +
			item.id +
			'" />' +
			"</div>" +
			'<button class="numbers-source-item__chevron" type="button" data-toggle="' +
			item.id +
			'" aria-label="Expand"><svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
			"</div>" +
			"</div>" +
			'<div class="numbers-source-item__body">' +
			'<input class="numbers-range" type="range" min="0" max="' +
			cfg.max +
			'" step="' +
			cfg.step +
			'" value="' +
			item.amount +
			'" data-item-id="' +
			item.id +
			'" />' +
			'<div class="numbers-split-labels">' +
			'<span class="numbers-split-bar__label">Interest</span>' +
			'<span class="numbers-split-bar__label">Principal</span>' +
			"</div>" +
			'<div class="numbers-split-bar" data-split-bar="' +
			item.id +
			'">' +
			'<div class="numbers-split-bar__segment numbers-split-bar__segment--interest" data-split-left="' +
			item.id +
			'" style="flex:' +
			intPct +
			'">' +
			'<span class="numbers-split-bar__amount" data-rent-interest="' +
			item.id +
			'">' +
			formatCurrency(interest) +
			"</span>" +
			"</div>" +
			'<div class="numbers-split-bar__handle" data-split-handle="' +
			item.id +
			'"><div class="numbers-split-bar__pip"></div></div>' +
			'<div class="numbers-split-bar__segment numbers-split-bar__segment--principal" data-split-right="' +
			item.id +
			'" style="flex:' +
			princPct +
			'">' +
			'<span class="numbers-split-bar__amount" data-rent-principal="' +
			item.id +
			'">' +
			formatCurrency(principal) +
			"</span>" +
			"</div>" +
			"</div>" +
			// Paying-down link
			(function () {
				var equityAssets = state.assets.filter(function (a) {
					return assetDefaults[a.type].hasOwed;
				});
				if (!equityAssets.length) {
					return "";
				}
				var opts =
					'<option value="">Not linked</option>' +
					equityAssets
						.map(function (a) {
							var sel = item.linkedAssetId === a.id ? " selected" : "";
							return (
								'<option value="' +
								a.id +
								'"' +
								sel +
								">" +
								(a.customLabel || assetDefaults[a.type].label) +
								" (" +
								formatCompactCurrency(getAssetEquity(a)) +
								" equity)</option>"
							);
						})
						.join("");
				return (
					'<div class="numbers-equity-row numbers-source-item__link-row">' +
					'<span class="numbers-equity-row__label">Paying down</span>' +
					'<select class="numbers-link-select" data-link-expense="' +
					item.id +
					'">' +
					opts +
					"</select>" +
					"</div>"
				);
			})() +
			'<button class="numbers-source-item__delete" type="button" data-remove="' +
			item.id +
			'" aria-label="Delete">Delete</button>' +
			"</div>" +
			"</div>"
		);
	}

	// Equity asset item — value + owed + computed equity line
	function buildEquityItemHTML(item) {
		var cfg = assetDefaults[item.type];
		var equity = getAssetEquity(item);
		var owed = item.owed || 0;
		var growthRate =
			item.growthRate !== undefined ? item.growthRate : cfg.defaultGrowth;
		return (
			'<div class="numbers-source-item numbers-source-item--equity" data-id="' +
			item.id +
			'">' +
			'<div class="numbers-source-item__header">' +
			DRAG_HANDLE_SVG +
			'<span class="numbers-source-item__label">' +
			getCategoryIcon(item.type) +
			(item.customLabel || cfg.label) +
			"</span>" +
			'<div class="numbers-source-item__header-right">' +
			'<div class="numbers-item-input-wrap numbers-source-item__locked-summary">' +
			'<span class="numbers-item-input-prefix">$</span>' +
			'<span class="numbers-item-input">' +
			(equity / 1000 >= 1 ? (equity / 1000).toFixed(0) + "k" : equity) +
			"</span>" +
			"</div>" +
			'<button class="numbers-source-item__chevron" type="button" data-toggle="' +
			item.id +
			'" aria-label="Expand"><svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
			"</div>" +
			"</div>" +
			'<div class="numbers-source-item__body">' +
			// Value row
			'<div class="numbers-equity-row">' +
			'<span class="numbers-equity-row__label">Value</span>' +
			'<div class="numbers-item-input-wrap">' +
			'<span class="numbers-item-input-prefix">$</span>' +
			'<input class="numbers-item-input" type="number" min="0" max="' +
			cfg.max +
			'" step="' +
			cfg.step +
			'" value="' +
			item.amount +
			'" data-equity-value="' +
			item.id +
			'" />' +
			"</div>" +
			"</div>" +
			'<input class="numbers-range" type="range" min="0" max="' +
			cfg.max +
			'" step="' +
			cfg.step +
			'" value="' +
			item.amount +
			'" data-item-id="' +
			item.id +
			'" data-field="value" />' +
			// Owed row
			'<div class="numbers-equity-row">' +
			'<span class="numbers-equity-row__label">Owed</span>' +
			'<div class="numbers-item-input-wrap">' +
			'<span class="numbers-item-input-prefix numbers-item-input-prefix--owed">$</span>' +
			'<input class="numbers-item-input numbers-item-input--owed" type="number" min="0" max="' +
			cfg.maxOwed +
			'" step="' +
			cfg.stepOwed +
			'" value="' +
			owed +
			'" data-equity-owed="' +
			item.id +
			'" />' +
			"</div>" +
			"</div>" +
			'<input class="numbers-range" type="range" min="0" max="' +
			cfg.maxOwed +
			'" step="' +
			cfg.stepOwed +
			'" value="' +
			owed +
			'" data-item-id="' +
			item.id +
			'" data-field="owed" />' +
			// Equity summary
			'<div class="numbers-equity-summary">' +
			"<span>Equity</span>" +
			'<span class="numbers-equity-badge" data-equity-badge="' +
			item.id +
			'">' +
			formatCurrency(equity) +
			"</span>" +
			"</div>" +
			// Growth row
			'<div class="numbers-equity-row numbers-equity-row--growth">' +
			'<span class="numbers-equity-row__label">Est. annual return</span>' +
			'<div class="numbers-growth-wrap">' +
			'<input class="numbers-growth-input" type="number" min="-15" max="30" step="0.5" value="' +
			growthRate +
			'" data-growth-input="' +
			item.id +
			'" />' +
			'<span class="numbers-growth-pct">%</span>' +
			"</div>" +
			"</div>" +
			'<input class="numbers-range numbers-range--growth" type="range" min="-15" max="30" step="0.5" value="' +
			growthRate +
			'" data-item-id="' +
			item.id +
			'" data-field="growth" />' +
			'<button class="numbers-source-item__delete" type="button" data-remove="' +
			item.id +
			'" aria-label="Delete">Delete</button>' +
			"</div>" +
			"</div>"
		);
	}

	function buildAssetItemHTML(item) {
		return assetDefaults[item.type].hasOwed
			? buildEquityItemHTML(item)
			: buildSimpleItemHTML(
					item,
					assetDefaults,
					item.growthRate !== undefined
						? item.growthRate
						: assetDefaults[item.type].defaultGrowth,
				);
	}

	function attachLockToggle(container) {
		container
			.querySelectorAll(".numbers-source-item__chevron")
			.forEach(function (btn) {
				btn.addEventListener("click", function (e) {
					e.stopPropagation();
					var card = btn.closest(".numbers-source-item");
					var body = card.querySelector(".numbers-source-item__body");
					var isOpen = card.classList.contains("is-unlocked");
					if (!isOpen) {
						// Opening: add class first so children get display:block/flex,
						// then animate height from 0 → scrollHeight
						card.classList.add("is-unlocked");
						body.style.overflow = "hidden";
						body.style.height = "0px";
						body.offsetHeight; // force reflow
						body.style.height = body.scrollHeight + "px";
						body.addEventListener(
							"transitionend",
							function fin() {
								body.style.height = "";
								body.style.overflow = "";
								body.removeEventListener("transitionend", fin);
							},
							{ once: true },
						);
					} else {
						// Closing: capture height before removing class so display:none
						// doesn't collapse children ahead of the transition
						var h = body.scrollHeight;
						body.style.overflow = "hidden";
						body.style.height = h + "px";
						body.offsetHeight; // force reflow
						card.classList.remove("is-unlocked");
						body.style.height = "0px";
						body.addEventListener(
							"transitionend",
							function fin() {
								body.style.height = "";
								body.style.overflow = "";
								body.removeEventListener("transitionend", fin);
							},
							{ once: true },
						);
					}
				});
			});
	}

	function attachDragReorder(container, arr, onReorder) {
		var draggingId = null;

		var _lastIndTarget = null;
		var _lastIndClass = null;

		function clearIndicators() {
			container.querySelectorAll(".numbers-source-item").forEach(function (c) {
				c.classList.remove(
					"is-dragging",
					"drag-line-before",
					"drag-line-after",
				);
			});
			_lastIndTarget = null;
			_lastIndClass = null;
		}

		// Threshold at gap midpoint — threshold is in empty space, no border artifacts
		var GAP_PX = 8;
		function getInsertIdx(clientY) {
			var cards = container.querySelectorAll(".numbers-source-item");
			var idx = 0;
			for (var i = 0; i < cards.length; i++) {
				if (clientY > cards[i].getBoundingClientRect().bottom + GAP_PX / 2) {
					idx = i + 1;
				}
			}
			return idx;
		}

		function showIndicator(clientY) {
			var cards = Array.from(
				container.querySelectorAll(".numbers-source-item"),
			);
			if (!cards.length) {
				return;
			}
			var insertIdx = getInsertIdx(clientY);
			var targetCard, cls;
			if (insertIdx === 0) {
				targetCard = cards[0];
				cls = "drag-line-before";
			} else {
				targetCard = cards[insertIdx - 1];
				cls = "drag-line-after";
			}
			// Redirect if indicator lands on the dragging card itself
			if (Number(targetCard.dataset.id) === draggingId) {
				if (cls === "drag-line-after" && insertIdx < cards.length) {
					targetCard = cards[insertIdx];
					cls = "drag-line-before";
				} else if (cls === "drag-line-before" && insertIdx > 0) {
					targetCard = cards[insertIdx - 2];
					cls = "drag-line-after";
				} else {
					return;
				}
			}
			if (!targetCard) {
				return;
			}
			if (_lastIndTarget === targetCard && _lastIndClass === cls) {
				return;
			}
			if (_lastIndTarget) {
				_lastIndTarget.classList.remove("drag-line-before", "drag-line-after");
			}
			targetCard.classList.add(cls);
			_lastIndTarget = targetCard;
			_lastIndClass = cls;
		}

		function doReorder(clientY) {
			if (draggingId === null) {
				return;
			}
			var insertIdx = getInsertIdx(clientY);
			var fromIdx = arr.findIndex(function (x) {
				return x.id === draggingId;
			});
			if (fromIdx === -1) {
				clearIndicators();
				draggingId = null;
				return;
			}
			var moved = arr.splice(fromIdx, 1)[0];
			var targetIdx = insertIdx > fromIdx ? insertIdx - 1 : insertIdx;
			targetIdx = Math.max(0, Math.min(arr.length, targetIdx));
			arr.splice(targetIdx, 0, moved);
			onReorder();
		}

		// ── Mouse drag (desktop) ──────────────────────────────────────────────
		// Use mousedown/mousemove/mouseup (not HTML5 DnD) to avoid the browser
		// ghost-image snap-back animation entirely.
		container
			.querySelectorAll(".numbers-drag-handle")
			.forEach(function (handle) {
				handle.addEventListener("mousedown", function (e) {
					e.preventDefault(); // prevent text selection
					var card = handle.closest(".numbers-source-item");
					draggingId = Number(card.dataset.id);
					card.classList.add("is-dragging");

					function onMouseMove(ev) {
						showIndicator(ev.clientY);
					}
					function onMouseUp(ev) {
						document.removeEventListener("mousemove", onMouseMove);
						document.removeEventListener("mouseup", onMouseUp);
						doReorder(ev.clientY);
					}
					document.addEventListener("mousemove", onMouseMove);
					document.addEventListener("mouseup", onMouseUp);
				});
			});

		// ── Touch drag (mobile) ───────────────────────────────────────────────
		container
			.querySelectorAll(".numbers-drag-handle")
			.forEach(function (handle) {
				handle.addEventListener(
					"touchstart",
					function (e) {
						var card = handle.closest(".numbers-source-item");
						draggingId = Number(card.dataset.id);
						card.classList.add("is-dragging");
					},
					{ passive: true },
				);

				handle.addEventListener(
					"touchmove",
					function (e) {
						if (draggingId === null) {
							return;
						}
						e.preventDefault();
						var touch = e.touches[0];
						showIndicator(touch.clientY);
					},
					{ passive: false },
				);

				handle.addEventListener(
					"touchend",
					function (e) {
						if (draggingId === null) {
							return;
						}
						var touch = e.changedTouches[0];
						doReorder(touch.clientY);
					},
					{ passive: true },
				);
			});
	}

	function attachSimpleListeners(container, arr, onRemove) {
		// Range slider → sync number input
		container
			.querySelectorAll(".numbers-range:not([data-field])")
			.forEach(function (input) {
				input.addEventListener("input", function () {
					var id = Number(this.dataset.itemId);
					var item = arr.find(function (x) {
						return x.id === id;
					});
					if (!item) {
						return;
					}
					item.amount = Number(this.value);
					var numIn = container.querySelector(
						'[data-amount-input="' + id + '"]',
					);
					if (numIn) {
						numIn.value = item.amount;
					}
					updateView();
				});
			});
		// Number input → sync range slider
		container.querySelectorAll("[data-amount-input]").forEach(function (input) {
			input.addEventListener("change", function () {
				var id = Number(this.dataset.amountInput);
				var item = arr.find(function (x) {
					return x.id === id;
				});
				if (!item) {
					return;
				}
				var val = Math.max(
					0,
					Math.min(Number(this.max) || 9999999, Number(this.value) || 0),
				);
				item.amount = val;
				this.value = val;
				var rangeIn = container.querySelector(
					'.numbers-range[data-item-id="' + id + '"]:not([data-field])',
				);
				if (rangeIn) {
					rangeIn.value = val;
				}
				updateView();
			});
		});
		// Remove buttons
		container.querySelectorAll("[data-remove]").forEach(function (btn) {
			btn.addEventListener("click", function () {
				onRemove(Number(this.dataset.remove));
			});
		});
	}

	function syncEquityHeader(container, id, item) {
		var eq = getAssetEquity(item);
		var badge = container.querySelector('[data-equity-badge="' + id + '"]');
		if (badge) {
			badge.textContent = formatCurrency(eq);
		}
		var card = container.querySelector('[data-id="' + id + '"]');
		if (card) {
			var summaryVal = card.querySelector(
				".numbers-source-item__locked-summary .numbers-item-input",
			);
			if (summaryVal) {
				summaryVal.textContent = eq >= 1000 ? (eq / 1000).toFixed(0) + "k" : eq;
			}
		}
	}

	function attachEquityListeners(container) {
		// Range sliders → sync number inputs + equity badge + locked summary
		container
			.querySelectorAll(
				'.numbers-range[data-field="value"], .numbers-range[data-field="owed"]',
			)
			.forEach(function (input) {
				input.addEventListener("input", function () {
					var id = Number(this.dataset.itemId);
					var field = this.dataset.field;
					var item = state.assets.find(function (x) {
						return x.id === id;
					});
					if (!item) {
						return;
					}
					if (field === "value") {
						item.amount = Number(this.value);
						var valIn = container.querySelector(
							'[data-equity-value="' + id + '"]',
						);
						if (valIn) {
							valIn.value = item.amount;
						}
					} else {
						item.owed = Number(this.value);
						var owedIn = container.querySelector(
							'[data-equity-owed="' + id + '"]',
						);
						if (owedIn) {
							owedIn.value = item.owed;
						}
					}
					syncEquityHeader(container, id, item);
					updateStats();
				});
			});
		// Number inputs → sync range sliders + equity badge + locked summary
		container.querySelectorAll("[data-equity-value]").forEach(function (input) {
			input.addEventListener("change", function () {
				var id = Number(this.dataset.equityValue);
				var item = state.assets.find(function (x) {
					return x.id === id;
				});
				if (!item) {
					return;
				}
				var cfg = assetDefaults[item.type];
				var val = Math.max(0, Math.min(cfg.max, Number(this.value) || 0));
				item.amount = val;
				this.value = val;
				var rangeIn = container.querySelector(
					'.numbers-range[data-item-id="' + id + '"][data-field="value"]',
				);
				if (rangeIn) {
					rangeIn.value = val;
				}
				syncEquityHeader(container, id, item);
				updateStats();
			});
		});
		container.querySelectorAll("[data-equity-owed]").forEach(function (input) {
			input.addEventListener("change", function () {
				var id = Number(this.dataset.equityOwed);
				var item = state.assets.find(function (x) {
					return x.id === id;
				});
				if (!item) {
					return;
				}
				var cfg = assetDefaults[item.type];
				var val = Math.max(0, Math.min(cfg.maxOwed, Number(this.value) || 0));
				item.owed = val;
				this.value = val;
				var rangeIn = container.querySelector(
					'.numbers-range[data-item-id="' + id + '"][data-field="owed"]',
				);
				if (rangeIn) {
					rangeIn.value = val;
				}
				syncEquityHeader(container, id, item);
				updateStats();
			});
		});
	}

	function updateSplitBar(bar, item) {
		var intPct = item.amount > 0 ? item.interest / item.amount : 0.8;
		var princPct = 1 - intPct;
		var leftEl = bar.querySelector("[data-split-left]");
		var rightEl = bar.querySelector("[data-split-right]");
		var intEl = bar.querySelector("[data-rent-interest]");
		var princEl = bar.querySelector("[data-rent-principal]");
		if (leftEl) {
			leftEl.style.flex = String(Math.round(intPct * 100));
		}
		if (rightEl) {
			rightEl.style.flex = String(Math.round(princPct * 100));
		}
		if (intEl) {
			intEl.textContent = formatCurrency(item.interest);
		}
		if (princEl) {
			princEl.textContent = formatCurrency(item.amount - item.interest);
		}
	}

	function attachRentListeners(container) {
		// Total amount slider/input: preserve split proportion
		container
			.querySelectorAll(".numbers-range:not([data-field])")
			.forEach(function (range) {
				var id = Number(range.dataset.itemId);
				var item = state.expenses.find(function (x) {
					return x.id === id && x.type === "rent";
				});
				if (!item) {
					return;
				}
				function syncBar() {
					var pct = item.amount > 0 ? item.interest / item.amount : 0.8;
					item.interest = Math.round(item.amount * pct);
					var bar = container.querySelector('[data-split-bar="' + id + '"]');
					if (bar) {
						updateSplitBar(bar, item);
					}
					var preciseInput = container.querySelector(
						'[data-split-input="' + id + '"]',
					);
					if (preciseInput) {
						preciseInput.max = item.amount;
						preciseInput.value = item.interest;
					}
				}
				range.addEventListener("input", syncBar);
				var numIn = container.querySelector('[data-amount-input="' + id + '"]');
				if (numIn) {
					numIn.addEventListener("change", syncBar);
				}
			});
		// Split bar drag + tap
		container.querySelectorAll("[data-split-bar]").forEach(function (bar) {
			var id = Number(bar.dataset.splitBar);
			var handle = bar.querySelector("[data-split-handle]");
			if (!handle) {
				return;
			}
			handle.addEventListener("mousedown", startDrag);
			handle.addEventListener("touchstart", startDrag, { passive: false });
			function startDrag(e) {
				e.preventDefault();
				var moved = false;
				var rect = bar.getBoundingClientRect();
				function onMove(ev) {
					moved = true;
					var clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
					var pct = Math.max(
						0.05,
						Math.min(0.95, (clientX - rect.left) / rect.width),
					);
					var item = state.expenses.find(function (x) {
						return x.id === id;
					});
					if (!item) {
						return;
					}
					item.interest = Math.round(item.amount * pct);
					updateSplitBar(bar, item);
					var preciseInput = container.querySelector(
						'[data-split-input="' + id + '"]',
					);
					if (preciseInput) {
						preciseInput.value = item.interest;
					}
					updateView();
				}
				function onEnd() {
					document.removeEventListener("mousemove", onMove);
					document.removeEventListener("mouseup", onEnd);
					document.removeEventListener("touchmove", onMove);
					document.removeEventListener("touchend", onEnd);
					// Tap (no movement) → toggle precise input
					if (!moved) {
						var preciseEl = container.querySelector(
							'[data-split-precise="' + id + '"]',
						);
						if (preciseEl) {
							var isHidden = preciseEl.hidden;
							preciseEl.hidden = !isHidden;
							if (isHidden) {
								var inp = preciseEl.querySelector("[data-split-input]");
								if (inp) {
									setTimeout(function () {
										inp.focus();
										inp.select();
									}, 50);
								}
							}
						}
					}
				}
				document.addEventListener("mousemove", onMove);
				document.addEventListener("mouseup", onEnd);
				document.addEventListener("touchmove", onMove, { passive: false });
				document.addEventListener("touchend", onEnd);
			}
		});
		// Precise input commitment
		container.querySelectorAll("[data-split-input]").forEach(function (input) {
			function commit() {
				var id = Number(this.dataset.splitInput);
				var item = state.expenses.find(function (x) {
					return x.id === id;
				});
				if (!item) {
					return;
				}
				var val = Math.max(0, Math.min(item.amount, Number(this.value) || 0));
				item.interest = val;
				this.value = val;
				var bar = container.querySelector('[data-split-bar="' + id + '"]');
				if (bar) {
					updateSplitBar(bar, item);
				}
				updateView();
			}
			input.addEventListener("change", commit);
			input.addEventListener("keydown", function (e) {
				if (e.key === "Enter") {
					commit.call(this);
					var preciseEl = container.querySelector(
						'[data-split-precise="' + this.dataset.splitInput + '"]',
					);
					if (preciseEl) {
						preciseEl.hidden = true;
					}
				}
			});
		});
	}

	function attachSourceRateListeners(container) {
		// Range slider → sync number input
		container
			.querySelectorAll('.numbers-range[data-field="growth"]')
			.forEach(function (input) {
				input.addEventListener("input", function () {
					var id = Number(this.dataset.itemId);
					var item = state.sources.find(function (x) {
						return x.id === id;
					});
					if (!item) {
						return;
					}
					item.rateGrowth = Number(this.value);
					var numIn = container.querySelector(
						'[data-growth-input="' + id + '"]',
					);
					if (numIn) {
						numIn.value = item.rateGrowth;
					}
					updateStats();
				});
			});
		// Number input → sync range slider
		container.querySelectorAll("[data-growth-input]").forEach(function (input) {
			input.addEventListener("change", function () {
				var id = Number(this.dataset.growthInput);
				var item = state.sources.find(function (x) {
					return x.id === id;
				});
				if (!item) {
					return;
				}
				var val = Math.max(-15, Math.min(30, Number(this.value) || 0));
				item.rateGrowth = val;
				this.value = val;
				var rangeIn = container.querySelector(
					'.numbers-range[data-item-id="' + id + '"][data-field="growth"]',
				);
				if (rangeIn) {
					rangeIn.value = val;
				}
				updateStats();
			});
		});
	}

	function attachWithdrawalLinkListeners(container) {
		container.querySelectorAll("[data-link-source]").forEach(function (select) {
			select.addEventListener("change", function () {
				var id = Number(this.dataset.linkSource);
				var item = state.sources.find(function (x) {
					return x.id === id;
				});
				if (!item) {
					return;
				}
				item.linkedAssetId = this.value ? Number(this.value) : undefined;
				updateStats();
			});
		});
	}

	function attachMortgageLinkListeners(container) {
		container
			.querySelectorAll("[data-link-expense]")
			.forEach(function (select) {
				select.addEventListener("change", function () {
					var id = Number(this.dataset.linkExpense);
					var item = state.expenses.find(function (x) {
						return x.id === id;
					});
					if (!item) {
						return;
					}
					item.linkedAssetId = this.value ? Number(this.value) : undefined;
					updateStats();
				});
			});
	}

	// Refresh select options in-place (called when assets change) without re-rendering cards
	function refreshWithdrawalSelects() {
		sourcesList
			.querySelectorAll("[data-link-source]")
			.forEach(function (select) {
				var id = Number(select.dataset.linkSource);
				var item = state.sources.find(function (x) {
					return x.id === id;
				});
				if (!item || withdrawalAssetMap[item.type] === undefined) {
					return;
				}
				var compatibleType = withdrawalAssetMap[item.type];
				var compatibleAssets = state.assets.filter(function (a) {
					return a.type === compatibleType;
				});
				var currentVal = select.value;
				select.innerHTML =
					'<option value="">Not linked</option>' +
					compatibleAssets
						.map(function (a) {
							var aCfg = assetDefaults[a.type];
							var sel =
								String(item.linkedAssetId) === String(a.id) ? " selected" : "";
							return (
								'<option value="' +
								a.id +
								'"' +
								sel +
								">" +
								(a.customLabel || aCfg.label) +
								" (" +
								formatCompactCurrency(getAssetEquity(a)) +
								")</option>"
							);
						})
						.join("");
				if (currentVal) {
					select.value = currentVal;
				}
			});
		// Refresh mortgage paydown selects
		expensesList
			.querySelectorAll("[data-link-expense]")
			.forEach(function (select) {
				var id = Number(select.dataset.linkExpense);
				var item = state.expenses.find(function (x) {
					return x.id === id;
				});
				if (!item) {
					return;
				}
				var equityAssets = state.assets.filter(function (a) {
					return assetDefaults[a.type].hasOwed;
				});
				var currentVal = select.value;
				select.innerHTML =
					'<option value="">Not linked</option>' +
					equityAssets
						.map(function (a) {
							var sel =
								String(item.linkedAssetId) === String(a.id) ? " selected" : "";
							return (
								'<option value="' +
								a.id +
								'"' +
								sel +
								">" +
								(a.customLabel || assetDefaults[a.type].label) +
								" (" +
								formatCompactCurrency(getAssetEquity(a)) +
								" equity)</option>"
							);
						})
						.join("");
				if (currentVal) {
					select.value = currentVal;
				}
			});
	}

	function attachGrowthListeners(container) {
		// Range slider → sync number input only (no full re-render)
		container
			.querySelectorAll('.numbers-range[data-field="growth"]')
			.forEach(function (input) {
				input.addEventListener("input", function () {
					var id = Number(this.dataset.itemId);
					var item = state.assets.find(function (x) {
						return x.id === id;
					});
					if (!item) {
						return;
					}
					item.growthRate = Number(this.value);
					var numIn = container.querySelector(
						'[data-growth-input="' + id + '"]',
					);
					if (numIn) {
						numIn.value = item.growthRate;
					}
					updateStats();
				});
			});
		// Number input → sync range slider
		container.querySelectorAll("[data-growth-input]").forEach(function (input) {
			input.addEventListener("change", function () {
				var id = Number(this.dataset.growthInput);
				var item = state.assets.find(function (x) {
					return x.id === id;
				});
				if (!item) {
					return;
				}
				var val = Math.max(-15, Math.min(30, Number(this.value) || 0));
				item.growthRate = val;
				this.value = val;
				var rangeIn = container.querySelector(
					'.numbers-range[data-item-id="' + id + '"][data-field="growth"]',
				);
				if (rangeIn) {
					rangeIn.value = val;
				}
				updateStats();
			});
		});
	}

	// ─── Render fns ──────────────────────────────────────────────────────────

	function renderSources() {
		if (state.sources.length === 0) {
			sourcesList.innerHTML = "";
		} else {
			sourcesList.innerHTML = state.sources
				.map(function (s) {
					return buildSimpleItemHTML(
						s,
						sourceDefaults,
						s.rateGrowth !== undefined ? s.rateGrowth : 3,
						"Annual raise",
					);
				})
				.join("");
			attachSimpleListeners(sourcesList, state.sources, function (id) {
				state.sources = state.sources.filter(function (x) {
					return x.id !== id;
				});
				renderSources();
				updateView();
			});
			attachLockToggle(sourcesList);
			attachSourceRateListeners(sourcesList);
			attachWithdrawalLinkListeners(sourcesList);
			attachDragReorder(sourcesList, state.sources, function () {
				renderSources();
				updateView();
			});
		}
		incomePanelTotal.textContent = formatCurrency(getTotalIncome()) + "/mo";
	}

	function renderExpenses() {
		if (state.expenses.length === 0) {
			expensesList.innerHTML = "";
		} else {
			expensesList.innerHTML = state.expenses
				.map(function (e) {
					return e.type === "rent"
						? buildRentItemHTML(e)
						: buildSimpleItemHTML(e, expenseDefaults);
				})
				.join("");
			attachSimpleListeners(expensesList, state.expenses, function (id) {
				state.expenses = state.expenses.filter(function (x) {
					return x.id !== id;
				});
				renderExpenses();
				updateView();
			});
			attachRentListeners(expensesList);
			attachMortgageLinkListeners(expensesList);
			attachLockToggle(expensesList);
			attachDragReorder(expensesList, state.expenses, function () {
				renderExpenses();
				updateView();
			});
		}
		spendingPanelTotal.textContent = formatCurrency(getTotalExpenses()) + "/mo";
	}

	function renderAssets() {
		if (state.assets.length === 0) {
			assetsList.innerHTML = "";
		} else {
			assetsList.innerHTML = state.assets
				.map(function (a) {
					return buildAssetItemHTML(a);
				})
				.join("");
			// Simple assets: range without data-field
			attachSimpleListeners(assetsList, state.assets, function (id) {
				state.assets = state.assets.filter(function (x) {
					return x.id !== id;
				});
				renderAssets();
				updateView();
			});
			// Equity assets: value/owed ranges
			attachEquityListeners(assetsList);
			// Growth rate sliders on all asset cards
			attachGrowthListeners(assetsList);
			attachLockToggle(assetsList);
			attachDragReorder(assetsList, state.assets, function () {
				renderAssets();
				updateView();
			});
		}
		assetsPanelTotal.textContent =
			formatCurrency(getTotalAssetEquity()) + " equity";
	}

	function renderDebts() {
		if (state.debts.length === 0) {
			debtList.innerHTML = "";
		} else {
			debtList.innerHTML = state.debts
				.map(function (d) {
					return buildSimpleItemHTML(d, debtDefaults);
				})
				.join("");
			attachSimpleListeners(debtList, state.debts, function (id) {
				state.debts = state.debts.filter(function (x) {
					return x.id !== id;
				});
				renderDebts();
				updateView();
			});
			attachLockToggle(debtList);
		}
		debtPanelTotal.textContent = state.debts.length
			? "−" + formatCurrency(getTotalDebt())
			: "$0";
	}

	// ─── Mortgage amortization helper ────────────────────────────────────────
	// Returns an HTML string for the amortization chart+table for one linked asset/expense pair.
	// Pass the asset object and the linked expense object (type='rent' with linkedAssetId).
	function buildAmortHTML(asset, expense) {
		var owed0 = asset.owed;
		var payment = expense.amount;
		var intM0 =
			expense.interest !== undefined
				? expense.interest
				: Math.round(expense.amount * 0.8);
		var monthlyRate = owed0 > 0 ? intM0 / owed0 : 0;
		if (monthlyRate <= 0 || payment <= intM0) {
			return "";
		}
		var assetGrowth =
			(asset.growthRate !== undefined
				? asset.growthRate
				: assetDefaults[asset.type].defaultGrowth) /
			100 /
			12;
		var yearData = [],
			balance = owed0,
			value = asset.amount;
		for (var ay = 1; ay <= 30; ay++) {
			var annInt = 0,
				annPrinc = 0;
			for (var am = 0; am < 12; am++) {
				if (balance <= 0) {
					break;
				}
				var im = balance * monthlyRate;
				var pm = Math.min(Math.max(0, payment - im), balance);
				annInt += im;
				annPrinc += pm;
				balance = Math.max(0, balance - pm);
				value *= 1 + assetGrowth;
			}
			yearData.push({
				year: ay,
				interest: annInt,
				principal: annPrinc,
				balance: balance,
				value: value,
			});
			if (balance <= 0) {
				break;
			}
		}
		var payoffEntry = yearData.find(function (d) {
			return d.balance <= 0;
		});
		var chartData = yearData;
		var asvgW = 260,
			bH = 70,
			lblH = 14;
		var bW = 5;
		var bN = chartData.length;
		// milestone labels: yr 1, ~midpoint, payoff year
		var midY = Math.ceil(chartData.length / 2);
		var labelYrs = new Set([1, midY, chartData[chartData.length - 1].year]);
		var barsHTML = chartData
			.map(function (d, i) {
				var tot = d.interest + d.principal;
				if (tot <= 0) {
					return "";
				}
				var intH = Math.round((d.interest / tot) * bH);
				var prH = bH - intH;
				var bx = bN > 1 ? (i / (bN - 1)) * (asvgW - bW) : 0;
				var isPO = payoffEntry && d.year === payoffEntry.year;
				return (
					'<rect x="' +
					bx +
					'" y="0" width="' +
					bW +
					'" height="' +
					intH +
					'" fill="rgba(239,68,68,0.65)" rx="1"/>' +
					'<rect x="' +
					bx +
					'" y="' +
					intH +
					'" width="' +
					bW +
					'" height="' +
					prH +
					'" fill="rgba(34,197,94,0.75)" rx="1"/>' +
					(isPO
						? '<text x="' +
							(bx + bW / 2) +
							'" y="' +
							(bH - 4) +
							'" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.9)">✓</text>'
						: "") +
					(labelYrs.has(d.year)
						? '<text x="' +
							(bx + bW / 2) +
							'" y="' +
							(bH + 11) +
							'" text-anchor="middle" font-size="8" fill="rgba(0,0,0,0.4)">Yr ' +
							d.year +
							"</text>"
						: "")
				);
			})
			.join("");
		var valMin = asset.amount;
		var valMax = Math.max.apply(
			Math,
			chartData.map(function (d) {
				return d.value;
			}),
		);
		var valRange = Math.max(1, valMax - valMin);
		var valueLine = chartData
			.map(function (d, i) {
				var vx = (bN > 1 ? (i / (bN - 1)) * (asvgW - bW) : 0) + bW / 2;
				var vy =
					bH - 4 - Math.round(((d.value - valMin) / valRange) * (bH - 8));
				return vx + "," + vy;
			})
			.join(" ");
		var fmtAmt = function (v) {
			return Math.abs(v) >= 1000 ? formatCompactCurrency(v) : formatCurrency(v);
		};
		var summaryRows = yearData
			.map(function (d) {
				var isPO = payoffEntry && d.year === payoffEntry.year;
				return (
					'<div class="numbers-plan-amort-row' +
					(isPO ? " is-payoff" : "") +
					'">' +
					'<span class="numbers-plan-amort-yr">Yr ' +
					d.year +
					(isPO ? " ✓" : "") +
					"</span>" +
					'<span class="numbers-plan-amort-int">−' +
					fmtAmt(d.interest) +
					"</span>" +
					'<span class="numbers-plan-amort-princ">+' +
					fmtAmt(d.principal) +
					"</span>" +
					'<span class="numbers-plan-amort-val">' +
					fmtAmt(d.value) +
					"</span>" +
					"</div>"
				);
			})
			.join("");
		return (
			'<div class="numbers-plan-amort">' +
			'<svg class="numbers-future-amort-chart" viewBox="0 0 ' +
			asvgW +
			" " +
			(bH + lblH) +
			'" preserveAspectRatio="none">' +
			barsHTML +
			(chartData.length > 1
				? '<polyline points="' +
					valueLine +
					'" fill="none" stroke="rgba(59,130,246,0.85)" stroke-width="1.5" stroke-dasharray="3,2"/>'
				: "") +
			"</svg>" +
			'<div class="numbers-future-amort-legend">' +
			'<span class="numbers-future-amort-dot numbers-future-amort-dot--int"></span>Interest  ' +
			'<span class="numbers-future-amort-dot numbers-future-amort-dot--princ"></span>Principal  ' +
			'<span class="numbers-future-amort-dot numbers-future-amort-dot--val"></span>Property value' +
			"</div>" +
			"</div>" +
			'<div class="numbers-plan-amort-table">' +
			'<div class="numbers-future-amort-hdr"><span></span><span>Interest</span><span>Principal</span><span>Value</span></div>' +
			summaryRows +
			"</div>"
		);
	}

	// ─── Bars ────────────────────────────────────────────────────────────────

	function renderBars(nowVal, totalDebt) {
		// Generate yearly checkpoints: Now + every year up to YEARS
		var step = YEARS <= 5 ? 1 : YEARS <= 15 ? 2 : 5;
		var checkpoints = [{ label: "Now", value: nowVal }];
		for (var yr = step; yr <= YEARS; yr += step) {
			var v = projectAllAssets(yr) - totalDebt;
			checkpoints.push({ label: "Y" + yr, value: Math.max(v, 1) });
		}
		// Ensure the final year always appears
		var last = checkpoints[checkpoints.length - 1];
		if (last.label !== "Y" + YEARS) {
			checkpoints.push({
				label: "Y" + YEARS,
				value: Math.max(projectAllAssets(YEARS) - totalDebt, 1),
			});
		}

		var W = 300,
			H = 90,
			PAD = 10,
			LABEL_H = 16;
		var values = checkpoints.map(function (c) {
			return c.value;
		});
		var maxV = Math.max.apply(null, values);
		var minV = Math.min.apply(null, values);
		var range = Math.max(maxV - minV, 1);
		var n = checkpoints.length;

		function xAt(i) {
			return PAD + (i / (n - 1)) * (W - PAD * 2);
		}
		function yAt(v) {
			return H - PAD - ((v - minV) / range) * (H - PAD * 2);
		}

		var points = checkpoints
			.map(function (c, i) {
				return xAt(i) + "," + yAt(c.value);
			})
			.join(" ");

		var dots = checkpoints
			.map(function (c, i) {
				var x = xAt(i);
				var y = yAt(c.value);
				var isPeak =
					i > 0 &&
					i < n - 1 &&
					((c.value >= checkpoints[i - 1].value &&
						c.value >= checkpoints[i + 1].value) ||
						(c.value <= checkpoints[i - 1].value &&
							c.value <= checkpoints[i + 1].value));
				var showVal = i === 0 || i === n - 1 || isPeak;
				var valText = showVal
					? '<text x="' +
						x +
						'" y="' +
						(y - 10) +
						'" text-anchor="middle" class="numbers-chart-val">' +
						formatCompactCurrency(c.value) +
						"</text>"
					: "";
				return (
					'<circle cx="' +
					x +
					'" cy="' +
					y +
					'" r="' +
					(showVal ? 3.5 : 2) +
					'" class="numbers-chart-dot' +
					(showVal ? "" : " numbers-chart-dot--minor") +
					'"/>' +
					valText +
					'<text x="' +
					x +
					'" y="' +
					(H + LABEL_H) +
					'" text-anchor="middle" class="numbers-chart-label">' +
					c.label +
					"</text>"
				);
			})
			.join("");

		projectionBarsEl.innerHTML =
			'<svg class="numbers-line-chart" viewBox="0 0 ' +
			W +
			" " +
			(H + LABEL_H + 4) +
			'">' +
			'<polyline points="' +
			points +
			'" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" class="numbers-chart-line"/>' +
			dots +
			"</svg>";

		// ── Detail breakdown ──────────────────────────────────────────────────
		if (!projectionDetailEl) {
			return;
		}

		var assetRows = state.assets
			.map(function (a) {
				var cfg = assetDefaults[a.type];
				var equity = getAssetEquity(a);
				var rate =
					a.growthRate !== undefined ? a.growthRate : cfg.defaultGrowth;
				var monthlyPrincipal = state.expenses.reduce(function (p, e) {
					if (e.type !== "rent" || e.linkedAssetId !== a.id) {
						return p;
					}
					var interest =
						e.interest !== undefined ? e.interest : Math.round(e.amount * 0.8);
					return p + Math.max(0, e.amount - interest);
				}, 0);
				var monthlyDraw = state.sources.reduce(function (w, s) {
					return s.linkedAssetId === a.id ? w + s.amount : w;
				}, 0);
				var projected;
				if (monthlyPrincipal > 0 && cfg.hasOwed) {
					projected = projectEquityAssetWithPaydown(
						a,
						rate / 100,
						YEARS,
						monthlyPrincipal,
					);
					if (monthlyDraw > 0) {
						projected = Math.max(0, projected - monthlyDraw * YEARS * 12);
					}
				} else if (monthlyDraw > 0) {
					projected = projectPortfolioWithWithdrawals(
						equity,
						rate / 100,
						YEARS,
						monthlyDraw,
					);
				} else {
					projected = projectPortfolio(equity, rate / 100, YEARS);
				}
				var delta = projected - equity;
				var deltaStr = (delta >= 0 ? "+" : "") + formatCompactCurrency(delta);
				var drawNote =
					monthlyDraw > 0
						? ' <span class="numbers-detail-draw">−' +
							formatCurrency(monthlyDraw) +
							"/mo withdrawal</span>"
						: "";
				var payNote =
					monthlyPrincipal > 0
						? ' <span class="numbers-detail-paydown">+' +
							formatCurrency(monthlyPrincipal) +
							"/mo principal</span>"
						: "";
				// amortization inline for real estate with a linked mortgage
				var linkedExpense =
					monthlyPrincipal > 0
						? state.expenses.find(function (e) {
								return e.type === "rent" && e.linkedAssetId === a.id;
							})
						: null;
				var amortHTML =
					linkedExpense && a.owed > 0 ? buildAmortHTML(a, linkedExpense) : "";
				return (
					'<div class="numbers-detail-row' +
					(amortHTML ? " numbers-detail-row--has-amort" : "") +
					'">' +
					'<div class="numbers-detail-top">' +
					'<div class="numbers-detail-left">' +
					'<span class="numbers-detail-name">' +
					(a.customLabel || cfg.label) +
					"</span>" +
					'<span class="numbers-detail-meta">' +
					formatCompactCurrency(equity) +
					" @ " +
					rate +
					"%/yr" +
					payNote +
					drawNote +
					"</span>" +
					"</div>" +
					'<div class="numbers-detail-right">' +
					'<span class="numbers-detail-projected">' +
					formatCompactCurrency(projected) +
					"</span>" +
					'<span class="numbers-detail-delta' +
					(delta >= 0 ? "" : " numbers-detail-delta--neg") +
					'">' +
					deltaStr +
					"</span>" +
					"</div>" +
					"</div>" +
					amortHTML +
					"</div>"
				);
			})
			.join("");

		var debtNote =
			totalDebt > 0
				? '<div class="numbers-detail-debt-row"><span>Debt (held flat)</span><span>−' +
					formatCompactCurrency(totalDebt) +
					"</span></div>"
				: "";

		projectionDetailEl.innerHTML =
			'<div class="numbers-detail-header">What\'s included · ' +
			YEARS +
			"yr horizon</div>" +
			(assetRows ||
				'<div class="numbers-detail-empty">No assets added yet.</div>') +
			debtNote;
	}

	// ─── Update view ─────────────────────────────────────────────────────────

	// updateStats: update hero numbers and bars without re-rendering the item lists
	var _statsRafId = null;
	function updateStats() {
		if (_statsRafId) {
			cancelAnimationFrame(_statsRafId);
		}
		_statsRafId = requestAnimationFrame(function () {
			_statsRafId = null;
			var totalIncome = getTotalIncome();
			var totalExpenses = getTotalExpenses();
			var totalEquity = getTotalAssetEquity();
			var totalDebt = getTotalDebt();
			var netWorth = totalEquity - totalDebt;
			var freeCash = totalIncome - totalExpenses;
			var projectedNet = projectAllAssets(YEARS) - totalDebt;

			incomePanelTotal.textContent = formatCurrency(totalIncome) + "/mo";
			spendingPanelTotal.textContent = formatCurrency(totalExpenses) + "/mo";
			assetsPanelTotal.textContent = formatCurrency(totalEquity) + " equity";
			debtPanelTotal.textContent =
				totalDebt > 0 ? "−" + formatCurrency(totalDebt) : "$0";

			netWorthHeroValueEl.textContent = formatCurrency(netWorth);
			projectedValueEl.textContent = formatCurrency(projectedNet);
			projectedValueEl.classList.toggle("is-negative", projectedNet < 0);
			if (projectionYearsLabelEl) {
				projectionYearsLabelEl.textContent = YEARS + " yrs";
			}
			totalIncomeValueEl.textContent = formatCurrency(totalIncome);
			expensesDisplayEl.textContent = formatCurrency(totalExpenses);
			freeCashEl.textContent = formatCurrency(freeCash);
			freeCashEl.classList.toggle("is-positive", freeCash > 0);
			freeCashEl.classList.toggle("is-negative", freeCash < 0);

			var nowVal =
				netWorth > 0 ? netWorth : totalEquity > 0 ? totalEquity : 100;
			scheduleChartUpdate(nowVal, totalDebt);
			persistState();
		});
	}

	var _chartRafId = null;
	function scheduleChartUpdate(nowVal, totalDebt) {
		if (_chartRafId !== null) {
			cancelAnimationFrame(_chartRafId);
		}
		_chartRafId = requestAnimationFrame(function () {
			_chartRafId = null;
			renderBars(nowVal, totalDebt);
			renderPlanAnalysis();
		});
	}

	function updateView() {
		var totalIncome = getTotalIncome();
		var totalExpenses = getTotalExpenses();
		var totalEquity = getTotalAssetEquity();
		var totalDebt = getTotalDebt();
		var netWorth = totalEquity - totalDebt;
		var freeCash = totalIncome - totalExpenses;

		// Project each asset at its own growth rate — debt assumed to stay flat (conservative)
		var projectedEquity = projectAllAssets(YEARS);
		var projectedNet = projectedEquity - totalDebt;

		// Panel totals
		incomePanelTotal.textContent = formatCurrency(totalIncome) + "/mo";
		spendingPanelTotal.textContent = formatCurrency(totalExpenses) + "/mo";
		assetsPanelTotal.textContent = formatCurrency(totalEquity) + " equity";
		debtPanelTotal.textContent =
			totalDebt > 0 ? "−" + formatCurrency(totalDebt) : "$0";

		refreshWithdrawalSelects();

		// Phone: hero
		netWorthHeroValueEl.textContent = formatCurrency(netWorth);
		projectedValueEl.textContent = formatCurrency(projectedNet);
		projectedValueEl.classList.toggle("is-negative", projectedNet < 0);
		if (projectionYearsLabelEl) {
			projectionYearsLabelEl.textContent = YEARS + " yrs";
		}

		totalIncomeValueEl.textContent = formatCurrency(totalIncome);
		expensesDisplayEl.textContent = formatCurrency(totalExpenses);
		freeCashEl.textContent = formatCurrency(freeCash);
		freeCashEl.classList.toggle("is-positive", freeCash > 0);
		freeCashEl.classList.toggle("is-negative", freeCash < 0);

		// Charts deferred to next animation frame so UI updates paint first
		var nowVal = netWorth > 0 ? netWorth : totalEquity > 0 ? totalEquity : 100;
		scheduleChartUpdate(nowVal, totalDebt);
		persistState();
	}

	// ─── Sheet events ────────────────────────────────────────────────────────

	openIncomeBtn.addEventListener("click", function () {
		openSheet(incomeSheet);
	});
	incomeSheetClose.addEventListener("click", function () {
		closeSheet(incomeSheet);
	});
	incomeSheetBackdrop.addEventListener("click", function () {
		closeSheet(incomeSheet);
	});

	openSpendingBtn.addEventListener("click", function () {
		openSheet(spendingSheet);
	});
	spendingSheetClose.addEventListener("click", function () {
		closeSheet(spendingSheet);
	});
	spendingSheetBackdrop.addEventListener("click", function () {
		closeSheet(spendingSheet);
	});

	openAssetsBtn.addEventListener("click", function () {
		openSheet(assetsSheet);
	});
	assetsSheetClose.addEventListener("click", function () {
		closeSheet(assetsSheet);
	});
	assetsSheetBackdrop.addEventListener("click", function () {
		closeSheet(assetsSheet);
	});

	openDebtBtn.addEventListener("click", function () {
		openSheet(debtSheet);
	});
	debtSheetClose.addEventListener("click", function () {
		closeSheet(debtSheet);
	});
	debtSheetBackdrop.addEventListener("click", function () {
		closeSheet(debtSheet);
	});

	// ─── Sheet name prompts ──────────────────────────────────────────────────

	var incomeNamePrompt = document.getElementById("incomeNamePrompt");
	var incomeNameInput = document.getElementById("incomeNameInput");
	var incomeNameConfirm = document.getElementById("incomeNameConfirm");
	var spendingNamePrompt = document.getElementById("spendingNamePrompt");
	var spendingNameInput = document.getElementById("spendingNameInput");
	var spendingNameConfirm = document.getElementById("spendingNameConfirm");
	var assetsNamePrompt = document.getElementById("assetsNamePrompt");
	var assetsNameInput = document.getElementById("assetsNameInput");
	var assetsNameConfirm = document.getElementById("assetsNameConfirm");
	var debtNamePrompt = document.getElementById("debtNamePrompt");
	var debtNameInput = document.getElementById("debtNameInput");
	var debtNameConfirm = document.getElementById("debtNameConfirm");

	function showNamePrompt(prompt, input) {
		prompt.hidden = false;
		input.value = "";
		setTimeout(function () {
			input.focus();
		}, 50);
	}

	function hideNamePrompt(prompt, input) {
		prompt.hidden = true;
		input.value = "";
	}

	incomeSheetGrid.addEventListener("click", function (e) {
		var btn = e.target.closest("[data-type]");
		if (!btn) {
			return;
		}
		var type = btn.dataset.type;
		if (type === "other") {
			showNamePrompt(incomeNamePrompt, incomeNameInput);
			return;
		}
		state.sources.push({
			id: state.nextSourceId,
			type: type,
			amount: sourceDefaults[type].defaultAmount,
			rateGrowth: 3,
		});
		state.nextSourceId += 1;
		closeSheet(incomeSheet);
		renderSources();
		updateView();
	});

	function confirmIncomeName() {
		var label = incomeNameInput.value.trim();
		var item = {
			id: state.nextSourceId,
			type: "other",
			amount: sourceDefaults.other.defaultAmount,
			rateGrowth: 3,
		};
		if (label) {
			item.customLabel = label;
		}
		state.sources.push(item);
		state.nextSourceId += 1;
		hideNamePrompt(incomeNamePrompt, incomeNameInput);
		closeSheet(incomeSheet);
		renderSources();
		updateView();
	}
	incomeNameConfirm.addEventListener("click", confirmIncomeName);
	incomeNameInput.addEventListener("keydown", function (e) {
		if (e.key === "Enter") {
			confirmIncomeName();
		}
	});

	spendingSheetGrid.addEventListener("click", function (e) {
		var btn = e.target.closest("[data-type]");
		if (!btn) {
			return;
		}
		var type = btn.dataset.type;
		if (type === "other") {
			showNamePrompt(spendingNamePrompt, spendingNameInput);
			return;
		}
		var newExpense = {
			id: state.nextExpenseId,
			type: type,
			amount: expenseDefaults[type].defaultAmount,
		};
		if (type === "rent") {
			newExpense.interest = Math.round(newExpense.amount * 0.8);
		}
		state.expenses.push(newExpense);
		state.nextExpenseId += 1;
		closeSheet(spendingSheet);
		renderExpenses();
		updateView();
	});

	function confirmSpendingName() {
		var label = spendingNameInput.value.trim();
		var item = {
			id: state.nextExpenseId,
			type: "other",
			amount: expenseDefaults.other.defaultAmount,
		};
		if (label) {
			item.customLabel = label;
		}
		state.expenses.push(item);
		state.nextExpenseId += 1;
		hideNamePrompt(spendingNamePrompt, spendingNameInput);
		closeSheet(spendingSheet);
		renderExpenses();
		updateView();
	}
	spendingNameConfirm.addEventListener("click", confirmSpendingName);
	spendingNameInput.addEventListener("keydown", function (e) {
		if (e.key === "Enter") {
			confirmSpendingName();
		}
	});

	assetsSheetGrid.addEventListener("click", function (e) {
		var btn = e.target.closest("[data-type]");
		if (!btn) {
			return;
		}
		var type = btn.dataset.type;
		if (type === "other") {
			showNamePrompt(assetsNamePrompt, assetsNameInput);
			return;
		}
		var cfg = assetDefaults[type];
		var newAsset = {
			id: state.nextAssetId,
			type: type,
			amount: cfg.defaultAmount,
			growthRate: cfg.defaultGrowth,
		};
		if (cfg.hasOwed) {
			newAsset.owed = cfg.defaultOwed;
		}
		state.assets.push(newAsset);
		state.nextAssetId += 1;
		closeSheet(assetsSheet);
		renderAssets();
		updateView();
	});

	function confirmAssetsName() {
		var label = assetsNameInput.value.trim();
		var cfg = assetDefaults.other;
		var item = {
			id: state.nextAssetId,
			type: "other",
			amount: cfg.defaultAmount,
			growthRate: cfg.defaultGrowth,
		};
		if (label) {
			item.customLabel = label;
		}
		state.assets.push(item);
		state.nextAssetId += 1;
		hideNamePrompt(assetsNamePrompt, assetsNameInput);
		closeSheet(assetsSheet);
		renderAssets();
		updateView();
	}
	assetsNameConfirm.addEventListener("click", confirmAssetsName);
	assetsNameInput.addEventListener("keydown", function (e) {
		if (e.key === "Enter") {
			confirmAssetsName();
		}
	});

	debtSheetGrid.addEventListener("click", function (e) {
		var btn = e.target.closest("[data-type]");
		if (!btn) {
			return;
		}
		var type = btn.dataset.type;
		if (type === "other") {
			showNamePrompt(debtNamePrompt, debtNameInput);
			return;
		}
		state.debts.push({
			id: state.nextDebtId,
			type: type,
			amount: debtDefaults[type].defaultAmount,
		});
		state.nextDebtId += 1;
		closeSheet(debtSheet);
		renderDebts();
		updateView();
	});

	function confirmDebtName() {
		var label = debtNameInput.value.trim();
		var item = {
			id: state.nextDebtId,
			type: "other",
			amount: debtDefaults.other.defaultAmount,
		};
		if (label) {
			item.customLabel = label;
		}
		state.debts.push(item);
		state.nextDebtId += 1;
		hideNamePrompt(debtNamePrompt, debtNameInput);
		closeSheet(debtSheet);
		renderDebts();
		updateView();
	}
	debtNameConfirm.addEventListener("click", confirmDebtName);
	debtNameInput.addEventListener("keydown", function (e) {
		if (e.key === "Enter") {
			confirmDebtName();
		}
	});

	// ─── Auto-persist ────────────────────────────────────────────────────────

	var STORAGE_KEY = "makeNumbers_state_v2";

	function persistState() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch (e) {}
	}

	function restoreState() {
		try {
			var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
			if (!saved) {
				return;
			}
			state.sources = saved.sources || state.sources;
			state.expenses = saved.expenses || state.expenses;
			state.assets = saved.assets || state.assets;
			state.debts = saved.debts || state.debts;
			state.nextSourceId = saved.nextSourceId || state.nextSourceId;
			state.nextExpenseId = saved.nextExpenseId || state.nextExpenseId;
			state.nextAssetId = saved.nextAssetId || state.nextAssetId;
			state.nextDebtId = saved.nextDebtId || state.nextDebtId;
		} catch (e) {}
	}

	// ─── Picker sliding indicator ─────────────────────────────────────────────

	function initPickerIndicator(picker) {
		var ind = document.createElement("span");
		ind.className = "numbers-picker-indicator";
		picker.insertBefore(ind, picker.firstChild);

		function snap(btn, animate) {
			if (!animate) {
				ind.style.transition = "none";
			}
			ind.style.width = btn.offsetWidth + "px";
			ind.style.height = btn.offsetHeight + "px";
			ind.style.transform =
				"translate(" + btn.offsetLeft + "px, " + btn.offsetTop + "px)";
			if (!animate) {
				ind.offsetHeight; // force reflow to apply no-transition snap
				ind.style.transition = "";
			}
		}

		var active = picker.querySelector(".is-active");
		if (active) {
			snap(active, false);
		}

		picker.addEventListener("click", function (e) {
			var btn = e.target.closest("button");
			if (!btn || !picker.contains(btn)) {
				return;
			}
			snap(btn, true);
		});
	}

	document
		.querySelectorAll(".numbers-year-picker")
		.forEach(initPickerIndicator);

	// ─── Year picker ─────────────────────────────────────────────────────────

	if (yearPickerEl) {
		yearPickerEl.addEventListener("click", function (e) {
			var btn = e.target.closest("[data-years]");
			if (!btn) {
				return;
			}
			YEARS = Number(btn.dataset.years);
			yearPickerEl.querySelectorAll(".numbers-year-btn").forEach(function (b) {
				b.classList.toggle("is-active", b === btn);
			});
			updateStats();
		});
	}

	// ─── Plan tab: Income vs. Spending analysis ───────────────────────────────

	function renderPlanAnalysis() {
		if (!planAnalysisEl) {
			return;
		}
		var PLAN_YRS = YEARS;
		var totalExpenses = getTotalExpenses();

		// ── Income per year (each source at its own growth rate) ──
		var incomeByYear = [];
		for (var yr = 0; yr <= PLAN_YRS; yr++) {
			incomeByYear.push(
				state.sources.reduce(function (sum, s) {
					var rate = (s.rateGrowth !== undefined ? s.rateGrowth : 3) / 100;
					return sum + s.amount * Math.pow(1 + rate, yr);
				}, 0),
			);
		}

		// ── Area chart ──
		var svgW = 300,
			svgH = 100,
			padT = 8,
			padB = 20;
		var chartH = svgH - padT - padB;
		var minV =
			Math.min(Math.min.apply(Math, incomeByYear), totalExpenses) * 0.88;
		var maxV =
			Math.max(Math.max.apply(Math, incomeByYear), totalExpenses) * 1.08;
		var vRange = Math.max(1, maxV - minV);

		function toX(n) {
			return Math.round((n / PLAN_YRS) * svgW);
		}
		function toY(v) {
			return Math.round(padT + chartH - ((v - minV) / vRange) * chartH);
		}

		var expY = toY(totalExpenses);
		var incomePts = incomeByYear
			.map(function (v, i) {
				return toX(i) + "," + toY(v);
			})
			.join(" ");
		// free-cash fill: income curve → expense line → close
		var areaFill = incomePts + " " + svgW + "," + expY + " 0," + expY;
		// expense fill (below expenses): expense line → bottom
		var expFill =
			"0," +
			expY +
			" " +
			svgW +
			"," +
			expY +
			" " +
			svgW +
			"," +
			(padT + chartH) +
			" 0," +
			(padT + chartH);

		// dynamic x-axis labels fitted to range
		var lblStep =
			PLAN_YRS <= 5 ? 1 : PLAN_YRS <= 10 ? 2 : PLAN_YRS <= 20 ? 5 : 10;
		var lblNums = [0];
		for (var lx = lblStep; lx <= PLAN_YRS; lx += lblStep) {
			lblNums.push(lx);
		}
		if (lblNums[lblNums.length - 1] !== PLAN_YRS) {
			lblNums.push(PLAN_YRS);
		}
		var labelsHTML = lblNums
			.map(function (n) {
				var anchor = n === 0 ? "start" : n === PLAN_YRS ? "end" : "middle";
				return (
					'<text x="' +
					toX(n) +
					'" y="' +
					(svgH - 4) +
					'" text-anchor="' +
					anchor +
					'" font-size="8" fill="rgba(0,0,0,0.3)">' +
					(n === 0 ? "Now" : "Yr " + n) +
					"</text>"
				);
			})
			.join("");

		// income/expense value labels at endpoints
		var endLblY0 = toY(incomeByYear[0]);
		var endLblYN = toY(incomeByYear[PLAN_YRS]);

		var svgHTML =
			'<svg class="numbers-plan-chart" viewBox="0 0 ' +
			svgW +
			" " +
			svgH +
			'" preserveAspectRatio="xMidYMid meet">' +
			// expense zone (soft red below)
			'<polygon points="' +
			expFill +
			'" fill="rgba(239,68,68,0.05)"/>' +
			// free-cash zone (green between income and expense)
			'<polygon points="' +
			areaFill +
			'" fill="rgba(34,197,94,0.12)"/>' +
			// expense dashed line
			'<line x1="0" y1="' +
			expY +
			'" x2="' +
			svgW +
			'" y2="' +
			expY +
			'" stroke="rgba(239,68,68,0.5)" stroke-width="1.5" stroke-dasharray="5,3"/>' +
			// income line
			'<polyline points="' +
			incomePts +
			'" fill="none" stroke="rgba(34,197,94,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
			// endpoint dots
			'<circle cx="0" cy="' +
			endLblY0 +
			'" r="3" fill="rgba(34,197,94,0.9)"/>' +
			'<circle cx="' +
			svgW +
			'" cy="' +
			endLblYN +
			'" r="3" fill="rgba(34,197,94,0.9)"/>' +
			labelsHTML +
			"</svg>";

		// ── Year table ──
		var tableHdr =
			'<div class="numbers-plan-yr-hdr"><span></span><span>Income</span><span>Expenses</span><span>Free</span></div>';
		var checkYrs = [
			1,
			Math.round(PLAN_YRS * 0.25),
			Math.round(PLAN_YRS * 0.5),
			Math.round(PLAN_YRS * 0.75),
			PLAN_YRS,
		].filter(function (n, i, a) {
			return n > 0 && n <= PLAN_YRS && a.indexOf(n) === i;
		});
		var tableRows = checkYrs
			.map(function (n) {
				var inc = incomeByYear[n];
				var free = inc - totalExpenses;
				return (
					'<div class="numbers-plan-yr-row">' +
					'<span class="numbers-plan-yr-label">Yr ' +
					n +
					"</span>" +
					'<span class="numbers-plan-yr-inc">' +
					formatCurrency(inc) +
					"</span>" +
					'<span class="numbers-plan-yr-exp">' +
					formatCurrency(totalExpenses) +
					"</span>" +
					'<span class="numbers-plan-yr-free ' +
					(free >= 0 ? "is-pos" : "is-neg") +
					'">' +
					(free >= 0 ? "+" : "") +
					formatCurrency(free) +
					"</span>" +
					"</div>"
				);
			})
			.join("");

		// ── Free cash accumulation callout ──
		var finalFree = incomeByYear[PLAN_YRS] - totalExpenses;
		var totalFreeCash = incomeByYear.reduce(function (sum, inc) {
			return sum + Math.max(0, inc - totalExpenses);
		}, 0);
		var freeCashHTML = "";
		if (totalFreeCash > 0) {
			freeCashHTML =
				'<div class="numbers-plan-freecash">' +
				'<div class="numbers-plan-freecash__lbl">Total free cash over ' +
				PLAN_YRS +
				" yrs</div>" +
				'<div class="numbers-plan-freecash__val">' +
				formatCompactCurrency(totalFreeCash) +
				"</div>" +
				'<div class="numbers-plan-freecash__sub">if saved in full · ' +
				formatCurrency(Math.max(0, finalFree)) +
				"/mo by yr " +
				PLAN_YRS +
				"</div>" +
				"</div>";
		}

		// ── Income source breakdown ──
		var srcRows = state.sources
			.map(function (s) {
				var rate = (s.rateGrowth !== undefined ? s.rateGrowth : 3) / 100;
				var projEnd = s.amount * Math.pow(1 + rate, PLAN_YRS);
				var cfg = sourceDefaults[s.type] || {};
				var lbl = s.customLabel || cfg.label || "Income";
				var rLbl =
					s.type === "ssdi" || s.type === "ssi" || s.type === "pension"
						? (s.rateGrowth !== undefined ? s.rateGrowth : 2.5) + "% COLA"
						: (s.rateGrowth !== undefined ? s.rateGrowth : 3) + "% raise";
				// share of current total income
				var totalNow = incomeByYear[0] || 1;
				var sharePct = Math.round((s.amount / totalNow) * 100);
				var delta = projEnd - s.amount;
				var deltaStr = (delta >= 0 ? "+" : "") + formatCompactCurrency(delta);
				return (
					'<div class="numbers-plan-src-row">' +
					'<div class="numbers-plan-src-header">' +
					'<span class="numbers-plan-src-name">' +
					lbl +
					"</span>" +
					'<span class="numbers-plan-src-pct">' +
					sharePct +
					"% of income</span>" +
					"</div>" +
					'<div class="numbers-plan-src-bar-wrap">' +
					'<div class="numbers-plan-src-bar" style="width:' +
					sharePct +
					'%"></div>' +
					"</div>" +
					'<div class="numbers-plan-src-footer">' +
					'<span class="numbers-plan-src-detail">' +
					formatCurrency(s.amount) +
					" → <strong>" +
					formatCurrency(projEnd) +
					"</strong></span>" +
					'<span class="numbers-plan-src-delta ' +
					(delta >= 0 ? "is-pos" : "is-neg") +
					'">' +
					deltaStr +
					" · " +
					rLbl +
					"</span>" +
					"</div>" +
					"</div>"
				);
			})
			.join("");

		// ── Expense breakdown ──
		var expRows = state.expenses
			.map(function (e) {
				var cfg = expenseDefaults[e.type] || {};
				var lbl = e.customLabel || cfg.label || "Expense";
				var pct =
					totalExpenses > 0 ? Math.round((e.amount / totalExpenses) * 100) : 0;
				return (
					'<div class="numbers-plan-exp-row">' +
					'<div class="numbers-plan-src-header">' +
					'<span class="numbers-plan-exp-name">' +
					lbl +
					"</span>" +
					'<span class="numbers-plan-src-pct">' +
					pct +
					"% of spending</span>" +
					"</div>" +
					'<div class="numbers-plan-src-bar-wrap">' +
					'<div class="numbers-plan-exp-bar" style="width:' +
					pct +
					'%"></div>' +
					"</div>" +
					'<div class="numbers-plan-src-footer">' +
					'<span class="numbers-plan-src-detail"><strong>' +
					formatCurrency(e.amount) +
					"</strong>/mo</span>" +
					"</div>" +
					"</div>"
				);
			})
			.join("");

		var html =
			'<div class="numbers-plan-analysis">' +
			// ① Chart
			'<div class="numbers-plan-analysis__hdr">' +
			'<span class="numbers-plan-analysis__title">Income vs. spending · ' +
			PLAN_YRS +
			" yrs</span>" +
			'<span class="numbers-plan-analysis__legend">' +
			'<span class="numbers-plan-dot numbers-plan-dot--inc"></span>Income ' +
			'<span class="numbers-plan-dot numbers-plan-dot--exp"></span>Expenses' +
			"</span>" +
			"</div>" +
			svgHTML +
			// ② Year table
			tableHdr +
			tableRows +
			// ③ Free cash callout
			freeCashHTML;

		// ④ Income sources
		if (state.sources.length) {
			html +=
				'<div class="numbers-plan-section-hdr">Income sources</div>' +
				'<div class="numbers-plan-srcs">' +
				srcRows +
				"</div>";
		}

		// ⑤ Expense breakdown
		if (state.expenses.length) {
			html +=
				'<div class="numbers-plan-section-hdr">Where it goes</div>' +
				'<div class="numbers-plan-exps">' +
				expRows +
				"</div>";
		}

		html += "</div>";
		planAnalysisEl.innerHTML = html;
	}

	// ─── Reorder mode ────────────────────────────────────────────────────────

	document.querySelectorAll(".numbers-reorder-btn").forEach(function (btn) {
		btn.addEventListener("click", function () {
			var list = document.getElementById(btn.dataset.reorderList);
			if (!list) {
				return;
			}
			var isOn = list.classList.toggle("is-reordering");
			btn.classList.toggle("is-active", isOn);
			btn.textContent = isOn ? "Done" : "Reorder";
			var panel = btn.closest(".numbers-panel");
			if (panel) {
				panel.classList.toggle("is-reordering", isOn);
			}
			document.body.classList.toggle("is-reordering", isOn);
			if (isOn) {
				lockScroll();
			} else {
				unlockScroll();
			}
		});
	});

	// ─── Tab navigation ──────────────────────────────────────────────────────

	var activeTab = "tabInvest";

	function switchTab(tabId) {
		activeTab = tabId;
		document.querySelectorAll(".numbers-tab-view").forEach(function (el) {
			el.classList.toggle("is-active", el.id === tabId);
		});
		document.querySelectorAll(".numbers-nav-btn").forEach(function (btn) {
			btn.classList.toggle("is-active", btn.dataset.tab === tabId);
		});
		if (tabId === "tabIncome") {
			renderPlanAnalysis();
		}
		if (tabId === "tabInvest") {
			updateStats();
		}
	}

	document
		.querySelectorAll(".numbers-nav-btn[data-tab]")
		.forEach(function (btn) {
			btn.addEventListener("click", function () {
				switchTab(btn.dataset.tab);
			});
		});

	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") {
			closeSheet(incomeSheet);
			closeSheet(spendingSheet);
			closeSheet(assetsSheet);
			closeSheet(debtSheet);
		}
	});

	// Init — restore persisted state then render
	restoreState();
	renderSources();
	renderExpenses();
	renderAssets();
	renderDebts();
	updateView();
})();
