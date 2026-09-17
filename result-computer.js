

const racePointFunction = function(rankPointsArray)
{
    return rank => (rank < rankPointsArray.length) ? rankPointsArray[rank] : 0;
};


const racePointCapFunction = function(pointCap)
{
    return (rank, curPoints) => (curPoints <= pointCap) ? 1 :0;
};

const racePointFunctions = {

    "D10": racePointCapFunction(3), // capped at 3 per team
    "H10": racePointCapFunction(3), // capped at 3 per team

    "D12": racePointFunction([4,3,2,1]),
    "H12": racePointFunction([4,3,2,1]),

    "D12B": racePointCapFunction(3), // capped at 3 per team
    "H12B": racePointCapFunction(3), // capped at 3 per team

    "D14": racePointFunction([4,3,2,1]),
    "H14": racePointFunction([4,3,2,1]),

    "D14B": racePointFunction([2,2,1,1]),
    "H14B": racePointFunction([2,2,1,1]),

    "D16": racePointFunction([4,3,2,1]),
    "H16": racePointFunction([4,3,2,1]),

    "D18": racePointFunction([4,3,2,1]),
    "H18": racePointFunction([4,3,2,1]),

    "D20": racePointFunction([4,3,2,1]),
    "H20": racePointFunction([4,3,2,1]),

    "D20B": racePointFunction([2,2,1,1]),
    "H20B": racePointFunction([2,2,1,1]),

    "D21": racePointFunction([8,7,6,5,4,3,2,1]),
    "H21": racePointFunction([8,7,6,5,4,3,2,1]),

    "D21B": racePointFunction([2,2,2,1,1,1]),
    "H21B": racePointFunction([2,2,2,1,1,1]),

    "D40": racePointFunction([6,5,4,3,2,1]),
    "H40": racePointFunction([6,5,4,3,2,1]),

    "D45B": racePointFunction([2,2,2,1,1,1]),
    "H4BB": racePointFunction([2,2,2,1,1,1]),

    "D50": racePointFunction([6,5,4,3,2,1]),
    "H50": racePointFunction([6,5,4,3,2,1]),

    "D60": racePointFunction([6,5,4,3,2,1]),
    "H60": racePointFunction([6,5,4,3,2,1]),

    "D70": racePointFunction([6,5,4,3,2,1]),
    "H70": racePointFunction([6,5,4,3,2,1]),

    "D80": racePointFunction([4,3,2,1]),
    "H80": racePointFunction([4,3,2,1]),

    "D-let": racePointFunction([2,2,2,1,1,1]),
    "D-let": racePointFunction([2,2,2,1,1,1])

};

const findCategory = function(catArray, name) {
    return catArray.find(c => c.name == name) || { name: name, individualResults: [] };
};

const computeMatchResult = function(matchClubs, oResults) {
    let matchRacePoints = matchClubs.reduce( (a, v) => {a[v] = 0; return a; }, {});
    let r = {
        clubs: matchClubs,
        racePoints: matchRacePoints,
        categories: Object.keys(racePointFunctions)
                .map(k => findCategory(oResults.categories, k))
                .map(c => {
                    let rpFn = racePointFunctions[c.name];
                    let categoryRacePoints = matchClubs.reduce( (a, c) => {a[c] = 0; return a; }, {});
                    let mr = c.individualResults
                        .filter(r => matchClubs.includes(r.club) && r.status == "Ok")
                        .map((r, i) => ({ __proto__: r, racePoints: categoryRacePoints[r.club] += rpFn(i, categoryRacePoints[r.club])}));
                    Object.entries(categoryRacePoints).forEach(kv => matchRacePoints[kv[0]] += kv[1]);
                    return {__proto__: c, matchResults: mr, racePoints: categoryRacePoints};
                })
    };
    return r;
};


const roundRobin = function(clubs) {
    return clubs.flatMap(
        (v, i) => clubs.slice(i+1).map( w => [v, w] )
    );
};

const divisions = [
    [ "Silkeborg OK", "Horsens Orienteringsklub", "OK Pan", "Herning Orienteringsklub" ],
    [ "Aalborg Orienteringsklub", "Mariager Fjord OK", "OK Vendelboerne", "Aarhus 1900 Orientering" ],
    [ "Viborg OK", "KaSki OK", "Randers/Djurs OK", "Nordvest OK", "Rold Skov", "Vestjysk Orienteringsklub" ]
];


const r = divisions.map(clubs => roundRobin(clubs).map(c => computeMatchResult(c, result)));
console.log(r);