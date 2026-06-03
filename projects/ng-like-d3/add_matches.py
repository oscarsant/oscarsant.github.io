#!/usr/bin/env python3
"""
Helper script to add World Cup match results to team JSON files.
Run this script and follow the prompts to add matches for any tournament.
"""

import json
import os
from datetime import datetime

TEAMS = {
    'argentina': 'argentina.json',
    'brazil': 'brazil.json',
    'germany': 'germany.json',
    'france': 'france.json',
    'italy': 'italy.json'
}

def load_team_data(team):
    """Load team JSON file"""
    filename = TEAMS.get(team.lower())
    if not filename or not os.path.exists(filename):
        return None
    with open(filename, 'r') as f:
        return json.load(f)

def save_team_data(team, data):
    """Save team JSON file"""
    filename = TEAMS.get(team.lower())
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"✓ Saved to {filename}")

def add_matches_to_tournament(team, year):
    """Add match results to a specific tournament"""
    data = load_team_data(team)
    if not data:
        print(f"Error: Could not load data for {team}")
        return
    
    # Find the tournament
    tournament = None
    tournament_index = None
    for i, t in enumerate(data):
        if t['year'] == year:
            tournament = t
            tournament_index = i
            break
    
    if not tournament:
        print(f"Error: No tournament found for {team} in {year}")
        return
    
    print(f"\n{'='*60}")
    print(f"Adding matches for {team.upper()} - {year} World Cup")
    print(f"Current stage: {tournament.get('stage')} - {tournament.get('round')}")
    print(f"{'='*60}\n")
    
    # Initialize matches array if it doesn't exist
    if 'matches' not in tournament:
        tournament['matches'] = []
    
    print("Paste match results (one per line) in format:")
    print("stage,date,opponent_code,opponent_full,score,result,venue")
    print("Example: GS,2022-11-22,SAU,Saudi Arabia,1-2,L,Lusail Stadium")
    print("Or: QF,2022-12-09,NED,Netherlands,2-2,W,Lusail Stadium,4-3")
    print("(Last field for penalties if applicable)")
    print("\nType 'done' when finished, 'cancel' to abort:\n")
    
    new_matches = []
    while True:
        line = input().strip()
        if line.lower() == 'done':
            break
        if line.lower() == 'cancel':
            print("Cancelled.")
            return
        if not line:
            continue
        
        try:
            parts = [p.strip() for p in line.split(',')]
            if len(parts) < 7:
                print(f"  ⚠️  Skipping (not enough fields): {line}")
                continue
            
            match = {
                'stage': parts[0],
                'date': parts[1],
                'opponent': parts[2],
                'opponent_full': parts[3],
                'score': parts[4],
                'result': parts[5],
                'venue': parts[6]
            }
            
            # Add penalties if provided
            if len(parts) >= 8:
                match['penalties'] = parts[7]
            
            new_matches.append(match)
            result_icon = '✓' if match['result'] == 'W' else '✗' if match['result'] == 'L' else '−'
            print(f"  {result_icon} Added: {match['score']} vs {match['opponent']} ({match['stage']})")
            
        except Exception as e:
            print(f"  ⚠️  Error parsing line: {e}")
    
    if new_matches:
        tournament['matches'] = new_matches
        data[tournament_index] = tournament
        save_team_data(team, data)
        print(f"\n✓ Added {len(new_matches)} matches to {team.upper()} {year}")
    else:
        print("\nNo matches added.")

def main():
    print("\n" + "="*60)
    print("World Cup Match Results Entry Tool")
    print("="*60)
    print("\nAvailable teams:", ', '.join(TEAMS.keys()))
    
    team = input("\nEnter team name: ").strip()
    if team.lower() not in TEAMS:
        print("Invalid team name.")
        return
    
    try:
        year = int(input("Enter year: ").strip())
    except ValueError:
        print("Invalid year.")
        return
    
    add_matches_to_tournament(team, year)

if __name__ == '__main__':
    main()
