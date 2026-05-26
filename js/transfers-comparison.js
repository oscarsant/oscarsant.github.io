(function () {
	// ─── Season data (Transfermarkt, all fees in €m) ───────────────────────────
	const seasonData = {
		"12/13": {
			atletico: {
				expenditure: 4.5,
				income: 19.35,
				arrivals: 14,
				departures: 16,
			},
			barcelona: { expenditure: 33.0, income: 0.5, arrivals: 7, departures: 5 },
			realMadrid: {
				expenditure: 38.5,
				income: 33.5,
				arrivals: 8,
				departures: 7,
			},
		},
		"13/14": {
			atletico: {
				expenditure: 36.0,
				income: 70.6,
				arrivals: 21,
				departures: 18,
			},
			barcelona: {
				expenditure: 101.0,
				income: 28.1,
				arrivals: 9,
				departures: 7,
			},
			realMadrid: {
				expenditure: 175.5,
				income: 113.5,
				arrivals: 10,
				departures: 10,
			},
		},
		"14/15": {
			atletico: {
				expenditure: 118.95,
				income: 89.3,
				arrivals: 24,
				departures: 23,
			},
			barcelona: {
				expenditure: 166.72,
				income: 81.8,
				arrivals: 13,
				departures: 15,
			},
			realMadrid: {
				expenditure: 126.0,
				income: 112.1,
				arrivals: 8,
				departures: 8,
			},
		},
		"15/16": {
			atletico: {
				expenditure: 143.61,
				income: 162.0,
				arrivals: 21,
				departures: 23,
			},
			barcelona: {
				expenditure: 51.0,
				income: 38.3,
				arrivals: 11,
				departures: 9,
			},
			realMadrid: {
				expenditure: 100.4,
				income: 24.15,
				arrivals: 12,
				departures: 12,
			},
		},
		"16/17": {
			atletico: {
				expenditure: 79.0,
				income: 42.0,
				arrivals: 22,
				departures: 21,
			},
			barcelona: {
				expenditure: 124.75,
				income: 33.8,
				arrivals: 11,
				departures: 13,
			},
			realMadrid: {
				expenditure: 30.0,
				income: 37.5,
				arrivals: 14,
				departures: 12,
			},
		},
		"17/18": {
			atletico: {
				expenditure: 102.0,
				income: 103.25,
				arrivals: 16,
				departures: 20,
			},
			barcelona: {
				expenditure: 388.1,
				income: 232.5,
				arrivals: 13,
				departures: 12,
			},
			realMadrid: {
				expenditure: 40.5,
				income: 132.5,
				arrivals: 9,
				departures: 10,
			},
		},
		"18/19": {
			atletico: {
				expenditure: 168.0,
				income: 57.9,
				arrivals: 20,
				departures: 15,
			},
			barcelona: {
				expenditure: 141.1,
				income: 146.05,
				arrivals: 19,
				departures: 18,
			},
			realMadrid: {
				expenditure: 164.75,
				income: 136.1,
				arrivals: 16,
				departures: 14,
			},
		},
		"19/20": {
			atletico: {
				expenditure: 243.5,
				income: 313.1,
				arrivals: 19,
				departures: 19,
			},
			barcelona: {
				expenditure: 304.0,
				income: 154.4,
				arrivals: 20,
				departures: 22,
			},
			realMadrid: {
				expenditure: 361.3,
				income: 136.8,
				arrivals: 22,
				departures: 19,
			},
		},
		"20/21": {
			atletico: {
				expenditure: 82.0,
				income: 72.8,
				arrivals: 14,
				departures: 14,
			},
			barcelona: {
				expenditure: 111.94,
				income: 154.4,
				arrivals: 18,
				departures: 14,
			},
			realMadrid: {
				expenditure: 0,
				income: 108.2,
				arrivals: 14,
				departures: 18,
			},
		},
		"21/22": {
			atletico: {
				expenditure: 80.7,
				income: 23.75,
				arrivals: 19,
				departures: 19,
			},
			barcelona: {
				expenditure: 69.5,
				income: 95.36,
				arrivals: 20,
				departures: 18,
			},
			realMadrid: {
				expenditure: 31.0,
				income: 78.0,
				arrivals: 10,
				departures: 7,
			},
		},
		"22/23": {
			atletico: {
				expenditure: 29.5,
				income: 20.25,
				arrivals: 22,
				departures: 21,
			},
			barcelona: {
				expenditure: 159.0,
				income: 39.5,
				arrivals: 16,
				departures: 22,
			},
			realMadrid: {
				expenditure: 80.0,
				income: 99.15,
				arrivals: 11,
				departures: 12,
			},
		},
		"23/24": {
			atletico: {
				expenditure: 52.5,
				income: 95.5,
				arrivals: 25,
				departures: 22,
			},
			barcelona: {
				expenditure: 33.4,
				income: 131.7,
				arrivals: 22,
				departures: 19,
			},
			realMadrid: {
				expenditure: 161.5,
				income: 7.0,
				arrivals: 8,
				departures: 9,
			},
		},
		"24/25": {
			atletico: {
				expenditure: 185.0,
				income: 93.9,
				arrivals: 18,
				departures: 19,
			},
			barcelona: {
				expenditure: 60.5,
				income: 66.8,
				arrivals: 19,
				departures: 15,
			},
			realMadrid: {
				expenditure: 49.0,
				income: 16.0,
				arrivals: 10,
				departures: 10,
			},
		},
		"25/26": {
			atletico: {
				expenditure: 229.95,
				income: 145.5,
				arrivals: 19,
				departures: 19,
				avgArrivalAge: 25.0,
				avgDepartureAge: 28.3,
				highlights: {
					topArrival: "Alex Baena (€42.0m)",
					topDeparture: "Conor Gallagher (€40.0m)",
				},
			},
			barcelona: {
				expenditure: 27.5,
				income: 31.2,
				arrivals: 10,
				departures: 13,
				avgArrivalAge: 24.1,
				avgDepartureAge: 24.6,
				highlights: {
					topArrival: "Joan Garcia (€25.0m)",
					topDeparture: "Pau Victor (€12.0m)",
				},
			},
			realMadrid: {
				expenditure: 167.5,
				income: 2.0,
				arrivals: 8,
				departures: 7,
				avgArrivalAge: 21.0,
				avgDepartureAge: 26.4,
				highlights: {
					topArrival: "Dean Huijsen (€62.5m)",
					topDeparture: "Alvaro Rodriguez (€2.0m)",
				},
			},
		},
	};

	// Historical comparison data for the first chart only (02/03 onward).
	const chartSeasonData = {
		"02/03": {
			atletico: { expenditure: 35, income: 8.1, arrivals: 20, departures: 19 },
			barcelona: {
				expenditure: 20,
				income: 11.55,
				arrivals: 11,
				departures: 10,
			},
			realMadrid: {
				expenditure: 45,
				income: 5.2,
				arrivals: 14,
				departures: 13,
			},
			villarreal: {
				expenditure: 6.85,
				income: 0.06,
				arrivals: 12,
				departures: 15,
			},
			valencia: { expenditure: 0, income: 1.5, arrivals: 9, departures: 11 },
			sevilla: { expenditure: 2.83, income: 0, arrivals: 8, departures: 13 },
		},
		"03/04": {
			atletico: {
				expenditure: 12.8,
				income: 0.25,
				arrivals: 23,
				departures: 24,
			},
			barcelona: {
				expenditure: 43.85,
				income: 2.9,
				arrivals: 13,
				departures: 13,
			},
			realMadrid: {
				expenditure: 37.5,
				income: 35.8,
				arrivals: 12,
				departures: 16,
			},
			villarreal: {
				expenditure: 12.05,
				income: 4,
				arrivals: 12,
				departures: 12,
			},
			valencia: { expenditure: 8.5, income: 4.5, arrivals: 11, departures: 10 },
			sevilla: { expenditure: 8.2, income: 20, arrivals: 13, departures: 9 },
		},
		"04/05": {
			atletico: { expenditure: 17.6, income: 0, arrivals: 21, departures: 22 },
			barcelona: {
				expenditure: 78.5,
				income: 14.75,
				arrivals: 15,
				departures: 16,
			},
			realMadrid: {
				expenditure: 58.7,
				income: 9.25,
				arrivals: 10,
				departures: 11,
			},
			villarreal: {
				expenditure: 15.8,
				income: 9.73,
				arrivals: 12,
				departures: 10,
			},
			valencia: { expenditure: 40, income: 8, arrivals: 16, departures: 19 },
			sevilla: { expenditure: 11.53, income: 0, arrivals: 14, departures: 12 },
		},
		"05/06": {
			atletico: { expenditure: 25, income: 5.3, arrivals: 18, departures: 18 },
			barcelona: { expenditure: 0, income: 11, arrivals: 8, departures: 9 },
			realMadrid: {
				expenditure: 89.5,
				income: 43.1,
				arrivals: 16,
				departures: 10,
			},
			villarreal: {
				expenditure: 19.9,
				income: 13.35,
				arrivals: 10,
				departures: 8,
			},
			valencia: {
				expenditure: 24.81,
				income: 13.9,
				arrivals: 24,
				departures: 19,
			},
			sevilla: { expenditure: 23, income: 48.2, arrivals: 9, departures: 14 },
		},
		"06/07": {
			atletico: { expenditure: 58.43, income: 7, arrivals: 20, departures: 20 },
			barcelona: { expenditure: 31, income: 13.2, arrivals: 8, departures: 8 },
			realMadrid: {
				expenditure: 103,
				income: 15.35,
				arrivals: 13,
				departures: 17,
			},
			villarreal: {
				expenditure: 31.04,
				income: 5.3,
				arrivals: 14,
				departures: 11,
			},
			valencia: {
				expenditure: 49.8,
				income: 20.83,
				arrivals: 18,
				departures: 17,
			},
			sevilla: { expenditure: 18.7, income: 1.5, arrivals: 13, departures: 13 },
		},
		"07/08": {
			atletico: {
				expenditure: 80.5,
				income: 52.1,
				arrivals: 17,
				departures: 16,
			},
			barcelona: { expenditure: 68.5, income: 14, arrivals: 11, departures: 8 },
			realMadrid: {
				expenditure: 118,
				income: 42.4,
				arrivals: 18,
				departures: 18,
			},
			villarreal: {
				expenditure: 40,
				income: 50.45,
				arrivals: 21,
				departures: 24,
			},
			valencia: {
				expenditure: 72.15,
				income: 7.6,
				arrivals: 21,
				departures: 20,
			},
			sevilla: { expenditure: 29, income: 21.1, arrivals: 19, departures: 15 },
		},
		"08/09": {
			atletico: {
				expenditure: 26.5,
				income: 3.45,
				arrivals: 13,
				departures: 15,
			},
			barcelona: {
				expenditure: 96,
				income: 54.59,
				arrivals: 9,
				departures: 11,
			},
			realMadrid: {
				expenditure: 82.2,
				income: 71,
				arrivals: 12,
				departures: 11,
			},
			villarreal: {
				expenditure: 26.17,
				income: 24.5,
				arrivals: 16,
				departures: 17,
			},
			valencia: {
				expenditure: 6.6,
				income: 11.3,
				arrivals: 22,
				departures: 21,
			},
			sevilla: {
				expenditure: 37.7,
				income: 60.55,
				arrivals: 14,
				departures: 15,
			},
		},
		"09/10": {
			atletico: {
				expenditure: 17.25,
				income: 17.9,
				arrivals: 15,
				departures: 15,
			},
			barcelona: {
				expenditure: 113.5,
				income: 24.5,
				arrivals: 7,
				departures: 9,
			},
			realMadrid: {
				expenditure: 258.5,
				income: 88.5,
				arrivals: 10,
				departures: 14,
			},
			villarreal: {
				expenditure: 22.9,
				income: 11.75,
				arrivals: 11,
				departures: 15,
			},
			valencia: { expenditure: 5, income: 20.63, arrivals: 16, departures: 17 },
			sevilla: {
				expenditure: 27.5,
				income: 12.8,
				arrivals: 11,
				departures: 11,
			},
		},
		"10/11": {
			atletico: {
				expenditure: 34.05,
				income: 23.9,
				arrivals: 10,
				departures: 12,
			},
			barcelona: {
				expenditure: 72.5,
				income: 52.7,
				arrivals: 9,
				departures: 9,
			},
			realMadrid: { expenditure: 93, income: 10.5, arrivals: 7, departures: 6 },
			villarreal: {
				expenditure: 4.25,
				income: 15.82,
				arrivals: 18,
				departures: 14,
			},
			valencia: {
				expenditure: 27.85,
				income: 84.35,
				arrivals: 16,
				departures: 16,
			},
			sevilla: {
				expenditure: 17.1,
				income: 29.6,
				arrivals: 16,
				departures: 16,
			},
		},
		"11/12": {
			atletico: {
				expenditure: 85.2,
				income: 85.35,
				arrivals: 20,
				departures: 20,
			},
			barcelona: {
				expenditure: 60,
				income: 46.95,
				arrivals: 12,
				departures: 10,
			},
			realMadrid: { expenditure: 56, income: 8, arrivals: 6, departures: 7 },
			villarreal: {
				expenditure: 31.3,
				income: 26.85,
				arrivals: 16,
				departures: 14,
			},
			valencia: { expenditure: 34, income: 32.9, arrivals: 15, departures: 15 },
			sevilla: { expenditure: 19, income: 15.7, arrivals: 18, departures: 20 },
		},
		"12/13": {
			atletico: {
				expenditure: 4.5,
				income: 21.35,
				arrivals: 14,
				departures: 16,
			},
			barcelona: { expenditure: 33, income: 0.5, arrivals: 7, departures: 5 },
			realMadrid: {
				expenditure: 38.5,
				income: 33.5,
				arrivals: 8,
				departures: 7,
			},
			villarreal: {
				expenditure: 2.1,
				income: 49.88,
				arrivals: 26,
				departures: 25,
			},
			valencia: { expenditure: 23.2, income: 30, arrivals: 10, departures: 14 },
			sevilla: { expenditure: 14, income: 12.2, arrivals: 15, departures: 15 },
		},
		"13/14": {
			atletico: {
				expenditure: 36.1,
				income: 70.7,
				arrivals: 21,
				departures: 18,
			},
			barcelona: { expenditure: 101, income: 28.1, arrivals: 9, departures: 7 },
			realMadrid: {
				expenditure: 175.5,
				income: 113.5,
				arrivals: 10,
				departures: 10,
			},
			villarreal: {
				expenditure: 17.45,
				income: 10.5,
				arrivals: 14,
				departures: 17,
			},
			valencia: {
				expenditure: 22.47,
				income: 47.1,
				arrivals: 15,
				departures: 14,
			},
			sevilla: {
				expenditure: 35.3,
				income: 90.98,
				arrivals: 27,
				departures: 26,
			},
		},
		"14/15": {
			atletico: {
				expenditure: 144.35,
				income: 89.3,
				arrivals: 24,
				departures: 23,
			},
			barcelona: {
				expenditure: 166.72,
				income: 81.8,
				arrivals: 13,
				departures: 15,
			},
			realMadrid: {
				expenditure: 126,
				income: 112.1,
				arrivals: 8,
				departures: 8,
			},
			villarreal: {
				expenditure: 18.7,
				income: 22.5,
				arrivals: 14,
				departures: 14,
			},
			valencia: {
				expenditure: 55.05,
				income: 55.45,
				arrivals: 23,
				departures: 24,
			},
			sevilla: {
				expenditure: 20.95,
				income: 50.55,
				arrivals: 25,
				departures: 21,
			},
		},
		"15/16": {
			atletico: { expenditure: 119, income: 152, arrivals: 21, departures: 23 },
			barcelona: { expenditure: 51, income: 38.3, arrivals: 11, departures: 9 },
			realMadrid: {
				expenditure: 100.4,
				income: 24.15,
				arrivals: 12,
				departures: 12,
			},
			villarreal: {
				expenditure: 47.2,
				income: 37.56,
				arrivals: 19,
				departures: 18,
			},
			valencia: {
				expenditure: 143.9,
				income: 50,
				arrivals: 20,
				departures: 15,
			},
			sevilla: { expenditure: 44, income: 61.45, arrivals: 22, departures: 20 },
		},
		"16/17": {
			atletico: { expenditure: 78.8, income: 44, arrivals: 22, departures: 21 },
			barcelona: {
				expenditure: 124.75,
				income: 33.8,
				arrivals: 11,
				departures: 13,
			},
			realMadrid: {
				expenditure: 30,
				income: 37.5,
				arrivals: 14,
				departures: 12,
			},
			villarreal: {
				expenditure: 55.95,
				income: 67.25,
				arrivals: 21,
				departures: 19,
			},
			valencia: {
				expenditure: 36,
				income: 121.9,
				arrivals: 16,
				departures: 18,
			},
			sevilla: {
				expenditure: 81.7,
				income: 93.45,
				arrivals: 17,
				departures: 18,
			},
		},
		"17/18": {
			atletico: {
				expenditure: 95.6,
				income: 104,
				arrivals: 16,
				departures: 20,
			},
			barcelona: {
				expenditure: 388.1,
				income: 232.5,
				arrivals: 13,
				departures: 12,
			},
			realMadrid: {
				expenditure: 40.5,
				income: 132.5,
				arrivals: 9,
				departures: 10,
			},
			villarreal: {
				expenditure: 46.1,
				income: 68,
				arrivals: 16,
				departures: 14,
			},
			valencia: {
				expenditure: 55,
				income: 16.55,
				arrivals: 23,
				departures: 22,
			},
			sevilla: {
				expenditure: 78.05,
				income: 81.6,
				arrivals: 17,
				departures: 15,
			},
		},
		"18/19": {
			atletico: {
				expenditure: 168,
				income: 57.9,
				arrivals: 20,
				departures: 15,
			},
			barcelona: {
				expenditure: 141.1,
				income: 146.05,
				arrivals: 19,
				departures: 18,
			},
			realMadrid: {
				expenditure: 164.75,
				income: 136.1,
				arrivals: 16,
				departures: 14,
			},
			villarreal: {
				expenditure: 92.9,
				income: 54.8,
				arrivals: 23,
				departures: 21,
			},
			valencia: {
				expenditure: 129.2,
				income: 68.8,
				arrivals: 22,
				departures: 22,
			},
			sevilla: {
				expenditure: 81.05,
				income: 93.8,
				arrivals: 20,
				departures: 21,
			},
		},
		"19/20": {
			atletico: {
				expenditure: 247.35,
				income: 316.3,
				arrivals: 19,
				departures: 19,
			},
			barcelona: {
				expenditure: 304,
				income: 154.4,
				arrivals: 20,
				departures: 22,
			},
			realMadrid: {
				expenditure: 361.3,
				income: 136.8,
				arrivals: 22,
				departures: 19,
			},
			villarreal: {
				expenditure: 45.8,
				income: 69.3,
				arrivals: 19,
				departures: 20,
			},
			valencia: { expenditure: 75, income: 56.3, arrivals: 24, departures: 19 },
			sevilla: {
				expenditure: 188.73,
				income: 131.4,
				arrivals: 30,
				departures: 29,
			},
		},
		"20/21": {
			atletico: { expenditure: 92, income: 83.3, arrivals: 14, departures: 14 },
			barcelona: {
				expenditure: 111.94,
				income: 154.4,
				arrivals: 18,
				departures: 14,
			},
			realMadrid: {
				expenditure: 0,
				income: 108.2,
				arrivals: 14,
				departures: 18,
			},
			villarreal: {
				expenditure: 37.84,
				income: 26.65,
				arrivals: 24,
				departures: 20,
			},
			valencia: {
				expenditure: 0.05,
				income: 88.85,
				arrivals: 14,
				departures: 13,
			},
			sevilla: {
				expenditure: 74.35,
				income: 19.68,
				arrivals: 22,
				departures: 19,
			},
		},
		"21/22": {
			atletico: {
				expenditure: 85.7,
				income: 22.75,
				arrivals: 19,
				departures: 19,
			},
			barcelona: {
				expenditure: 69.5,
				income: 95.36,
				arrivals: 20,
				departures: 18,
			},
			realMadrid: { expenditure: 31, income: 78, arrivals: 10, departures: 7 },
			villarreal: {
				expenditure: 54.5,
				income: 15.34,
				arrivals: 20,
				departures: 18,
			},
			valencia: {
				expenditure: 16.35,
				income: 2.7,
				arrivals: 15,
				departures: 15,
			},
			sevilla: {
				expenditure: 41.5,
				income: 28.5,
				arrivals: 17,
				departures: 17,
			},
		},
		"22/23": {
			atletico: {
				expenditure: 29.5,
				income: 28.25,
				arrivals: 22,
				departures: 21,
			},
			barcelona: {
				expenditure: 159,
				income: 39.5,
				arrivals: 16,
				departures: 22,
			},
			realMadrid: {
				expenditure: 80,
				income: 99.15,
				arrivals: 11,
				departures: 12,
			},
			villarreal: {
				expenditure: 6.48,
				income: 31.6,
				arrivals: 16,
				departures: 17,
			},
			valencia: {
				expenditure: 12.5,
				income: 54.6,
				arrivals: 14,
				departures: 15,
			},
			sevilla: {
				expenditure: 30.4,
				income: 91.5,
				arrivals: 23,
				departures: 23,
			},
		},
		"23/24": {
			atletico: {
				expenditure: 56.5,
				income: 103.1,
				arrivals: 25,
				departures: 22,
			},
			barcelona: {
				expenditure: 33.4,
				income: 131.7,
				arrivals: 22,
				departures: 19,
			},
			realMadrid: { expenditure: 161.5, income: 7, arrivals: 8, departures: 9 },
			villarreal: {
				expenditure: 12.5,
				income: 113,
				arrivals: 17,
				departures: 14,
			},
			valencia: {
				expenditure: 10.4,
				income: 28.9,
				arrivals: 16,
				departures: 17,
			},
			sevilla: { expenditure: 32, income: 26.6, arrivals: 25, departures: 21 },
		},
		"24/25": {
			atletico: {
				expenditure: 188,
				income: 114.98,
				arrivals: 18,
				departures: 19,
			},
			barcelona: {
				expenditure: 66.5,
				income: 66.8,
				arrivals: 19,
				departures: 15,
			},
			realMadrid: { expenditure: 49, income: 16, arrivals: 10, departures: 10 },
			villarreal: {
				expenditure: 69,
				income: 74.5,
				arrivals: 22,
				departures: 25,
			},
			valencia: { expenditure: 2.87, income: 30, arrivals: 15, departures: 12 },
			sevilla: { expenditure: 20, income: 32.85, arrivals: 19, departures: 25 },
		},
		"25/26": {
			atletico: {
				expenditure: 230.95,
				income: 145.5,
				arrivals: 19,
				departures: 18,
			},
			barcelona: {
				expenditure: 27.5,
				income: 31.2,
				arrivals: 10,
				departures: 13,
			},
			realMadrid: { expenditure: 167.5, income: 2, arrivals: 8, departures: 7 },
			villarreal: {
				expenditure: 105.5,
				income: 108,
				arrivals: 21,
				departures: 19,
			},
			valencia: {
				expenditure: 16.5,
				income: 26.13,
				arrivals: 19,
				departures: 18,
			},
			sevilla: { expenditure: 0.25, income: 55, arrivals: 18, departures: 12 },
		},
	};

	// Fee-only movement counts from Transfermarkt transfer tables (paid transfers only)
	const seasonFeeMovementData = {
		"12/13": {
			atletico: { arrivals: 2, departures: 3 },
			barcelona: { arrivals: 2, departures: 1 },
			realMadrid: { arrivals: 2, departures: 7 },
		},
		"13/14": {
			atletico: { arrivals: 8, departures: 7 },
			barcelona: { arrivals: 2, departures: 3 },
			realMadrid: { arrivals: 5, departures: 5 },
		},
		"14/15": {
			atletico: { arrivals: 12, departures: 8 },
			barcelona: { arrivals: 7, departures: 5 },
			realMadrid: { arrivals: 5, departures: 6 },
		},
		"15/16": {
			atletico: { arrivals: 9, departures: 8 },
			barcelona: { arrivals: 2, departures: 4 },
			realMadrid: { arrivals: 7, departures: 3 },
		},
		"16/17": {
			atletico: { arrivals: 5, departures: 6 },
			barcelona: { arrivals: 6, departures: 5 },
			realMadrid: { arrivals: 1, departures: 5 },
		},
		"17/18": {
			atletico: { arrivals: 2, departures: 9 },
			barcelona: { arrivals: 7, departures: 4 },
			realMadrid: { arrivals: 2, departures: 8 },
		},
		"18/19": {
			atletico: { arrivals: 9, departures: 5 },
			barcelona: { arrivals: 8, departures: 12 },
			realMadrid: { arrivals: 8, departures: 7 },
		},
		"19/20": {
			atletico: { arrivals: 8, departures: 8 },
			barcelona: { arrivals: 8, departures: 12 },
			realMadrid: { arrivals: 8, departures: 7 },
		},
		"20/21": {
			atletico: { arrivals: 6, departures: 6 },
			barcelona: { arrivals: 3, departures: 9 },
			realMadrid: { arrivals: 0, departures: 13 },
		},
		"21/22": {
			atletico: { arrivals: 5, departures: 4 },
			barcelona: { arrivals: 3, departures: 9 },
			realMadrid: { arrivals: 1, departures: 3 },
		},
		"22/23": {
			atletico: { arrivals: 3, departures: 6 },
			barcelona: { arrivals: 4, departures: 6 },
			realMadrid: { arrivals: 1, departures: 5 },
		},
		"23/24": {
			atletico: { arrivals: 6, departures: 7 },
			barcelona: { arrivals: 2, departures: 7 },
			realMadrid: { arrivals: 5, departures: 2 },
		},
		"24/25": {
			atletico: { arrivals: 6, departures: 8 },
			barcelona: { arrivals: 2, departures: 7 },
			realMadrid: { arrivals: 2, departures: 3 },
		},
		"25/26": {
			atletico: { arrivals: 13, departures: 9 },
			barcelona: { arrivals: 2, departures: 4 },
			realMadrid: { arrivals: 4, departures: 1 },
		},
	};

	// ─── Ordered season keys ────────────────────────────────────────────────────
	const SEASONS = Object.keys(seasonData);

	// ─── Club metadata ───────────────────────────────────────────────────────
	const clubs = [
		{ id: "atletico", key: "atletico", name: "Atletico", color: "#2F80ED" },
		{ id: "barcelona", key: "barcelona", name: "Barcelona", color: "#9B51E0" },
		{
			id: "real-madrid",
			key: "realMadrid",
			name: "Real Madrid",
			color: "#F2994A",
		},
	];

	const referenceClubs = [
		{
			id: "villarreal",
			key: "villarreal",
			name: "Villarreal",
			color: "#F2C94C",
			isReference: true,
		},
		{
			id: "valencia",
			key: "valencia",
			name: "Valencia",
			color: "#56CCF2",
			isReference: true,
		},
		{
			id: "sevilla",
			key: "sevilla",
			name: "Sevilla",
			color: "#EB5757",
			isReference: true,
		},
	];

	const chartClubs = clubs.concat(referenceClubs);
	const CHART_SEASONS = Object.keys(chartSeasonData);

	const salaryData = [
		{
			player: "Jan Oblak",
			clubKey: "atletico",
			salary: 20.83,
			bonus: 5.21,
			status: "active",
		},
		{
			player: "Ademola Lookman",
			clubKey: "atletico",
			salary: 12.5,
			bonus: 3.13,
			status: "active",
		},
		{
			player: "Julian Alvarez",
			clubKey: "atletico",
			salary: 12.5,
			bonus: 3.13,
			status: "active",
		},
		{
			player: "Antoine Griezmann",
			clubKey: "atletico",
			salary: 9.38,
			bonus: 2.35,
			status: "active",
		},
		{
			player: "Marcos Llorente",
			clubKey: "atletico",
			salary: 8.33,
			bonus: 2.08,
			status: "active",
		},
		{
			player: "Alex Baena",
			clubKey: "atletico",
			salary: 8.33,
			bonus: 2.08,
			status: "active",
		},
		{
			player: "Nicolas Gonzalez",
			clubKey: "atletico",
			salary: 7.5,
			bonus: 1.88,
			status: "loan",
		},
		{
			player: "Alexander Sorloth",
			clubKey: "atletico",
			salary: 7.29,
			bonus: 1.83,
			status: "active",
		},
		{
			player: "Clement Lenglet",
			clubKey: "atletico",
			salary: 7.29,
			bonus: 1.83,
			status: "active",
		},
		{
			player: "Koke",
			clubKey: "atletico",
			salary: 6.67,
			bonus: 1.67,
			status: "active",
		},
		{
			player: "David Hancko",
			clubKey: "atletico",
			salary: 6.67,
			bonus: 1.67,
			status: "active",
		},
		{
			player: "Pablo Barrios",
			clubKey: "atletico",
			salary: 6.25,
			bonus: 1.56,
			status: "active",
		},
		{
			player: "Jose Gimenez",
			clubKey: "atletico",
			salary: 6.25,
			bonus: 1.56,
			status: "active",
		},
		{
			player: "Robin Le Normand",
			clubKey: "atletico",
			salary: 6.25,
			bonus: 1.56,
			status: "active",
		},
		{
			player: "Thiago Almada",
			clubKey: "atletico",
			salary: 5.21,
			bonus: 1.29,
			status: "active",
		},
		{
			player: "Johnny",
			clubKey: "atletico",
			salary: 4.17,
			bonus: 1.04,
			status: "active",
		},
		{
			player: "Nahuel Molina",
			clubKey: "atletico",
			salary: 3.75,
			bonus: 0.94,
			status: "active",
		},
		{
			player: "Giuliano Simeone",
			clubKey: "atletico",
			salary: 3.75,
			bonus: 0.94,
			status: "active",
		},
		{
			player: "Juan Musso",
			clubKey: "atletico",
			salary: 3.33,
			bonus: 0.83,
			status: "active",
		},
		{
			player: "Matteo Ruggeri",
			clubKey: "atletico",
			salary: 2.08,
			bonus: 0.52,
			status: "active",
		},
		{
			player: "Robert Lewandowski",
			clubKey: "barcelona",
			salary: 20.83,
			bonus: 5.21,
			status: "active",
		},
		{
			player: "Frenkie de Jong",
			clubKey: "barcelona",
			salary: 19.0,
			bonus: 6.21,
			status: "active",
		},
		{
			player: "Lamine Yamal",
			clubKey: "barcelona",
			salary: 16.67,
			bonus: 10.42,
			status: "active",
		},
		{
			player: "Raphinha",
			clubKey: "barcelona",
			salary: 16.67,
			bonus: 4.17,
			status: "active",
		},
		{
			player: "Jules Kounde",
			clubKey: "barcelona",
			salary: 15.63,
			bonus: 3.92,
			status: "active",
		},
		{
			player: "Marc-Andre ter Stegen",
			clubKey: "barcelona",
			salary: 15.63,
			bonus: 4.17,
			status: "inactive",
		},
		{
			player: "Marcus Rashford",
			clubKey: "barcelona",
			salary: 14.0,
			bonus: 3.5,
			status: "loan",
		},
		{
			player: "Dani Olmo",
			clubKey: "barcelona",
			salary: 12.5,
			bonus: 1.5,
			status: "active",
		},
		{
			player: "Pedri",
			clubKey: "barcelona",
			salary: 12.5,
			bonus: 3.5,
			status: "active",
		},
		{
			player: "Ronald Araujo",
			clubKey: "barcelona",
			salary: 12.5,
			bonus: 3.5,
			status: "active",
		},
		{
			player: "Ferran Torres",
			clubKey: "barcelona",
			salary: 10.0,
			bonus: 3.0,
			status: "active",
		},
		{
			player: "Gavi",
			clubKey: "barcelona",
			salary: 9.38,
			bonus: 2.35,
			status: "active",
		},
		{
			player: "Andreas Christensen",
			clubKey: "barcelona",
			salary: 9.0,
			bonus: 4.0,
			status: "active",
		},
		{
			player: "Joao Cancelo",
			clubKey: "barcelona",
			salary: 8.33,
			bonus: 2.08,
			status: "loan",
		},
		{
			player: "Eric Garcia",
			clubKey: "barcelona",
			salary: 8.0,
			bonus: 2.0,
			status: "active",
		},
		{
			player: "Fermin Lopez",
			clubKey: "barcelona",
			salary: 7.29,
			bonus: 1.46,
			status: "active",
		},
		{
			player: "Joan Garcia",
			clubKey: "barcelona",
			salary: 6.25,
			bonus: 1.56,
			status: "active",
		},
		{
			player: "Ansu Fati",
			clubKey: "barcelona",
			salary: 4.69,
			bonus: 1.17,
			status: "inactive",
		},
		{
			player: "Pau Cubarsi",
			clubKey: "barcelona",
			salary: 4.0,
			bonus: 1.0,
			status: "active",
		},
		{
			player: "Wojciech Szczesny",
			clubKey: "barcelona",
			salary: 3.0,
			bonus: 0.75,
			status: "active",
		},
		{
			player: "Kylian Mbappe",
			clubKey: "realMadrid",
			salary: 31.25,
			bonus: 40.42,
			status: "active",
		},
		{
			player: "Vinicius Junior",
			clubKey: "realMadrid",
			salary: 25.0,
			bonus: 12.5,
			status: "active",
		},
		{
			player: "David Alaba",
			clubKey: "realMadrid",
			salary: 22.5,
			bonus: 5.63,
			status: "active",
		},
		{
			player: "Jude Bellingham",
			clubKey: "realMadrid",
			salary: 20.83,
			bonus: 4.17,
			status: "active",
		},
		{
			player: "Federico Valverde",
			clubKey: "realMadrid",
			salary: 16.67,
			bonus: 4.17,
			status: "active",
		},
		{
			player: "Rodrygo",
			clubKey: "realMadrid",
			salary: 16.67,
			bonus: 4.17,
			status: "active",
		},
		{
			player: "Trent Alexander-Arnold",
			clubKey: "realMadrid",
			salary: 16.67,
			bonus: 15.0,
			status: "active",
		},
		{
			player: "Thibaut Courtois",
			clubKey: "realMadrid",
			salary: 15.0,
			bonus: 3.75,
			status: "active",
		},
		{
			player: "Antonio Rudiger",
			clubKey: "realMadrid",
			salary: 14.58,
			bonus: 4.17,
			status: "active",
		},
		{
			player: "Eder Militao",
			clubKey: "realMadrid",
			salary: 14.58,
			bonus: 3.65,
			status: "active",
		},
		{
			player: "Aurelien Tchouameni",
			clubKey: "realMadrid",
			salary: 12.5,
			bonus: 3.13,
			status: "active",
		},
		{
			player: "Eduardo Camavinga",
			clubKey: "realMadrid",
			salary: 12.5,
			bonus: 3.13,
			status: "active",
		},
		{
			player: "Daniel Carvajal",
			clubKey: "realMadrid",
			salary: 10.42,
			bonus: 2.6,
			status: "active",
		},
		{
			player: "Ferland Mendy",
			clubKey: "realMadrid",
			salary: 10.42,
			bonus: 2.6,
			status: "active",
		},
		{
			player: "Dani Ceballos",
			clubKey: "realMadrid",
			salary: 10.42,
			bonus: 2.6,
			status: "active",
		},
		{
			player: "Dean Huijsen",
			clubKey: "realMadrid",
			salary: 8.96,
			bonus: 2.25,
			status: "active",
		},
		{
			player: "Alvaro Carreras",
			clubKey: "realMadrid",
			salary: 8.96,
			bonus: 2.25,
			status: "active",
		},
		{
			player: "Franco Mastantuono",
			clubKey: "realMadrid",
			salary: 7.29,
			bonus: 1.81,
			status: "active",
		},
		{
			player: "Brahim Diaz",
			clubKey: "realMadrid",
			salary: 7.29,
			bonus: 1.81,
			status: "active",
		},
		{
			player: "Raul Asencio",
			clubKey: "realMadrid",
			salary: 6.25,
			bonus: 1.56,
			status: "active",
		},
	];

	const DOWNLOAD_ICON_SVG = `
		<svg class="transfers-board-download-icon" width="20" height="20" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
			<path d="M9.99982 0.75V12.791L7.08381 9.8633M12.9158 9.8633L12.1868 10.5953M5.367 5.48289H4.42501C2.39601 5.48289 0.75 7.12789 0.75 9.1569V14.0419C0.75 16.0769 2.40001 17.7269 4.43501 17.7269H6.22001M14.6328 5.48289H15.5658C17.6008 5.48289 19.2498 7.13189 19.2498 9.1679V14.0519C19.2498 16.0819 17.6048 17.7269 15.5748 17.7269H10.0048" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>`;

	function getDirectionArrowSVG(direction, size = "sm") {
		const trianglePoints =
			direction === "up" ? "10,3 17,15 3,15" : "3,5 17,5 10,17";

		return `<svg class="transfers-direction-arrow transfers-direction-arrow--${size}" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><polygon points="${trianglePoints}" fill="currentColor"/></svg>`;
	}

	function buildSalaryLeaders(limitPerClub = 15) {
		return clubs.flatMap((club) =>
			salaryData
				.filter((row) => row.clubKey === club.key)
				.sort((a, b) => b.salary - a.salary || a.player.localeCompare(b.player))
				.slice(0, limitPerClub)
				.map((row, index) => ({
					...row,
					club,
					clubRank: index + 1,
					id: `salary-${club.key}-${index + 1}`,
				})),
		);
	}

	function getMovementStats(season, clubKey) {
		return (
			seasonFeeMovementData[season]?.[clubKey] ??
			seasonData[season]?.[clubKey] ??
			chartSeasonData[season]?.[clubKey]
		);
	}

	// Compute all-seasons totals per club for the summary cards
	function buildTotals() {
		return clubs.map((club) => {
			let totalExp = 0,
				totalInc = 0,
				totalArr = 0,
				totalDep = 0;
			let peakExpSeason = CHART_SEASONS[0],
				peakExpVal = -Infinity;
			let peakIncSeason = CHART_SEASONS[0],
				peakIncVal = -Infinity;

			CHART_SEASONS.forEach((s) => {
				const d = chartSeasonData[s][club.key];
				if (!d) return;
				const movement = seasonFeeMovementData[s]?.[club.key] ?? d;
				totalExp += d.expenditure;
				totalInc += d.income;
				totalArr += movement.arrivals;
				totalDep += movement.departures;
				if (d.expenditure > peakExpVal) {
					peakExpVal = d.expenditure;
					peakExpSeason = s;
				}
				if (d.income > peakIncVal) {
					peakIncVal = d.income;
					peakIncSeason = s;
				}
			});

			return {
				...club,
				totalExp,
				totalInc,
				totalArr,
				totalDep,
				netBalance: totalInc - totalExp,
				peakExpSeason,
				peakExpVal,
				peakIncSeason,
				peakIncVal,
			};
		});
	}

	// Build cumulative net balance per club: running sum of (income - expenditure)
	function buildCumulativeSeries(
		clubList = clubs,
		data = seasonData,
		seasons = SEASONS,
	) {
		return clubList.map((club) => {
			let running = 0;
			const values = seasons.map((s) => {
				const d = data[s][club.key];
				running += d.income - d.expenditure;
				return { season: s, value: running };
			});
			return { ...club, values };
		});
	}

	let resizeFrame = null;
	let lastRenderWidth = 0;
	let salaryTopN = null; // null = All

	function init() {
		if (!window.d3) return;
		const section = document.getElementById("transfers-comparison");
		if (!section) return;

		window.addEventListener("resize", () => {
			if (window.innerWidth === lastRenderWidth) return;
			if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
			resizeFrame = window.requestAnimationFrame(render);
		});

		render();
	}

	function render() {
		lastRenderWidth = window.innerWidth;
		renderChart();
		renderCards();
		renderSalarySankey();
		bindGraphicDownloads();
	}

	function getDownloadButtonHTML(buttonId, label) {
		return `<button class="transfers-export-control transfers-board-download" id="${buttonId}" type="button" aria-label="${label}" title="${label}">${DOWNLOAD_ICON_SVG}</button>`;
	}

	function buildGraphicFilename(baseName) {
		const stamp = new Date().toISOString().slice(0, 10);
		return `${baseName}-${stamp}.png`;
	}

	async function exportGraphicNode(node, fileName) {
		if (!node || !window.htmlToImage?.toPng) return false;

		const backgroundColor = window.getComputedStyle(node).backgroundColor;
		const dataUrl = await window.htmlToImage.toPng(node, {
			backgroundColor:
				backgroundColor &&
				backgroundColor !== "rgba(0, 0, 0, 0)" &&
				backgroundColor !== "transparent"
					? backgroundColor
					: "#41527f",
			cacheBust: true,
			pixelRatio: 2,
			filter: (currentNode) =>
				!(
					currentNode instanceof HTMLElement &&
					currentNode.classList.contains("transfers-export-control")
				),
		});

		const link = document.createElement("a");
		link.download = fileName;
		link.href = dataUrl;
		link.click();
		return true;
	}

	function bindGraphicDownload(buttonId, targetId, fileBaseName) {
		const button = document.getElementById(buttonId);
		const target = document.getElementById(targetId);
		if (!button || !target) return;

		button.onclick = async () => {
			button.disabled = true;
			button.classList.add("is-loading");

			try {
				const exported = await exportGraphicNode(
					target,
					buildGraphicFilename(fileBaseName),
				);
				if (!exported) {
					console.error(
						"Graphic export unavailable: html-to-image did not load",
					);
				}
			} catch (error) {
				console.error(`Failed to export ${fileBaseName}`, error);
			} finally {
				button.disabled = false;
				button.classList.remove("is-loading");
			}
		};
	}

	function bindGraphicDownloads() {
		bindGraphicDownload(
			"transfersChartDownloadBtn",
			"transfersChartGraphic",
			"cumulative-net-outlay",
		);
		bindGraphicDownload(
			"transfersSeasonDownloadBtn",
			"transfersSeasonBoard",
			"player-movement-by-season",
		);
		bindGraphicDownload(
			"transfersSalaryDownloadBtn",
			"transfersSalaryBoard",
			"salary-comparison",
		);
	}

	// ─── Cumulative net balance chart ───────────────────────────────────────
	function renderChart() {
		const container = document.getElementById("transfersChart");
		const detail = document.getElementById("transfersChartDetail");
		const detailPanelHost = document.getElementById(
			"transfersChartDetailPanel",
		);
		if (!container || !detail || !detailPanelHost) return;
		const visuals = container.closest(".transfers-visuals");
		const chartWrap = container.closest(".transfers-chart-wrap");
		const stickyKey = document.querySelector(".transfers-sticky-key");
		if (
			stickyKey &&
			visuals &&
			chartWrap &&
			stickyKey.parentElement !== visuals
		) {
			visuals.insertBefore(stickyKey, chartWrap);
		}

		const series = buildCumulativeSeries(
			chartClubs,
			chartSeasonData,
			CHART_SEASONS,
		);
		const width = Math.max(container.clientWidth, 320);
		const isNarrow = width < 560;
		const isVeryNarrow = width < 390;
		const margin = isNarrow
			? { top: 22, right: 0, bottom: 18, left: 0 }
			: { top: 24, right: 0, bottom: 22, left: 0 };
		const chartHeightBoost = 100;
		const height = isNarrow
			? Math.max(280, Math.round(width * 0.72)) + chartHeightBoost
			: Math.max(320, Math.round(width * 0.44)) + chartHeightBoost;
		const innerW = width - margin.left - margin.right;
		const innerH = height - margin.top - margin.bottom;
		const xAxisHeadroom = isNarrow ? 20 : 28;
		const maxXTicks = isVeryNarrow ? 4 : isNarrow ? 5 : 8;
		const tickStep = Math.max(1, Math.ceil(CHART_SEASONS.length / maxXTicks));
		const showSeasonBars = width >= 480;
		const scope =
			container.closest(".transfers-section") || document.documentElement;
		const scopeStyles = window.getComputedStyle(scope);
		const coordinateColor =
			scopeStyles.getPropertyValue("--tr-subtle").trim() || "#9fb1de";
		const positiveRgb =
			scopeStyles.getPropertyValue("--tr-positive-rgb").trim() ||
			"123, 232, 176";
		const negativeRgb =
			scopeStyles.getPropertyValue("--tr-negative-rgb").trim() ||
			"255, 154, 146";

		container.innerHTML = "";
		detailPanelHost.innerHTML = "";

		const svg = d3
			.select(container)
			.append("svg")
			.attr("viewBox", `0 0 ${width} ${height}`)
			.attr("role", "img")
			.attr("aria-label", "Cumulative net transfer balance 2002-2026");

		const chart = svg
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		const x = d3
			.scalePoint()
			.domain(CHART_SEASONS)
			.range([0, innerW])
			.padding(isNarrow ? 0.15 : 0.3);

		const cumulativeValues = series.flatMap((c) =>
			c.values.map((v) => v.value),
		);
		const barExtremes = CHART_SEASONS.flatMap((season) =>
			clubs.flatMap((club) => {
				const d = chartSeasonData[season][club.key];
				return [d.income, -d.expenditure];
			}),
		);
		const allValues = cumulativeValues.concat(barExtremes);
		const minVal = d3.min(allValues);
		const maxVal = d3.max(allValues);
		const pad = (maxVal - minVal) * 0.1 || 50;
		const y = d3
			.scaleLinear()
			.domain([minVal - pad, maxVal + pad])
			.range([innerH, xAxisHeadroom])
			.nice();
		const yTickCount = isNarrow ? 4 : 5;
		const yTicks = y.ticks(yTickCount);
		let visibleYTicks = yTicks.slice(1);
		const forceTick = -500;
		const [yMin, yMax] = y.domain();
		if (
			isNarrow &&
			forceTick > yMin &&
			forceTick < yMax &&
			!visibleYTicks.some((t) => Math.abs(t - forceTick) < 1e-6)
		) {
			visibleYTicks = [...visibleYTicks, forceTick].sort((a, b) => a - b);
		}

		const clipId = "transfers-bars-clip";
		svg
			.append("defs")
			.append("clipPath")
			.attr("id", clipId)
			.append("rect")
			.attr("x", margin.left)
			.attr("y", margin.top)
			.attr("width", innerW)
			.attr("height", innerH);

		const gridGroup = chart
			.append("g")
			.attr("class", "transfers-grid")
			.selectAll("line")
			.data(visibleYTicks.filter((t) => t !== 0))
			.join("line")
			.attr("x1", 0)
			.attr("x2", innerW)
			.attr("y1", (t) => y(t))
			.attr("y2", (t) => y(t))
			.attr("stroke", coordinateColor)
			.attr("stroke-opacity", 0.38)
			.attr("stroke-dasharray", "4 4")
			.attr("stroke-width", 1.2);

		const zeroLine = { lower: () => {} };

		const seasonAxis = d3.axisBottom(x);
		chart
			.append("g")
			.attr("transform", `translate(0,${innerH})`)
			.call(
				seasonAxis
					.tickSize(0)
					.tickPadding(isNarrow ? 6 : 8)
					.tickFormat((s, i) => {
						if (i === CHART_SEASONS.length - 1) return "";
						if (i === 0) return s;
						return i % tickStep === 0 ? s : "";
					}),
			)
			.call((ax) => ax.select(".domain").remove())
			.call((ax) =>
				ax
					.selectAll("text")
					.attr("class", "transfers-board-coordinate-tick")
					.style("font-size", isNarrow ? "9px" : null),
			);

		chart
			.append("g")
			.call(
				d3
					.axisLeft(y)
					.tickValues(visibleYTicks)
					.tickSize(0)
					.tickFormat((v) => `€${v >= 0 ? "" : "-"}${Math.abs(v)}`),
			)
			.call((ax) => ax.select(".domain").remove())
			.call((ax) =>
				ax
					.selectAll("text")
					.attr("class", "transfers-board-coordinate-tick")
					.attr("text-anchor", "start")
					.attr("dx", "4px")
					.attr("dy", "-3px")
					.style("font-size", isNarrow ? "9px" : null),
			);

		const lineGen = d3
			.line()
			.x((v) => x(v.season) ?? 0)
			.y((v) => y(v.value))
			.curve(d3.curveLinear);

		series.forEach((club) => {
			chart
				.append("path")
				.datum(club.values)
				.attr("class", "transfers-net-series")
				.attr("data-club-key", club.key)
				.attr("fill", "none")
				.attr("stroke", club.color)
				.attr("stroke-width", club.isReference ? 1 : 2.5)
				.attr("stroke-dasharray", club.isReference ? "6 4" : null)
				.attr("stroke-opacity", club.isReference ? 1 : 1)
				.attr("stroke-linejoin", "round")
				.attr("stroke-linecap", "round")
				.attr("d", lineGen);
		});

		// ── Per-season bars embedded in chart (same y-axis) ──────────────────
		if (showSeasonBars) {
			const xStep = innerW / CHART_SEASONS.length;
			const groupW = xStep * (isNarrow ? 0 : 0.4);
			const clubBarW = groupW / clubs.length;

			const barsGroup = chart
				.append("g")
				.attr("class", "transfers-bars-bg")
				.attr("clip-path", `url(#${clipId})`)
				.attr("pointer-events", "none");

			CHART_SEASONS.forEach((s) => {
				const cx = x(s) ?? 0;
				clubs.forEach((club, ci) => {
					const d = chartSeasonData[s][club.key];
					const bx = cx - groupW / 2 + ci * clubBarW;

					const barW = Math.max(clubBarW * 0.8, 2);
					const barOffset = (clubBarW - barW) / 2;

					// Expenditure bar — down from zero (team color)
					barsGroup
						.append("rect")
						.attr("data-club-key", club.key)
						.attr("x", bx + barOffset)
						.attr("y", y(0))
						.attr("width", barW)
						.attr("height", y(-d.expenditure) - y(0))
						.attr("fill", club.color);

					// Income bar — up from zero (team color, lighter)
					barsGroup
						.append("rect")
						.attr("data-club-key", club.key)
						.attr("x", bx + barOffset)
						.attr("y", y(d.income))
						.attr("width", barW)
						.attr("height", y(0) - y(d.income))
						.attr("fill", club.color);
				});
			});
		}

		// ── Background color bands (green=positive, red=negative) ───────────
		const plotTop = 0;
		const plotBottom = innerH;
		const zeroY = y(0);
		const positiveBottom = Math.max(plotTop, Math.min(plotBottom, zeroY));

		const bgDefs = svg.append("defs");

		const posGradId = "tr-bg-pos-" + Math.random().toString(36).slice(2);
		const posGrad = bgDefs
			.append("linearGradient")
			.attr("id", posGradId)
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", 0)
			.attr("y2", 1);
		posGrad
			.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", `rgb(${positiveRgb})`)
			.attr("stop-opacity", 0);
		posGrad
			.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", `rgb(${positiveRgb})`)
			.attr("stop-opacity", 0.22);

		const negGradId = "tr-bg-neg-" + Math.random().toString(36).slice(2);
		const negGrad = bgDefs
			.append("linearGradient")
			.attr("id", negGradId)
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", 0)
			.attr("y2", 1);
		negGrad
			.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", `rgb(${negativeRgb})`)
			.attr("stop-opacity", 0.18);
		negGrad
			.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", `rgb(${negativeRgb})`)
			.attr("stop-opacity", 0);

		const background = chart
			.append("g")
			.attr("class", "transfers-net-background");

		if (positiveBottom > plotTop) {
			background
				.append("rect")
				.attr("x", 0)
				.attr("y", plotTop)
				.attr("width", innerW)
				.attr("height", positiveBottom - plotTop)
				.attr("fill", `url(#${posGradId})`)
				.attr("pointer-events", "none");
		}

		if (plotBottom > positiveBottom) {
			background
				.append("rect")
				.attr("x", 0)
				.attr("y", positiveBottom)
				.attr("width", innerW)
				.attr("height", plotBottom - positiveBottom)
				.attr("fill", `url(#${negGradId})`)
				.attr("pointer-events", "none");
		}

		background.raise();
		chart.selectAll(".transfers-net-series").raise();
		chart.select(".transfers-bars-bg").raise();

		const hoverGroup = chart.append("g");
		const hoverLine = hoverGroup
			.append("line")
			.attr("y1", 0)
			.attr("y2", innerH)
			.attr("stroke", coordinateColor)
			.attr("stroke-width", 1.3)
			.attr("stroke-opacity", 0.9)
			.attr("stroke-dasharray", "3 3")
			.attr("pointer-events", "none")
			.style("opacity", 0.35);

		// Arrow caret fixed above the chart top for all breakpoints
		const caretSize = 5;
		const caretY = -(caretSize + 6);
		const hoverCaret = hoverGroup
			.append("polygon")
			.attr("points", `0,0 ${caretSize * 2},0 ${caretSize},${caretSize + 2}`)
			.attr("fill", coordinateColor)
			.attr("opacity", 0.9)
			.attr("pointer-events", "none")
			.style("opacity", 0.35);

		const setHoverCaretX = (cx) =>
			hoverCaret.attr("transform", `translate(${cx - caretSize},${caretY})`);

		const defaultGuideSeason = CHART_SEASONS[CHART_SEASONS.length - 1];
		const defaultGuideX = x(defaultGuideSeason) ?? 0;
		hoverLine.attr("x1", defaultGuideX).attr("x2", defaultGuideX);
		setHoverCaretX(defaultGuideX);

		const hoverDots = series.map((club) =>
			hoverGroup
				.append("circle")
				.attr("r", isNarrow ? 4.5 : 5.5)
				.attr("fill", club.color)
				.attr("stroke", "none")
				.attr("stroke-width", 0)
				.attr("pointer-events", "none")
				.style("opacity", 0.55),
		);

		hoverDots.forEach((dot, i) => {
			const v = series[i].values.find((d) => d.season === defaultGuideSeason);
			if (v == null) return;
			dot.attr("cx", defaultGuideX).attr("cy", y(v.value));
		});

		const detailPanel = d3.select(detailPanelHost).style("opacity", 1);
		const detailHeader = detailPanel
			.append("div")
			.attr("class", "transfers-tt-header");
		const detailSeason = detailHeader
			.append("div")
			.attr("class", "transfers-tt-season");
		const detailBody = detailPanel
			.append("div")
			.attr("class", "transfers-tt-clubs");

		const renderSeasonFocus = (season, isActive = false) => {
			const sx = x(season) ?? 0;
			hoverLine
				.attr("x1", sx)
				.attr("x2", sx)
				.style("opacity", isActive ? 1 : 0.35);
			setHoverCaretX(sx).style("opacity", isActive ? 0.9 : 0.35);

			const primarySeries = series.filter((club) => !club.isReference);

			const rows = primarySeries
				.map((club) => {
					const sd = chartSeasonData[season][club.key];
					const cumulative =
						club.values.find((d) => d.season === season)?.value ?? 0;
					const transferRecord = sd.income - sd.expenditure;
					const trCls = transferRecord < 0 ? "is-purchase" : "is-sale";
					const trArrow = getDirectionArrowSVG(
						transferRecord < 0 ? "down" : "up",
						"sm",
					);
					return `<div class="transfers-tt-club" style="--tt-club-color: ${club.color}">
						<div class="transfers-tt-club-head">
							<strong class="transfers-tt-total transfers-highlight-number transfers-highlight-number--primary">${formatMillions(cumulative)}</strong>
						</div>
						<div class="transfers-tt-kicker">Season net</div>
						<span class="transfers-tt-row">
							<strong class="${trCls}">${trArrow}${formatMillions(Math.abs(transferRecord))}</strong>
						</span>
						<span class="transfers-tt-bar-row">
							<span class="is-purchase">Spent ${formatMillions(sd.expenditure)}</span>
							<span class="is-sale">Received ${formatMillions(sd.income)}</span>
						</span>
					</div>`;
				})
				.join("");

			detailSeason.text(season);
			detailBody.html(rows);

			hoverDots.forEach((dot, i) => {
				const club = series[i];
				if (club.isReference) {
					dot.style("opacity", 0);
					return;
				}
				const v = club.values.find((d) => d.season === season);
				if (v == null) return;
				dot
					.attr("cx", sx)
					.attr("cy", y(v.value))
					.style("opacity", isActive ? 1 : 0.55);
			});
		};

		renderSeasonFocus(defaultGuideSeason, false);

		const getEventClientX = (event) =>
			event.touches
				? (event.touches[0]?.clientX ?? event.changedTouches[0]?.clientX)
				: event.clientX;

		const seasonFromClientX = (clientX) => {
			const svgEl = container.querySelector("svg");
			const svgRect = svgEl.getBoundingClientRect();
			const scaleX = width / svgRect.width;
			const mx = (clientX - svgRect.left) * scaleX - margin.left;
			let closest = CHART_SEASONS[0],
				minDist = Infinity;
			CHART_SEASONS.forEach((s) => {
				const dist = Math.abs((x(s) ?? 0) - mx);
				if (dist < minDist) {
					minDist = dist;
					closest = s;
				}
			});
			return closest;
		};

		const updateSeasonFromEvent = (event) => {
			const clientX = getEventClientX(event);
			if (clientX == null) return;
			renderSeasonFocus(seasonFromClientX(clientX), true);
		};

		const hitboxEl = chart
			.append("rect")
			.attr("class", "transfers-chart-hitbox")
			.attr("width", innerW)
			.attr("height", innerH)
			.attr("fill", "transparent")
			.style("pointer-events", "all")
			// Allow the browser to decide scroll vs. pan until we know direction
			.style("touch-action", "pan-y")
			.on("mousemove", updateSeasonFromEvent)
			.on("click", updateSeasonFromEvent)
			.node();

		// Gesture direction detection for touch
		let touchStartX = null;
		let touchStartY = null;
		let gestureDirection = null; // "h" | "v" | null

		hitboxEl.addEventListener(
			"touchstart",
			function (event) {
				const t = event.touches[0];
				touchStartX = t.clientX;
				touchStartY = t.clientY;
				gestureDirection = null;
				// Update season on initial tap without committing direction yet
				updateSeasonFromEvent(event);
			},
			{ passive: true },
		);

		hitboxEl.addEventListener(
			"touchmove",
			function (event) {
				const t = event.touches[0];
				if (gestureDirection === null) {
					const dx = Math.abs(t.clientX - touchStartX);
					const dy = Math.abs(t.clientY - touchStartY);
					if (dx > 4 || dy > 4) {
						gestureDirection = dx >= dy ? "h" : "v";
					}
				}
				if (gestureDirection === "h") {
					event.preventDefault(); // lock page scroll
					updateSeasonFromEvent(event);
				}
				// gestureDirection === "v": do nothing, let page scroll
			},
			{ passive: false },
		);

		hitboxEl.addEventListener(
			"touchend",
			() => {
				touchStartX = null;
				touchStartY = null;
				gestureDirection = null;
			},
			{ passive: true },
		);

		gridGroup.lower();
		zeroLine.lower();
	}

	// ─── Summary cards ───────────────────────────────────────────────────────
	function renderCards() {
		const primaryContainer = document.getElementById("transfersClubGrid");
		const secondaryContainer = document.getElementById(
			"transfersClubGridSecondary",
		);
		const cardsMount = primaryContainer ?? secondaryContainer;
		if (!cardsMount) return;
		const cardsWidth = Math.max(cardsMount.clientWidth, 320);
		const salaryLimitPerClub = 15;

		const totals = buildTotals();
		const salaryLeaders = buildSalaryLeaders(salaryLimitPerClub);
		const allClubs = [
			totals.find((c) => c.id === "atletico"),
			totals.find((c) => c.id === "barcelona"),
			totals.find((c) => c.id === "real-madrid"),
		];

		// ── Waffle chart: net balance per club as % of largest net ──────────────
		const waffleMax = Math.max(
			...allClubs.map((c) => Math.abs(c.netBalance)),
			1,
		);
		const WAFFLE_CELLS = 100;
		const makeWaffleCells = (value, toneClass) => {
			const filled = Math.round((value / waffleMax) * WAFFLE_CELLS);
			return Array.from({ length: WAFFLE_CELLS }, (_, i) => {
				const flippedIdx = (9 - Math.floor(i / 10)) * 10 + (i % 10);
				return `<span class="transfers-waffle-cell ${flippedIdx < filled ? toneClass : "is-empty"}"></span>`;
			}).join("");
		};
		const waffleBoardHTML = `
			<div class="transfers-waffle-cols">
				${allClubs
					.map((club) => {
						const tone = club.netBalance >= 0 ? "is-in" : "is-out";
						const pct = Math.round(
							(Math.abs(club.netBalance) / waffleMax) * 100,
						);
						return `
							<div class="transfers-waffle-unit" data-club-key="${club.key}" style="--club-color:${club.color}">
								<div class="transfers-waffle-stats">
									<div class="transfers-waffle-figure transfers-highlight-number transfers-highlight-number--secondary">${pct}%</div>
									<div class="transfers-waffle-value">${formatMillions(Math.abs(club.netBalance))}</div>
								</div>
								<div class="transfers-waffle-grid" aria-hidden="true">${makeWaffleCells(Math.abs(club.netBalance), tone)}</div>
							</div>`;
					})
					.join("")}
			</div>
		`;

		const seasonHeadHTML = CHART_SEASONS.map(
			(season) =>
				`<div class="transfers-season-axis-cell transfers-board-coordinates">'${season.slice(0, 2)}</div>`,
		).join("");

		const seasonRowsHTML = allClubs
			.map((club) => {
				const seasonCells = CHART_SEASONS.map((season) => {
					const stats = getMovementStats(season, club.key);
					if (!stats)
						return `<div class="transfers-season-cell" style="--club-color:${club.color}"></div>`;
					const arrivals = stats.arrivals ?? 0;
					const departures = stats.departures ?? 0;
					const net = arrivals - departures;
					const netTone =
						net > 0 ? "is-positive" : net < 0 ? "is-negative" : "is-neutral";
					const netLabel = net > 0 ? `+${net}` : `${net}`;
					return `
						<div class="transfers-season-cell" style="--club-color:${club.color};--arr:${arrivals};--dep:${departures}" tabindex="0" aria-label="${club.name} ${season}: out ${departures}, in ${arrivals}, net ${netLabel}">
							<div class="transfers-season-cell-net ${netTone}">${netLabel}</div>
							<div class="transfers-season-cell-bars">
								<div class="transfers-season-bars-up"></div>
								<div class="transfers-season-bars-mid"></div>
								<div class="transfers-season-bars-down"></div>
							</div>
							<div class="transfers-season-hover" aria-hidden="true">
								<span class="is-out">−${departures}</span>
								<span class="is-in">+${arrivals}</span>
							</div>
						</div>
					`;
				}).join("");

				return `
					<div class="transfers-season-row" data-club-key="${club.key}" style="--club-color:${club.color}">
						${seasonCells}
					</div>
				`;
			})
			.join("");

		const maxTotalMoves = Math.max(
			...allClubs.map((club) => club.totalDep + club.totalArr),
			1,
		);
		const donutScope =
			cardsMount.closest(".transfers-section") || document.documentElement;
		const donutStyles = window.getComputedStyle(donutScope);
		const donutSvgSize =
			parseFloat(donutStyles.getPropertyValue("--tr-donut-svg-size")) || 170;
		const donutOuterRadiusScale =
			parseFloat(
				donutStyles.getPropertyValue("--tr-donut-outer-radius-scale"),
			) || 0.48;
		const donutDefaultThickness =
			parseFloat(donutStyles.getPropertyValue("--tr-donut-ring-thickness")) ||
			parseFloat(donutStyles.getPropertyValue("--tr-donut-color-ring-width")) ||
			28;
		const donutColorRingThickness =
			parseFloat(
				donutStyles.getPropertyValue("--tr-donut-color-ring-thickness"),
			) || donutDefaultThickness;
		const donutGrayRingThickness =
			parseFloat(
				donutStyles.getPropertyValue("--tr-donut-remainder-ring-thickness"),
			) || donutDefaultThickness;

		const donutTotalsHTML = allClubs
			.map((club) => {
				const totalOut = club.totalDep;
				const totalIn = club.totalArr;
				const outArrow = getDirectionArrowSVG("down", "sm");
				const inArrow = getDirectionArrowSVG("up", "sm");
				const totalEndPct = ((totalOut + totalIn) / maxTotalMoves) * 100;
				const coloredSpanPct = totalEndPct;
				const outShare =
					totalOut + totalIn > 0 ? totalOut / (totalOut + totalIn) : 0;
				const outSpanPct = coloredSpanPct * outShare;
				const totalSpanPct = coloredSpanPct;

				const size = donutSvgSize;
				const cx = size / 2;
				const cy = size / 2;
				const outerR = size * donutOuterRadiusScale;
				const colorRingThickness = donutColorRingThickness;
				const grayRingThickness = donutGrayRingThickness;
				const colorRingRadius = outerR - colorRingThickness / 2;
				const grayRingRadius = outerR - grayRingThickness / 2;
				const colorCircumference = 2 * Math.PI * colorRingRadius;
				const coloredLength = (colorCircumference * totalSpanPct) / 100;
				const outLength = (colorCircumference * outSpanPct) / 100;
				const inLength = Math.max(coloredLength - outLength, 0);
				const circleRotation = `rotate(-90 ${cx} ${cy})`;

				return `
					<div class="transfers-donut-card" data-club-key="${club.key}" style="--club-color:${club.color}">
						<div class="transfers-donut-chart" title="${totalOut} out, ${totalIn} in">
							<svg class="transfers-donut-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Club totals donut">
								<circle class="transfers-donut-gray" cx="${cx}" cy="${cy}" r="${grayRingRadius.toFixed(2)}" stroke-width="${grayRingThickness.toFixed(2)}"></circle>
								${outLength > 0 ? `<circle class="transfers-donut-out" cx="${cx}" cy="${cy}" r="${colorRingRadius.toFixed(2)}" stroke-width="${colorRingThickness.toFixed(2)}" stroke-dasharray="${outLength.toFixed(2)} ${(colorCircumference - outLength).toFixed(2)}" stroke-dashoffset="0" transform="${circleRotation}"></circle>` : ""}
								${inLength > 0 ? `<circle class="transfers-donut-in" cx="${cx}" cy="${cy}" r="${colorRingRadius.toFixed(2)}" stroke-width="${colorRingThickness.toFixed(2)}" stroke-dasharray="${inLength.toFixed(2)} ${(colorCircumference - inLength).toFixed(2)}" stroke-dashoffset="${(-outLength).toFixed(2)}" transform="${circleRotation}"></circle>` : ""}
							</svg>
							<div class="transfers-donut-center">
								<div class="is-out transfers-highlight-number transfers-highlight-number--primary">${outArrow}${totalOut}</div>
								<div class="is-in transfers-highlight-number transfers-highlight-number--primary">${inArrow}${totalIn}</div>
							</div>
						</div>
					</div>
				`;
			})
			.join("");

		const salarySummaryText = formatSalaryMillions(
			salaryLeaders.reduce((sum, row) => sum + row.salary + row.bonus, 0),
		);

		const netBalanceBoardHTML = `
			<article class="transfers-vs-board transfers-bullet-board">
				<div class="transfers-waffle-board">${waffleBoardHTML}</div>
				<div class="transfers-rank-caption transfers-board-coordinates">Net balance · ${CHART_SEASONS[0]}–${CHART_SEASONS[CHART_SEASONS.length - 1]} · 100% = ${formatMillions(waffleMax)}</div>
			</article>
		`;

		const remainingBoardsHTML = `
			<hr class="transfers-rule">
			<article class="transfers-vs-board transfers-salary-board" id="transfersSalaryBoard">
				<div class="transfers-salary-header">
					<div class="transfers-salary-head-copy">
						<div class="transfers-vs-title transfers-board-title">2025/26 wages</div>
						<div class="transfers-salary-intro transfers-board-subhead">
							<span>Top 15 earners, most Atlético de Madrid players fall below their counterparts at Real Madrid and FC Barcelona, with only a few exceptions at the top.</span>
						</div>
					</div>
					${getDownloadButtonHTML("transfersSalaryDownloadBtn", "Download salary comparison graphic")}
				</div>
				<div class="transfers-salary-tabs" role="tablist" aria-label="Players per club">
					<button class="transfers-salary-tab${salaryTopN === null ? " is-active" : ""}" role="tab" aria-selected="${salaryTopN === null}" data-top="all">All</button>
					<button class="transfers-salary-tab${salaryTopN === 3 ? " is-active" : ""}" role="tab" aria-selected="${salaryTopN === 3}" data-top="3">Top 3</button>
					<button class="transfers-salary-tab${salaryTopN === 5 ? " is-active" : ""}" role="tab" aria-selected="${salaryTopN === 5}" data-top="5">Top 5</button>
					<button class="transfers-salary-tab${salaryTopN === 10 ? " is-active" : ""}" role="tab" aria-selected="${salaryTopN === 10}" data-top="10">Top 10</button>
				</div>
				<div class="transfers-salary-layout">
					<div class="transfers-salary-compare-grid">
						<div class="transfers-salary-chart-wrap">
							<div class="transfers-salary-chart" id="transfersSalarySankey" aria-live="polite"></div>
						</div>
					</div>
				</div>
			</article>
			<hr class="transfers-rule">
			<article class="transfers-vs-board transfers-season-board" id="transfersSeasonBoard">
				<div class="transfers-chart-meta transfers-board-header">
					<div class="transfers-board-head-copy">
						<div class="transfers-vs-title transfers-board-title">Player movement</div>
						<div class="transfers-board-subhead">All player arrivals and departures by season, showing year-to-year squad turnover.</div>
					</div>
					${getDownloadButtonHTML("transfersSeasonDownloadBtn", "Download player movement graphic")}
				</div>
				<div class="transfers-season-scroll">
					<div class="transfers-season-grid">
						<div class="transfers-season-head">
							${seasonHeadHTML}
						</div>
						${seasonRowsHTML}
					</div>
				</div>
				<div class="transfers-season-test-block">
					<div class="transfers-donut-grid">
						${donutTotalsHTML}
					</div>
					<div class="transfers-rank-caption transfers-board-coordinates">Total transfer activity (in &amp; out) since 02/03 · 0% = pure spending, ≥100% = fully self-funded</div>
				</div>
			</article>
		`;

		if (secondaryContainer && primaryContainer) {
			primaryContainer.innerHTML = `<div class="transfers-detail-stack">${netBalanceBoardHTML}</div>`;
			secondaryContainer.innerHTML = `<div class="transfers-detail-stack">${remainingBoardsHTML}</div>`;
			return;
		}

		cardsMount.innerHTML = `
			<div class="transfers-detail-stack">
				${netBalanceBoardHTML}
				${remainingBoardsHTML}
			</div>
		`;
	}

	function renderSalarySankey() {
		const container = document.getElementById("transfersSalarySankey");
		if (!container) return;
		if (!window.d3) {
			container.innerHTML =
				'<p class="transfers-salary-fallback">Salary chart unavailable because the visualization library did not load.</p>';
			return;
		}

		const containerWidth = Math.max(container.clientWidth, 320);
		const salaryLimitPerClub = 15;
		const leaders = buildSalaryLeaders(salaryLimitPerClub);

		const width = Math.max(container.clientWidth, 320);
		const isNarrow = width < 700;
		const isMobile = width < 560;
		const isTiny = width < 420;
		const minChartHeight = Math.round(window.innerHeight * 0.697);
		const chartTop = isMobile ? 34 : 42;
		const chartBottomPad = isMobile ? 32 : 44;
		const rowGap = isMobile ? 2.5 : isNarrow ? 1 : 3;
		const clubGap = rowGap;
		const clubNodeWidth = 10;
		const grossNodeWidth = 10;
		const totalNodeWidth = 10;
		const rightLabelSpace = 4;
		const leftX = 0;
		const middleX =
			Math.round(width * (isMobile ? 0.35 : 0.39)) + (isNarrow ? 6 : 8);
		const rightX = Math.max(
			middleX + grossNodeWidth + (isTiny ? 30 : 42),
			width - totalNodeWidth - rightLabelSpace,
		);
		const totalLabelGap = 8;
		const salaryRightInset = leftX;
		const scale = isMobile ? 0.31 : isNarrow ? 0.34 : 0.38;
		const minNodeHeight = 2;
		const targetChartHeight = Math.round(window.innerHeight * 0.697);
		const clubGrossTotal = new Map(
			clubs.map((club) => [
				club.key,
				leaders
					.filter((row) => row.clubKey === club.key)
					.reduce((sum, row) => sum + row.salary, 0),
			]),
		);
		const clubTotalComp = new Map(
			clubs.map((club) => [
				club.key,
				leaders
					.filter((row) => row.clubKey === club.key)
					.reduce((sum, row) => sum + row.salary + row.bonus, 0),
			]),
		);

		const baseRows = leaders.slice().map((row) => {
			const grossBaseHeight = Math.max(minNodeHeight, row.salary * scale);
			const totalBaseHeight = Math.max(
				grossBaseHeight + 2,
				(row.salary + row.bonus) * scale,
			);
			return {
				...row,
				grossBaseHeight,
				totalBaseHeight,
			};
		});

		const totalBaseBarHeight = baseRows.reduce(
			(sum, row) => sum + row.totalBaseHeight,
			0,
		);
		const totalGrossBaseHeight = baseRows.reduce(
			(s, r) => s + r.grossBaseHeight,
			0,
		);
		const fixedHeight =
			chartTop + Math.max(0, baseRows.length - 1) * rowGap + chartBottomPad;
		const availableForBars = Math.max(
			targetChartHeight - fixedHeight,
			totalBaseBarHeight, // ensure multiplier >= 1
		);
		const barHeightMultiplier =
			totalGrossBaseHeight > 0 ? availableForBars / totalGrossBaseHeight : 1;

		const rows = baseRows.map((row) => {
			const grossHeight = row.grossBaseHeight * barHeightMultiplier;
			const totalHeight = Math.max(
				row.totalBaseHeight * barHeightMultiplier,
				grossHeight + 2,
			);
			return {
				...row,
				grossHeight,
				totalHeight,
			};
		});

		const grossRows = rows
			.slice()
			.sort((a, b) => b.salary - a.salary || a.player.localeCompare(b.player));

		const totalRows = rows
			.slice()
			.sort(
				(a, b) =>
					b.salary + b.bonus - (a.salary + a.bonus) ||
					a.player.localeCompare(b.player),
			);

		let grossCursor = chartTop;
		grossRows.forEach((row) => {
			row.grossY0 = grossCursor;
			row.grossY1 = row.grossY0 + row.grossHeight;
			row.grossCenterY = row.grossY0 + row.grossHeight / 2;
			grossCursor += row.grossHeight + rowGap;
		});

		let totalCursor = chartTop;
		totalRows.forEach((row) => {
			row.totalY0 = totalCursor;
			row.totalY1 = row.totalY0 + row.totalHeight;
			row.totalGrossY0 = row.totalY0;
			row.totalGrossY1 = row.totalY0 + row.grossHeight;
			row.totalCenterY = row.totalY0 + row.totalHeight / 2;
			totalCursor += row.totalHeight + rowGap;
		});

		// Update totalGrossY1 based on natural grossHeight (no stretching)
		grossRows.forEach((row) => {
			const totalGrossHeight = Math.min(row.grossHeight, row.totalHeight);
			row.totalGrossY1 = row.totalY0 + totalGrossHeight;
		});

		const baseHeight = Math.max(
			grossCursor - rowGap + chartBottomPad,
			totalCursor - rowGap + chartBottomPad,
			minChartHeight,
		);
		const sortedClubs = clubs
			.slice()
			.sort(
				(a, b) =>
					(clubGrossTotal.get(b.key) ?? 0) - (clubGrossTotal.get(a.key) ?? 0) ||
					a.name.localeCompare(b.name),
			);

		const clubBlocks = sortedClubs.map((club) => {
			const clubRows = rows
				.filter((row) => row.clubKey === club.key)
				.sort(
					(a, b) =>
						b.salary + b.bonus - (a.salary + a.bonus) ||
						a.player.localeCompare(b.player),
				);
			clubRows.forEach((row, i) => {
				row.clubRank = i + 1;
			});
			const grossSpan =
				clubRows.reduce((sum, row) => sum + row.grossHeight, 0) +
				Math.max(0, clubRows.length - 1) * rowGap;
			const clubHeight = grossSpan;

			return {
				club,
				clubRows,
				grossSpan,
				clubHeight,
			};
		});

		let clubBlockCursor = chartTop;

		const layout = clubBlocks.map((block) => {
			const clubY0 = clubBlockCursor;
			let clubCursor =
				clubY0 + Math.max(0, (block.clubHeight - block.grossSpan) / 2);

			block.clubRows.forEach((row) => {
				row.clubSourceY0 = clubCursor;
				row.clubSourceY1 = clubCursor + row.grossHeight;
				clubCursor += row.grossHeight + rowGap;
			});

			clubBlockCursor += block.clubHeight + clubGap;

			return {
				club: block.club,
				clubY0,
				clubY1: clubY0 + block.clubHeight,
				rows: block.clubRows,
			};
		});

		const height = Math.max(
			baseHeight,
			clubBlockCursor - clubGap + chartBottomPad,
		);

		container.innerHTML = "";

		const svg = d3
			.select(container)
			.append("svg")
			.attr("viewBox", `0 0 ${width} ${height}`)
			.attr("role", "img")
			.attr(
				"aria-label",
				"Salary flow chart showing club gross payroll, player gross salary, and final total compensation for the top 15 players at Atletico Madrid, Barcelona, and Real Madrid",
			);

		const ribbonLayer = svg.append("g");
		const nodeLayer = svg.append("g");
		const headerLayer = svg.append("g");
		const clubLabelLayer = svg.append("g");
		const middleClubTotalLayer = svg.append("g");
		const grossLabelLayer = svg.append("g");
		const totalLabelLayer = svg.append("g");
		const middleClubTotalX = middleX + grossNodeWidth + (width < 700 ? 18 : 24);
		const columnLabelY = Math.max(22, chartTop - 8);
		const grossDivisionCenterX = Math.round(
			(leftX + clubNodeWidth + middleX + grossNodeWidth) / 2,
		);
		const totalDivisionCenterX = Math.round(
			(middleX + grossNodeWidth + rightX + totalNodeWidth) / 2,
		);
		const salaryTooltip = d3
			.select(container)
			.append("div")
			.attr("class", "transfers-salary-tooltip")
			.style("opacity", 0)
			.style("pointer-events", "none");
		let activeArmId = null;
		let allLinksDimmed = false;
		let rafTooltipHandle = null;
		let pendingTooltipPoint = null;
		let tooltipWidth = 220;
		let tooltipHeight = 96;

		const updateTooltipSize = () => {
			const ttNode = salaryTooltip.node();
			if (!ttNode) return;
			tooltipWidth = ttNode.offsetWidth || 220;
			tooltipHeight = ttNode.offsetHeight || 96;
		};

		const flushTooltipPosition = () => {
			rafTooltipHandle = null;
			if (!pendingTooltipPoint) return;
			const [px, py] = pendingTooltipPoint;
			const pad = 12;
			const left = Math.max(
				pad,
				Math.min(container.clientWidth - tooltipWidth - pad, px + 14),
			);
			const top = Math.max(
				pad,
				Math.min(
					container.clientHeight - tooltipHeight - pad,
					py - tooltipHeight / 2,
				),
			);
			salaryTooltip.style("left", `${left}px`).style("top", `${top}px`);
		};

		const queueTooltipPosition = (event) => {
			pendingTooltipPoint = d3.pointer(event, container);
			if (rafTooltipHandle !== null) return;
			rafTooltipHandle = window.requestAnimationFrame(flushTooltipPosition);
		};

		const showSalaryTooltip = (row, event) => {
			salaryTooltip
				.html(
					`<div class="transfers-salary-tooltip-player">${row.player}</div>
					<div class="transfers-salary-tooltip-row"><span>Gross</span><strong>${formatSalaryMillions(row.salary, 2)}</strong></div>
					<div class="transfers-salary-tooltip-row"><span>Gross + bonus</span><strong>${formatSalaryMillions(row.salary + row.bonus, 2)}</strong></div>`,
				)
				.style("opacity", 1);
			updateTooltipSize();
			queueTooltipPosition(event);
		};

		const setActiveArm = (armId) => {
			if (activeArmId === armId) return;
			if (activeArmId != null) {
				svg
					.selectAll(
						`.transfers-salary-link[data-salary-arm-id="${activeArmId}"]`,
					)
					.classed("is-hover", false)
					.classed("is-dim", true);
			}

			if (!allLinksDimmed) {
				svg.selectAll(".transfers-salary-link").classed("is-dim", true);
				allLinksDimmed = true;
			}

			activeArmId = armId;
			svg
				.selectAll(`.transfers-salary-link[data-salary-arm-id="${armId}"]`)
				.classed("is-dim", false)
				.classed("is-hover", true);
		};

		const clearActiveArm = () => {
			if (activeArmId == null) {
				salaryTooltip.style("opacity", 0);
				return;
			}
			if (rafTooltipHandle !== null) {
				window.cancelAnimationFrame(rafTooltipHandle);
				rafTooltipHandle = null;
			}
			pendingTooltipPoint = null;
			activeArmId = null;
			allLinksDimmed = false;
			svg
				.selectAll(".transfers-salary-link")
				.classed("is-dim", false)
				.classed("is-hover", false);
			applyTabHighlight();
			salaryTooltip.style("opacity", 0);
		};

		const bindLinkHover = (linkSelection, row) => {
			linkSelection
				.on("mouseenter", function (event) {
					setActiveArm(row.id);
					showSalaryTooltip(row, event);
				})
				.on("mousemove", function (event) {
					if (activeArmId !== row.id) {
						setActiveArm(row.id);
						showSalaryTooltip(row, event);
						return;
					}
					queueTooltipPosition(event);
				})
				.on("touchstart", function (event) {
					setActiveArm(row.id);
					showSalaryTooltip(row, event);
				})
				.on("touchmove", function (event) {
					if (activeArmId !== row.id) {
						setActiveArm(row.id);
						showSalaryTooltip(row, event);
						return;
					}
					queueTooltipPosition(event);
				})
				.on("mouseleave touchend touchcancel", clearActiveArm);
		};

		if (true) {
			headerLayer
				.append("text")
				.attr(
					"class",
					"transfers-salary-column-label transfers-board-coordinate-label",
				)
				.attr("x", grossDivisionCenterX)
				.attr("y", columnLabelY)
				.attr("text-anchor", "middle")
				.text("Gross");

			headerLayer
				.append("text")
				.attr(
					"class",
					"transfers-salary-column-label transfers-board-coordinate-label",
				)
				.attr("x", totalDivisionCenterX)
				.attr("y", columnLabelY)
				.attr("text-anchor", "middle")
				.text("Gross + bonus");
		}

		layout.forEach((block) => {
			block.rows.forEach((row, rowIndex) => {
				const clubGrossThickness = Math.max(
					1,
					row.clubSourceY1 - row.clubSourceY0,
				);
				const grossTotalThickness = Math.max(1, row.grossY1 - row.grossY0);

				const clubGrossLink = ribbonLayer
					.append("path")
					.attr("class", "transfers-salary-link is-club-gross")
					.attr(
						"d",
						buildFlowCurvePath(
							leftX + clubNodeWidth,
							(row.clubSourceY0 + row.clubSourceY1) / 2,
							middleX,
							(row.grossY0 + row.grossY1) / 2,
						),
					)
					.attr("fill", "none")
					.attr("stroke", row.club.color)
					.attr("stroke-opacity", 0.3)
					.attr("stroke-linecap", "butt")
					.attr("data-salary-arm-id", row.id)
					.attr("data-salary-club-rank", rowIndex + 1)
					.attr("stroke-width", clubGrossThickness);
				bindLinkHover(clubGrossLink, row);

				const bonusWedgeLink = ribbonLayer
					.append("path")
					.attr("class", "transfers-salary-link is-bonus-wedge")
					.attr(
						"d",
						buildRibbonPath(
							middleX + grossNodeWidth,
							row.grossY1,
							row.grossY1,
							rightX,
							row.totalGrossY1,
							row.totalY1,
						),
					)
					.attr("fill", row.club.color)
					.attr("data-salary-arm-id", row.id)
					.attr("data-salary-club-rank", rowIndex + 1)
					.attr("fill-opacity", row.bonus > 0 ? 0.65 : 0);
				bindLinkHover(bonusWedgeLink, row);

				const grossToTotalLink = ribbonLayer
					.append("path")
					.attr("class", "transfers-salary-link is-total-salary")
					.attr(
						"d",
						buildFlowCurvePath(
							middleX + grossNodeWidth,
							(row.grossY0 + row.grossY1) / 2,
							rightX,
							(row.totalGrossY0 + row.totalGrossY1) / 2,
						),
					)
					.attr("fill", "none")
					.attr("stroke", row.club.color)
					.attr("stroke-opacity", 0.5)
					.attr("stroke-linecap", "butt")
					.attr("data-salary-arm-id", row.id)
					.attr("data-salary-club-rank", rowIndex + 1)
					.attr("stroke-width", grossTotalThickness);
				bindLinkHover(grossToTotalLink, row);
			});
		});

		const applyTabHighlight = () => {
			svg.selectAll(".transfers-salary-link").each(function () {
				const rank = parseInt(this.dataset.salaryClubRank) || 0;
				d3.select(this).classed(
					"is-tab-dim",
					salaryTopN !== null && rank > salaryTopN,
				);
			});
			svg
				.selectAll(".transfers-salary-player-label[data-salary-club-rank]")
				.each(function () {
					const rank = parseInt(this.dataset.salaryClubRank) || 0;
					d3.select(this).classed(
						"is-tab-dim",
						salaryTopN !== null && rank > salaryTopN,
					);
				});
			svg.selectAll(".transfers-salary-club-label").each(function (d) {
				const limit = salaryTopN ?? Infinity;
				const sum = rows
					.filter((r) => r.clubKey === d.club.key && r.clubRank <= limit)
					.reduce((s, r) => s + r.salary, 0);
				d3.select(this).text(formatSalaryMillions(sum));
			});
			svg.selectAll(".transfers-salary-club-total-label").each(function (d) {
				const limit = salaryTopN ?? Infinity;
				const sum = rows
					.filter((r) => r.clubKey === d.club.key && r.clubRank <= limit)
					.reduce((s, r) => s + r.salary + r.bonus, 0);
				d3.select(this).text(formatSalaryMillions(sum));
			});
		};

		document.querySelectorAll(".transfers-salary-tab").forEach((btn) => {
			btn.addEventListener("click", () => {
				const top = btn.dataset.top;
				salaryTopN = top === "all" ? null : Number(top);
				document.querySelectorAll(".transfers-salary-tab").forEach((b) => {
					b.classList.toggle("is-active", b === btn);
					b.setAttribute("aria-selected", b === btn ? "true" : "false");
				});
				applyTabHighlight();
			});
		});

		const labelsPerClub = 5;
		const showGrossValueLabels = false;
		const showPlayerNameLabels = true;
		const showClubCenterLabels = true;
		const showMiddleTotalLabels = true;

		const visibleLabelIds = new Set(
			clubs.flatMap((club) =>
				rows
					.filter((row) => row.clubKey === club.key)
					.sort(
						(a, b) =>
							b.salary + b.bonus - (a.salary + a.bonus) ||
							a.player.localeCompare(b.player),
					)
					.slice(0, labelsPerClub)
					.map((row) => row.id),
			),
		);
		const visibleLabelRows = rows.filter((row) => visibleLabelIds.has(row.id));

		nodeLayer
			.append("g")
			.selectAll("rect")
			.data(layout)
			.join("rect")
			.attr("class", "transfers-salary-node is-club")
			.attr("x", leftX)
			.attr("y", (d) => d.clubY0)
			.attr("width", clubNodeWidth)
			.attr("height", (d) => Math.max(1, d.clubY1 - d.clubY0))
			.attr("fill", (d) => d.club.color)
			.attr("fill-opacity", 1)
			.append("title")
			.text(
				(d) =>
					`${d.club.name} · gross payroll ${formatSalaryMillions(clubGrossTotal.get(d.club.key) ?? 0)}`,
			);

		nodeLayer
			.append("g")
			.selectAll("rect")
			.data(rows)
			.join("rect")
			.attr("class", "transfers-salary-node is-player-gross")
			.attr("x", middleX)
			.attr("y", (d) => d.grossY0)
			.attr("width", grossNodeWidth)
			.attr("height", (d) => Math.max(1, d.grossY1 - d.grossY0))
			.attr("fill", (d) => d.club.color)
			.attr("fill-opacity", 0.76)
			.append("title")
			.text((d) => `${d.player} · gross ${formatSalaryMillions(d.salary)}`);

		nodeLayer
			.append("g")
			.selectAll("rect")
			.data(rows)
			.join("rect")
			.attr("class", "transfers-salary-node is-player-total")
			.attr("x", rightX)
			.attr("y", (d) => d.totalY0)
			.attr("width", totalNodeWidth)
			.attr("height", (d) => Math.max(1, d.totalY1 - d.totalY0))
			.attr("fill", (d) => d.club.color)
			.attr("fill-opacity", 0.96)
			.append("title")
			.text(
				(d) =>
					`${d.player} · total ${formatSalaryMillions(d.salary + d.bonus)}`,
			);

		if (showClubCenterLabels) {
			// Club gross total inside the club bar
			clubLabelLayer
				.selectAll("text")
				.data(layout)
				.join("text")
				.attr(
					"class",
					"transfers-salary-club-label transfers-highlight-number transfers-highlight-number--secondary",
				)
				.attr("text-anchor", "middle")
				.attr("x", grossDivisionCenterX)
				.attr("y", (d) => (d.clubY0 + d.clubY1) / 2)
				.attr("dy", "0.35em")
				.text((d) => formatSalaryMillions(clubGrossTotal.get(d.club.key) ?? 0));
		}

		if (showMiddleTotalLabels) {
			// Team total comp labels at the gross-to-bonus transition.
			middleClubTotalLayer
				.selectAll("text")
				.data(layout)
				.join("text")
				.attr(
					"class",
					"transfers-salary-club-total-label transfers-highlight-number transfers-highlight-number--secondary",
				)
				.attr("x", totalDivisionCenterX)
				.attr("y", (d) => (d.clubY0 + d.clubY1) / 2)
				.attr("dy", "0.35em")
				.attr("text-anchor", "middle")
				.text((d) => formatSalaryMillions(clubTotalComp.get(d.club.key) ?? 0));
		}

		if (showGrossValueLabels) {
			// Middle labels: gross numbers only.
			grossLabelLayer
				.selectAll("text")
				.data(visibleLabelRows)
				.join("text")
				.attr("class", "transfers-salary-player-label")
				.attr("x", middleX + grossNodeWidth + 4)
				.attr("y", (d) => d.grossCenterY)
				.attr("dy", "0.35em")
				.attr("text-anchor", "start")
				.text((d) => formatSalaryMillions(d.salary));
		}

		if (showPlayerNameLabels) {
			// Final labels: name to the left of total bar.
			totalLabelLayer
				.selectAll("text.transfers-salary-player-name-left")
				.data(visibleLabelRows)
				.join("text")
				.attr(
					"class",
					"transfers-salary-player-label transfers-salary-player-name-left",
				)
				.attr("x", middleX + grossNodeWidth + 4)
				.attr("y", (d) => d.grossCenterY)
				.attr("dy", "0.35em")
				.attr("data-salary-club-rank", (d) => d.clubRank)
				.attr("text-anchor", "start")
				.text((d) => formatSalaryPlayerLabel(d.player));
		}

		totalLabelLayer
			.selectAll("text.transfers-salary-player-total-right")
			.data(visibleLabelRows)
			.join("text")
			.attr(
				"class",
				"transfers-salary-player-label transfers-salary-player-total-right transfers-highlight-number transfers-highlight-number--tertiary",
			)
			.attr("x", rightX - 4)
			.attr("y", (d) => d.totalCenterY)
			.attr("dy", "0.35em")
			.attr("data-salary-club-rank", (d) => d.clubRank)
			.attr("text-anchor", "end")
			.text((d) => formatSalaryMillions(d.salary + d.bonus));
		applyTabHighlight();
	}

	function buildRibbonPath(x0, y0Top, y0Bottom, x1, y1Top, y1Bottom) {
		const controlA = x0 + (x1 - x0) * 0.42;
		const controlB = x0 + (x1 - x0) * 0.58;
		return [
			`M ${x0} ${y0Top}`,
			`C ${controlA} ${y0Top} ${controlB} ${y1Top} ${x1} ${y1Top}`,
			`L ${x1} ${y1Bottom}`,
			`C ${controlB} ${y1Bottom} ${controlA} ${y0Bottom} ${x0} ${y0Bottom}`,
			"Z",
		].join(" ");
	}

	function buildFlowCurvePath(x0, y0, x1, y1) {
		const controlA = x0 + (x1 - x0) * 0.42;
		const controlB = x0 + (x1 - x0) * 0.58;
		return `M ${x0} ${y0} C ${controlA} ${y0} ${controlB} ${y1} ${x1} ${y1}`;
	}

	function formatMillions(value) {
		const absolute = Math.abs(value);
		const digits =
			absolute >= 100 || Number.isInteger(absolute)
				? 0
				: absolute >= 10
					? 1
					: 2;
		const prefix = value < 0 ? "−" : "";
		return `${prefix}€${absolute.toFixed(digits)}m`;
	}

	function formatSalaryMillions(value, decimals = 0) {
		return `€${value.toFixed(decimals)}`;
	}

	function formatSalaryPlayerLabel(name) {
		const parts = name.trim().split(" ");
		return parts[parts.length - 1];
	}

	document.addEventListener("DOMContentLoaded", init);
})();
