import json

# from json file get the list of referees

def get_referees_from_json(json_file_path):
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    referees = set()
    for item in data.get('response', []):
        referee = item.get('fixture', {}).get('referee')
        if referee:
            referees.add(referee)
    return list(referees)

# Example usage:
if __name__ == "__main__":
    json_file_path = 'fixtures_2021.json'
    referees = get_referees_from_json(json_file_path)
    print("List of referees:")
    for referee in referees:
        print(referee)
