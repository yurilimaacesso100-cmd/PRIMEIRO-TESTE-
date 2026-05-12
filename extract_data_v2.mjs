
import fetch from 'node-fetch';

async function extract() {
  const gidBase = '576383667';
  const gidBattles = '1873658082';
  const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSu-AB7a5WEcbUwdqYrBbosDZMTXmEqBH-fPWxsairBggIpjz4XmmzXT76maDkCx3ewinpuLWW__-j0/pub';

  const fetchData = async (gid) => {
    const csvUrl = `${baseUrl}?gid=${gid}&single=true&output=csv`;
    const res = await fetch(csvUrl);
    return await res.text();
  };

  const baseCsv = await fetchData(gidBase);
  const battlesCsv = await fetchData(gidBattles);

  const parseMoeda = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
  };

  const rcas = [];
  const baseLines = baseCsv.split('\n').slice(1);
  for (const line of baseLines) {
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split CSV respecting quotes
    if (cols.length < 8) continue;
    
    const rcaFullName = cols[0].replace(/"/g, '');
    const idMatch = rcaFullName.match(/^(\d+)/);
    if (!idMatch) continue;
    const id = idMatch[1];
    const nameMatch = rcaFullName.match(/^\d+ - (.*?) - (.*)$/);
    const name = nameMatch ? nameMatch[1].trim() : rcaFullName;
    const region = nameMatch ? nameMatch[2].trim() : '';

    rcas.push({
      id,
      name,
      region,
      volume: parseMoeda(cols[2].replace(/"/g, '')),
      metaVolume: parseMoeda(cols[1].replace(/"/g, '')),
      positivacao: parseInt(cols[6]) || 0,
      pdvsTotal: parseInt(cols[5]) || 0,
      team: 'HF', // Default
      battles: {}
    });
  }

  // Parse Battles
  const battleLines = battlesCsv.split('\n').slice(1);
  let currentTeam = 'HF';
  let currentRcaId = null;

  for (const line of battleLines) {
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (cols.length < 1) continue;

    const label = cols[0].replace(/"/g, '').trim();
    
    if (label.includes('UNILEVER - SUL HF')) {
      currentTeam = 'HF';
      continue;
    } else if (label.includes('UNILEVER - SUL BPC')) {
      currentTeam = 'BPC';
      continue;
    }

    const idMatch = label.match(/^(\d+)/);
    if (idMatch && cols[1] === '') {
      currentRcaId = idMatch[1];
      const rca = rcas.find(r => r.id === currentRcaId);
      if (rca) rca.team = currentTeam;
      continue;
    }

    if (currentRcaId) {
      const rca = rcas.find(r => r.id === currentRcaId);
      if (rca) {
        const battleKey = label.toLowerCase()
          .replace(/ \+ /g, '_')
          .replace(/ /g, '_')
          .replace(/\+/g, '_')
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Map common names to fixed keys for the UI if possible
        let key = battleKey;
        if (label.includes('AMIDOS')) key = 'amidos';
        if (label.includes('CIF')) key = 'cif';
        if (label.includes('MAIONESE')) key = 'mayo';
        if (label.includes('SABAO')) key = 'poLiq';
        
        if (label.includes('DOVE')) key = 'dove';
        if (label.includes('ORAL')) key = 'oral';
        if (label.includes('REXONA')) key = 'rexona';
        if (label.includes('SAB LIQ')) key = 'sabLiq';

        rca.battles[key] = {
          meta: parseInt(cols[1]) || 0,
          realizado: parseInt(cols[2]) || 0,
          reach: cols[3].replace(/"/g, '').trim(),
          posTela: parseInt(cols[4]) || 0,
          posTotal: parseInt(cols[5]) || 0
        };
      }
    }
  }

  console.log(JSON.stringify(rcas));
}

extract();
