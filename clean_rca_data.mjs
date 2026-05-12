import fs from 'fs';

const data = JSON.parse(fs.readFileSync('rcas_data.json', 'utf8'));

const cleanedData = data.slice(0, 150).map(rca => {
    // Detect team based on keys
    let team = "HF";
    if (rca.battles.dove || rca.battles.oral || rca.battles.rexona || rca.battles.sabLiq) {
        team = "BPC";
    }
    
    // Clean name: remove ID prefix if exists
    let name = rca.name;
    if (name.includes(" - ")) {
        const parts = name.split(" - ");
        if (parts[0].trim() === rca.id) {
            name = parts[1].trim();
        }
    }
    // Remove location from name if it's there
    if (name.includes("-")) {
        name = name.split("-")[0].trim();
    }

    return {
        ...rca,
        name: name.toUpperCase(),
        team: team
    };
});

fs.writeFileSync('rcaData_clean.json', JSON.stringify(cleanedData));
console.log(`Cleaned ${cleanedData.length} RCAs`);
