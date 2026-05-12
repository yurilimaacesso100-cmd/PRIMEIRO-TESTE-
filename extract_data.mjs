
import fetch from 'node-fetch';

async function extract() {
  const getCsv = async (gid) => {
    const csvUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSZD5lc7owHnxnM20hXU4vt6N4jJAkESznhdJPI8GmEsIM-4Ex4hUJXCw-ACeP_3ywOOjNhZaqjLslf/pub?gid=${gid}&single=true&output=csv`;
    const res = await fetch(csvUrl);
    return await res.text();
  };

  const parseCsv = (csv) => {
    const lines = csv.split('\n');
    return lines.map(line => {
      const parts = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        else if (line[i] === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += line[i];
        }
      }
      parts.push(current.trim());
      return parts;
    });
  };

  const metasGid = '1084601264';
  const battlesGid = '1840345308';
  
  const metasCsv = await getCsv(metasGid);
  const battlesCsv = await getCsv(battlesGid);
  
  const metasRows = parseCsv(metasCsv);
  const battlesRows = parseCsv(battlesCsv);
  
  const rcas = [];
  
  // Parse Metas
  metasRows.slice(1).forEach(row => {
    const rcaSystemCell = row[0];
    if (!rcaSystemCell || rcaSystemCell === '') return;
    
    const idMatch = rcaSystemCell.match(/^(\d+)/);
    if (!idMatch) return;
    
    const id = idMatch[1];
    // Extract name and region from cell like "33708 - ANA RITA- PASTOS BONS- MA"
    const parts = rcaSystemCell.split('-').map(s => s.trim());
    const name = parts[1] || "";
    const region = parts.slice(2).join(' - ') || "";
    
    const cleanNum = (val) => parseFloat(val?.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');
    
    rcas.push({
      id,
      name,
      region,
      volume: cleanNum(row[2]), // FATURADO
      metaVolume: cleanNum(row[1]), // OBJETIVO
      positivacao: parseInt(row[6] || '0'), // POSIT
      pdvsTotal: parseInt(row[5] || '0'), // OBJ POSIT
      battles: {
        amidos: { meta: 0, realizado: 0, posTela: 0, posTotal: 0 },
        cif: { meta: 0, realizado: 0, posTela: 0, posTotal: 0 },
        mayo: { meta: 0, realizado: 0, posTela: 0, posTotal: 0 },
        poLiq: { meta: 0, realizado: 0, posTela: 0, posTotal: 0 }
      },
      team: (rcaSystemCell.includes('SUL HF') || rcaSystemCell.includes('HF')) ? 'HF' : 'BPC'
    });
  });
  
  // Parse Battles
  let currentRcaId = null;
  battlesRows.forEach(row => {
    const label = row[0];
    if (!label) return;
    
    const idMatch = label.match(/^(\d+)/);
    if (idMatch) {
      currentRcaId = idMatch[1];
    } else if (currentRcaId) {
      const rca = rcas.find(r => r.id === currentRcaId);
      if (rca) {
        const battleData = {
          meta: parseInt(row[1] || '0'),
          realizado: parseInt(row[2] || '0'),
          posTela: parseInt(row[4] || '0'),
          posTotal: parseInt(row[5] || '0')
        };
        
        if (label.includes('AMIDOS')) rca.battles.amidos = battleData;
        else if (label.includes('CIF')) rca.battles.cif = battleData;
        else if (label.includes('MAIONESE')) rca.battles.mayo = battleData;
        else if (label.includes('SABAO')) rca.battles.poLiq = battleData;
      }
    }
  });

  console.log(JSON.stringify(rcas));
}

extract();
