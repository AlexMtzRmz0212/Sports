"""UEFA Champions League: live league-phase table (ESPN) and every final since 1956.

The finals list is hand-kept: no keyless API covers seven decades of European Cup
finals. Add one line each spring.
"""
from common import espn_table, write_json

# (season ending, champion, runner-up). European Cup until 1992, Champions League since.
FINALS = [
    (1956, "Real Madrid", "Reims"), (1957, "Real Madrid", "Fiorentina"), (1958, "Real Madrid", "AC Milan"),
    (1959, "Real Madrid", "Reims"), (1960, "Real Madrid", "Eintracht Frankfurt"), (1961, "Benfica", "Barcelona"),
    (1962, "Benfica", "Real Madrid"), (1963, "AC Milan", "Benfica"), (1964, "Inter Milan", "Real Madrid"),
    (1965, "Inter Milan", "Benfica"), (1966, "Real Madrid", "Partizan"), (1967, "Celtic", "Inter Milan"),
    (1968, "Manchester United", "Benfica"), (1969, "AC Milan", "Ajax"), (1970, "Feyenoord", "Celtic"),
    (1971, "Ajax", "Panathinaikos"), (1972, "Ajax", "Inter Milan"), (1973, "Ajax", "Juventus"),
    (1974, "Bayern Munich", "Atlético Madrid"), (1975, "Bayern Munich", "Leeds United"), (1976, "Bayern Munich", "Saint-Étienne"),
    (1977, "Liverpool", "Borussia Mönchengladbach"), (1978, "Liverpool", "Club Brugge"), (1979, "Nottingham Forest", "Malmö FF"),
    (1980, "Nottingham Forest", "Hamburg"), (1981, "Liverpool", "Real Madrid"), (1982, "Aston Villa", "Bayern Munich"),
    (1983, "Hamburg", "Juventus"), (1984, "Liverpool", "Roma"), (1985, "Juventus", "Liverpool"),
    (1986, "Steaua București", "Barcelona"), (1987, "Porto", "Bayern Munich"), (1988, "PSV Eindhoven", "Benfica"),
    (1989, "AC Milan", "Steaua București"), (1990, "AC Milan", "Benfica"), (1991, "Red Star Belgrade", "Marseille"),
    (1992, "Barcelona", "Sampdoria"), (1993, "Marseille", "AC Milan"), (1994, "AC Milan", "Barcelona"),
    (1995, "Ajax", "AC Milan"), (1996, "Juventus", "Ajax"), (1997, "Borussia Dortmund", "Juventus"),
    (1998, "Real Madrid", "Juventus"), (1999, "Manchester United", "Bayern Munich"), (2000, "Real Madrid", "Valencia"),
    (2001, "Bayern Munich", "Valencia"), (2002, "Real Madrid", "Bayer Leverkusen"), (2003, "AC Milan", "Juventus"),
    (2004, "Porto", "Monaco"), (2005, "Liverpool", "AC Milan"), (2006, "Barcelona", "Arsenal"),
    (2007, "AC Milan", "Liverpool"), (2008, "Manchester United", "Chelsea"), (2009, "Barcelona", "Manchester United"),
    (2010, "Inter Milan", "Bayern Munich"), (2011, "Barcelona", "Manchester United"), (2012, "Chelsea", "Bayern Munich"),
    (2013, "Bayern Munich", "Borussia Dortmund"), (2014, "Real Madrid", "Atlético Madrid"), (2015, "Barcelona", "Juventus"),
    (2016, "Real Madrid", "Atlético Madrid"), (2017, "Real Madrid", "Juventus"), (2018, "Real Madrid", "Liverpool"),
    (2019, "Liverpool", "Tottenham Hotspur"), (2020, "Bayern Munich", "Paris Saint-Germain"), (2021, "Chelsea", "Manchester City"),
    (2022, "Real Madrid", "Liverpool"), (2023, "Manchester City", "Inter Milan"), (2024, "Real Madrid", "Borussia Dortmund"),
    (2025, "Paris Saint-Germain", "Inter Milan"), (2026, "Paris Saint-Germain", "Arsenal"),
]


def build():
    finals = [{"year": y, "champion": c, "runnerUp": r} for y, c, r in FINALS]
    titles = {}
    for f in finals:
        titles.setdefault(f["champion"], []).append(f["year"])
    by_club = sorted(({"club": c, "titles": len(y), "years": y} for c, y in titles.items()), key=lambda x: (-x["titles"], -x["years"][-1]))
    payload = {"finals": finals, "byClub": by_club}
    try:
        payload["live"] = espn_table("uefa.champions")
    except Exception as e:  # noqa: BLE001
        print(f"  ucl live table: {e}")
        payload["live"] = None
    write_json("ucl", payload)


if __name__ == "__main__":
    build()
