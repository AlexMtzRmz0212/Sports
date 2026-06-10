import requests
import json
import os

os.system('cls' if os.name == 'nt' else 'clear')

url = "https://v3.football.api-sports.io/fixtures"
headers = {
    'x-rapidapi-key': '4b70fba0d3e0581e419e2bdbb6054bcf',
    'x-rapidapi-host': 'v3.football.api-sports.io'
}

seasons = [2021, 2022, 2023]
league_id = 262

for season in seasons:
    filename = f"fixtures_{season}.json"
    if os.path.exists(filename):
        update = input(f"{filename} already exists. Do you want to update it? (y/n): ").strip().lower()
        if update != 'y':
            print(f"Skipped updating {filename}.")
            continue
    else:
        update = input(f"{filename} does not exist. The request will be made. Be aware of the free trial requests limit. Would you like to proceed? (y/n): ").strip().lower()
        if update != 'y':
            print(f"Skipped updating {filename}.")
            continue    

    params = {
        'league': league_id,
        'season': season
    }
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"Saved fixtures for season {season} to {filename}")
