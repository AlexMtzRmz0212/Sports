import requests
import os
os.system('cls' if os.name == 'nt' else 'clear')

def fetch_leagues(country, sport):
    url = f"https://www.thesportsdb.com/api/v1/json/123/search_all_leagues.php?c={country}&s={sport}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json().get("countries", [])
    else:
        return None

def fetch_teams(league_id):
    url = f"https://www.thesportsdb.com/api/v1/json/123/lookup_all_teams.php?id={league_id}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json().get("teams", [])
    else:
        return None

if __name__ == "__main__":
    country = "Mexico"
    sport = "Soccer"
    leagues = fetch_leagues(country, sport)
    league_id = None
    league_name = None
    if leagues:
        for league in leagues:
            if league.get("strLeague", "").lower() in ["liga mx", "mexican primera league"]:
                league_id = league.get("idLeague")
                league_name = league.get("strLeague")
                break
    if league_id:
        print(f"Fetching teams for {league_name} (id: {league_id})...")
        teams = fetch_teams(league_id)
        if teams:
            for team in teams:
                print(team.get("strTeam", "Unknown Team"))
        else:
            print("No teams found.")
    else:
        print("Liga MX league not found.")


    print("THIS CODE DOESNT WORK, BECAUSE THE LEAGUE ID IS NOT RELATED TO THE MEX LEAGUE")
