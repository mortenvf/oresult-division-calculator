

async function getData() {
  const url = "results/2026-09-06-divisionsmatch.json";
  try {
    const response = await fetch(url, {
        method: "GET",
        headers: {'access-control-request-headers': 'content-type', origin: null}
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
}

async function fetchResults(slug) {
    return fetch(`results/${slug}.json`, { method: "GET" })
    .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }  
        return response.json();
  });
}


const racePointFunction = function(rankPointsArray)
{
    let fn = rank => (rank < rankPointsArray.length) ? rankPointsArray[rank] : 0;
    fn.rankPointsArray = rankPointsArray;
    fn.count = rankPointsArray.length;
    return fn;
};


const racePointFunctions = {

    "D10": racePointFunction([1,1,1,1,1,1]),
    "H10": racePointFunction([1,1,1,1,1,1]),

    "D12": racePointFunction([4,3,2,1]),
    "H12": racePointFunction([4,3,2,1]),

    "D12B": racePointFunction([1,1,1,1,1,1]), 
    "H12B": racePointFunction([1,1,1,1,1,1]),

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
    "H45B": racePointFunction([2,2,2,1,1,1]),

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

//Compute match points from race point results.
const computeMatchPoints = function(matchRacePoints) {

    const x = Object.entries(matchRacePoints).reduce(
        (a, c) => {
            if (c[1] > a.racePoints) { return {clubs: [c[0]], racePoints: c[1]}; }
            else if (c[1] == a.racePoints) { a.clubs.push(c[0]); a.racePoints++; }
            return a;
        },
        { clubs: [], racePoints: 0 }
    );

    return Object.keys(matchRacePoints).reduce( (a, c) => {
        a[c] = x.clubs.includes(c) ? 2 / x.clubs.length : 0;
        return a;
    }, {});

}

const computeMatchResult = function(matchClubs, oResults) {
    let matchRacePoints = matchClubs.reduce( (a, v) => {a[v] = 0; return a; }, {});
    let r = {
        clubs: matchClubs,
        racePoints: matchRacePoints,
        categories: Object.keys(racePointFunctions)
                .map(categoryName => findCategory(oResults.categories, categoryName))
                .map(c => {
                    let rpFn = racePointFunctions[c.name];
                    let categoryRacePoints = matchClubs.reduce( (a, c) => {a[c] = { racePoints: 0, count: 0 } ; return a; }, {});
                    let rank = 0;
                    let mr = c.individualResults
                        .filter(r => matchClubs.includes(r.club))
                        .map((r, i) => {
                            let rp = 0;
                            if (r.status == "Ok" && categoryRacePoints[r.club].count < rpFn.count / 2 ) {
                                rp = rpFn(rank);
                                categoryRacePoints[r.club].count++;
                                rank++;
                            }
                            categoryRacePoints[r.club].racePoints += rp;
                            return { __proto__: r, racePoints: rp };
                        });
                    Object.entries(categoryRacePoints).forEach(kv => { matchRacePoints[kv[0]] += kv[1].racePoints; });
                    return {__proto__: c, matchResults: mr, racePoints: categoryRacePoints};
                })
    };

    r.matchPoints = computeMatchPoints(matchRacePoints);

    return r;
};


// Compute all round robin tournament combinations of the given clubs.
const roundRobin = function(clubs) {
    return clubs.flatMap(
        (v, i) => clubs.slice(i+1).map( w => [v, w] )
    );
};


// Compute all pairwise match results for the given clubs.
const computeDivisionResult = function(clubs, oResult) {

    const r = roundRobin(clubs).map(c => computeMatchResult(c, oResult));

    r.clubs = clubs;
    r.racePoints = clubs.reduce( (a, v) => {a[v] = 0; return a; }, {});
    r.matchPoints = clubs.reduce( (a, v) => {a[v] = 0; return a; }, {});
    r.forEach(
        m => {
            m.clubs.forEach(c => {
                r.racePoints[c] += m.racePoints[c];
                r.matchPoints[c] += m.matchPoints[c];
            });
        }
    );

    return r;

}



const fmtTime = function(secs) {
     const s = secs % 60;
     const minutes = (secs - s) / 60;
     const m = minutes % 60;
     const h = (minutes - m) / 60;
     return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}



function makeTable(tbody, r) {
    
    const mSep = "&ndash;";
    console.log(r);
    
    const statusRender = p => (p.status == "Ok") ? ` (${fmtTime(p.time)}) ` : ` (${p.status}) `;
    const pointRender = p => (p.status == "Ok") ? `${p.racePoints}` : "";

    const appendToTableBody = function(tbody, r){

        for (var m of r) {
            const [c0, c1] = m.clubs;
            tbody.insertAdjacentHTML("beforeend", `<tr class="matchHeader"><td>${c0}</td><td>${m.racePoints[c0]}</td><td>${mSep}</td><td>${m.racePoints[c1]}<td>${c1}</td></tr>`);
            tbody.insertAdjacentHTML("beforeend", `<tr class="matchHeader"><td /><td>${m.matchPoints[c0]}</td><td>${mSep}</td><td>${m.matchPoints[c1]}<td /></tr>`);
            for (var c of m.categories) {
                tbody.insertAdjacentHTML("beforeend", `<tr class="catHeader"><td>${c.name}</td><td>${c.racePoints[c0].racePoints}</td><td>${mSep}</td><td>${c.racePoints[c1].racePoints}<td>${c.name}</td></tr>`);
                for (var p of c.matchResults) {
                    if (p.club == c0) {
                        tbody.insertAdjacentHTML("beforeend", `<tr class="indivRes"><td>${p.name}${statusRender(p)}</td><td>${pointRender(p)}</td><td /><td /><td /></tr>`);
                    }
                    else if (p.club == c1){
                        tbody.insertAdjacentHTML("beforeend", `<tr class="indivRes"><td /><td /><td /><td>${pointRender(p)}<td>${statusRender(p)}${p.name}</td></tr>`);
                    }
                }
            }
        }
    };

    appendToTableBody(tbody, r);

}


const divisions = [
    [ "Silkeborg OK", "Horsens Orienteringsklub", "OK Pan", "Herning Orienteringsklub" ],
    [ "Aalborg Orienteringsklub", "Mariager Fjord OK", "OK Vendelboerne", "Aarhus 1900 Orientering" ],
    [ "Viborg OK", "KaSki OK", "Randers/Djurs OK", "Nordvest OK", "Rold Skov", "Vestjysk Orienteringsklub" ]
];


const main = function() {

    fetchResults("2026-05-10-1division-2division-3division").then(results => {
        const r0 = computeDivisionResult(divisions[0], results.result);
        makeTable(document.querySelector("#rnd1div1>tbody"), r0)
        const r1 = computeDivisionResult(divisions[1], results.result);
        makeTable(document.querySelector("#rnd1div2>tbody"), r1)
        const r2 = computeDivisionResult(divisions[2], results.result);
        makeTable(document.querySelector("#rnd1div3>tbody"), r2)
    });


    fetchResults("2026-09-06-divisionsmatch").then(results => {
        const r0 = computeDivisionResult(divisions[0], results.result);
        makeTable(document.querySelector("#rnd2div1>tbody"), r0)
    });

    fetchResults("2026-08-30-aabne-klasser").then(results => {

        const r1 = computeDivisionResult(divisions[1], results.result);
        makeTable(document.querySelector("#rnd2div2>tbody"), r1)

        const r2 = computeDivisionResult(divisions[2], results.result);
        makeTable(document.querySelector("#rnd2div3>tbody"), r2)
    });


}

