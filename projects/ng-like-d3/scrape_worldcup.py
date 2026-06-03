import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

# Years to scrape
years = [1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 
         1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022]

# Teams we're tracking
teams = {
    'Brazil': 'BRA',
    'Argentina': 'ARG',
    'Germany': 'GER',
    'West Germany': 'GER',
    'France': 'FRA',
    'Italy': 'ITA'
}

def get_country_code(name):
    """Convert country name to 3-letter code"""
    codes = {
        'Argentina': 'ARG', 'Australia': 'AUS', 'Austria': 'AUT',
        'Belgium': 'BEL', 'Brazil': 'BRA', 'Bulgaria': 'BUL',
        'Cameroon': 'CMR', 'Chile': 'CHI', 'Colombia': 'COL',
        'Costa Rica': 'CRC', 'Croatia': 'CRO', 'Czech Republic': 'CZE',
        'Czechoslovakia': 'TCH', 'Denmark': 'DEN', 'Ecuador': 'ECU',
        'England': 'ENG', 'France': 'FRA', 'Germany': 'GER',
        'West Germany': 'GER', 'Ghana': 'GHA', 'Greece': 'GRE',
        'Honduras': 'HON', 'Hungary': 'HUN', 'Iran': 'IRN',
        'Italy': 'ITA', 'Ivory Coast': 'CIV', 'Japan': 'JPN',
        'Mexico': 'MEX', 'Morocco': 'MAR', 'Netherlands': 'NED',
        'Nigeria': 'NGA', 'North Korea': 'PRK', 'Norway': 'NOR',
        'Paraguay': 'PAR', 'Peru': 'PER', 'Poland': 'POL',
        'Portugal': 'POR', 'Romania': 'ROU', 'Russia': 'RUS',
        'Saudi Arabia': 'SAU', 'Senegal': 'SEN', 'Serbia': 'SRB',
        'Slovakia': 'SVK', 'Slovenia': 'SVN', 'South Africa': 'RSA',
        'South Korea': 'KOR', 'Spain': 'ESP', 'Sweden': 'SWE',
        'Switzerland': 'SUI', 'Tunisia': 'TUN', 'Turkey': 'TUR',
        'Ukraine': 'UKR', 'United States': 'USA', 'Uruguay': 'URU',
        'Wales': 'WAL', 'Yugoslavia': 'YUG', 'Algeria': 'ALG',
        'Angola': 'ANG', 'Bolivia': 'BOL', 'Bosnia-Herzegovina': 'BIH',
        'Cuba': 'CUB', 'DR Congo': 'COD', 'East Germany': 'GDR',
        'Egypt': 'EGY', 'El Salvador': 'SLV', 'Haiti': 'HAI',
        'Iceland': 'ISL', 'Indonesia': 'IDN', 'Iraq': 'IRQ',
        'Israel': 'ISR', 'Jamaica': 'JAM', 'Kuwait': 'KUW',
        'New Zealand': 'NZL', 'Northern Ireland': 'NIR', 'Panama': 'PAN',
        'Qatar': 'QAT', 'Republic of Ireland': 'IRL', 'Scotland': 'SCO',
        'Soviet Union': 'URS', 'Togo': 'TOG', 'Trinidad and Tobago': 'TRI',
        'United Arab Emirates': 'UAE', 'Zaire': 'ZAI'
    }
    return codes.get(name, name[:3].upper())

def scrape_year(year):
    """Scrape results for a specific year"""
    url = f"https://www.thesoccerworldcups.com/world_cups/{year}_results.php"
    print(f"Scraping {year}...")
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        matches = []
        
        # Find all match results
        # The structure varies by year, so we'll look for common patterns
        tables = soup.find_all('table')
        
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 3:
                    # Try to extract match information
                    text = row.get_text()
                    # Look for score patterns like "2-1" or "3-0"
                    score_match = re.search(r'(\d+)\s*-\s*(\d+)', text)
                    if score_match:
                        matches.append({
                            'text': text.strip(),
                            'row_html': str(row)
                        })
        
        return {
            'year': year,
            'url': url,
            'matches': matches,
            'html_snippet': str(soup)[:2000]  # First 2000 chars for inspection
        }
    
    except Exception as e:
        print(f"Error scraping {year}: {e}")
        return {'year': year, 'error': str(e)}

# Scrape a few years as samples
print("Starting to scrape World Cup results...")
print("This will take a moment as we fetch data from the website...\n")

results = {}
for year in [2022, 2018, 2014, 2010]:  # Start with recent years
    results[year] = scrape_year(year)
    import time
    time.sleep(1)  # Be nice to the server

# Save raw results for inspection
with open('scraped_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\nResults saved to scraped_results.json")
print("Please inspect the file to understand the HTML structure.")
