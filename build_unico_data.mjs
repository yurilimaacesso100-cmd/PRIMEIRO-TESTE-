import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csvContent) {
  const lines = csvContent.split(/\r?\n/);
  if (lines.length === 0 || !lines[0]) return [];
  const headers = parseCSVLine(lines[0]);
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = parseCSVLine(line);
    
    // Create record matching headers
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }
  return records;
}

async function run() {
  const urlNumericasHc = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRY_bLuau54-txiB9LFpMM7-hwaADWwve8kJYmk-MGlBfpWU0ngx7AZukR0V3At1zzP8hKNCjfj1Ks1/pub?gid=0&single=true&output=csv';
  const urlPonderadasHc = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRY_bLuau54-txiB9LFpMM7-hwaADWwve8kJYmk-MGlBfpWU0ngx7AZukR0V3At1zzP8hKNCjfj1Ks1/pub?gid=1512938029&single=true&output=csv';
  const urlNumericasPc = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRY_bLuau54-txiB9LFpMM7-hwaADWwve8kJYmk-MGlBfpWU0ngx7AZukR0V3At1zzP8hKNCjfj1Ks1/pub?gid=374244062&single=true&output=csv';
  const urlPonderadasPc = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRY_bLuau54-txiB9LFpMM7-hwaADWwve8kJYmk-MGlBfpWU0ngx7AZukR0V3At1zzP8hKNCjfj1Ks1/pub?gid=1265667298&single=true&output=csv';
  const urlCob = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRY_bLuau54-txiB9LFpMM7-hwaADWwve8kJYmk-MGlBfpWU0ngx7AZukR0V3At1zzP8hKNCjfj1Ks1/pub?gid=892426632&single=true&output=csv';

  console.log('Fetching Numéricas HC e NT...');
  const resNumHc = await fetch(urlNumericasHc);
  const csvNumHc = await resNumHc.text();
  const rawNumHc = parseCSV(csvNumHc);

  console.log('Fetching Ponderadas HC e NT...');
  const resPondHc = await fetch(urlPonderadasHc);
  const csvPondHc = await resPondHc.text();
  const rawPondHc = parseCSV(csvPondHc);

  console.log('Fetching Numéricas PC e BW...');
  const resNumPc = await fetch(urlNumericasPc);
  const csvNumPc = await resNumPc.text();
  const rawNumPc = parseCSV(csvNumPc);

  console.log('Fetching Ponderadas PC e BW...');
  const resPondPc = await fetch(urlPonderadasPc);
  const csvPondPc = await resPondPc.text();
  const rawPondPc = parseCSV(csvPondPc);

  console.log('Fetching COB...');
  const resCob = await fetch(urlCob);
  const csvCob = await resCob.text();
  const rawCob = parseCSV(csvCob);

  const getVal = (item, possibleKeys) => {
    for (const key of possibleKeys) {
      if (item[key] !== undefined) return item[key];
      const lowerKey = key.trim().toLowerCase();
      for (const rawKey of Object.keys(item)) {
        if (rawKey.trim().toLowerCase() === lowerKey) {
          return item[rawKey];
        }
      }
    }
    return '';
  };

  console.log('Parsing Numéricas HC e NT...');
  const numericasHc = rawNumHc.map(item => {
    const codCliente = (getVal(item, ['COD CLI', 'COD CLIENTE', 'COD_CLI', 'CODIGO CLIENTE', 'COD CLIENTES']) || '').toString().trim();
    const codVendedor = (getVal(item, ['COD VENDEDOR', 'COD DO VENDEDOR', 'COD_VENDEDOR', 'COD RCA', 'COD_RCA', 'RCA_COD', 'CODIGO VENDEDOR']) || '').toString().trim();
    return {
      cnpj: (getVal(item, ['CNPJ']) || '').toString().trim(),
      codCliente,
      cliente: (getVal(item, ['CLIENTES', 'CLIENTE', 'NOME CLIENTE']) || '').toString().trim(),
      cidade: (getVal(item, ['CIDADES', 'CIDADE']) || '').toString().trim(),
      classificacao: (getVal(item, ['CLASSIFICAÇÃO', 'CLASSIFICACAO', 'CLASS']) || '').toString().trim(),
      codVendedor,
      vendedor: (getVal(item, ['VENDEDOR', 'NOME VENDEDOR', 'RCA', 'NOME RCA']) || '').toString().trim(),
      objSortHc: parseInt(getVal(item, ['OBJ SORT HC', 'OBJ_SORT_HC'])) || 0,
      objSortNt: parseInt(getVal(item, ['OBJ SORT NT', 'OBJ_SORT_NT'])) || 0,
    };
  }).filter(item => item.codCliente && item.codVendedor);

  console.log('Parsing Ponderadas HC e NT...');
  const ponderadasHc = rawPondHc.map(item => {
    const codCliente = (getVal(item, ['COD CLI', 'COD CLIENTE', 'COD_CLI', 'CODIGO CLIENTE', 'COD CLIENTES']) || '').toString().trim();
    const codVendedor = (getVal(item, ['COD VENDEDOR', 'COD DO VENDEDOR', 'COD_VENDEDOR', 'COD RCA', 'COD_RCA', 'RCA_COD', 'CODIGO VENDEDOR']) || '').toString().trim();
    return {
      classificacao: (getVal(item, ['CLASSIFICAÇÃO', 'CLASSIFICACAO', 'CLASS']) || '').toString().trim(),
      cnpj: (getVal(item, ['CNPJ']) || '').toString().trim(),
      codCliente,
      cliente: (getVal(item, ['CLIENTES', 'CLIENTE', 'NOME CLIENTE']) || '').toString().trim(),
      cidade: (getVal(item, ['CIDADES', 'CIDADE']) || '').toString().trim(),
      codVendedor,
      vendedor: (getVal(item, ['VENDEDOR', 'NOME VENDEDOR', 'RCA', 'NOME RCA']) || '').toString().trim(),
      metaHc: (getVal(item, ['META HC', 'META_HC']) || '').toString().trim(),
      objSortHc: parseInt(getVal(item, ['OBJ SORT HC', 'OBJ_SORT_HC'])) || 0,
      metaNt: (getVal(item, ['META NT', 'META_NT']) || '').toString().trim(),
      objSortNt: parseInt(getVal(item, ['OBJ SORT NT', 'OBJ_SORT_NT'])) || 0,
    };
  }).filter(item => item.codCliente && item.codVendedor);

  console.log('Parsing Numéricas PC e BW...');
  const numericasPc = rawNumPc.map(item => {
    const codCliente = (getVal(item, ['COD CLI', 'COD CLIENTE', 'COD_CLI', 'CODIGO CLIENTE', 'COD CLIENTES']) || '').toString().trim();
    const codVendedor = (getVal(item, ['COD RCA', 'COD VENDEDOR', 'COD DO VENDEDOR', 'COD_VENDEDOR', 'COD_RCA', 'RCA_COD', 'CODIGO VENDEDOR']) || '').toString().trim();
    return {
      cnpj: (getVal(item, ['CNPJ']) || '').toString().trim(),
      codCliente,
      cliente: (getVal(item, ['CLIENTES', 'CLIENTE', 'NOME CLIENTE']) || '').toString().trim(),
      cidade: (getVal(item, ['CIDADES', 'CIDADE']) || '').toString().trim(),
      classificacao: (getVal(item, ['CLASSIFICAÇÃO', 'CLASSIFICACAO', 'CLASS']) || '').toString().trim(),
      codVendedor,
      vendedor: (getVal(item, ['RCA', 'NOME RCA', 'VENDEDOR', 'NOME VENDEDOR']) || '').toString().trim(),
      objSortBw: parseInt(getVal(item, ['OBJ SORT BW', 'OBJ_SORT_BW'])) || 0,
      objSortPc: parseInt(getVal(item, ['OBJ SORT PC', 'OBJ_SORT_PC'])) || 0,
    };
  }).filter(item => item.codCliente && item.codVendedor);

  console.log('Parsing Ponderadas PC e BW...');
  const ponderadasPc = rawPondPc.map(item => {
    const codCliente = (getVal(item, ['COD CLI', 'COD CLIENTE', 'COD_CLI', 'CODIGO CLIENTE', 'COD CLIENTES']) || '').toString().trim();
    const codVendedor = (getVal(item, ['COD RCA', 'COD VENDEDOR', 'COD DO VENDEDOR', 'COD_VENDEDOR', 'COD_RCA', 'RCA_COD', 'CODIGO VENDEDOR']) || '').toString().trim();
    return {
      classificacao: (getVal(item, ['CLASSIFICAÇÃO', 'CLASSIFICACAO', 'CLASS']) || '').toString().trim(),
      cnpj: (getVal(item, ['CNPJ']) || '').toString().trim(),
      codCliente,
      cliente: (getVal(item, ['CLIENTES', 'CLIENTE', 'NOME CLIENTE']) || '').toString().trim(),
      cidade: (getVal(item, ['CIDADES', 'CIDADE']) || '').toString().trim(),
      codVendedor,
      vendedor: (getVal(item, ['RCA', 'NOME RCA', 'VENDEDOR', 'NOME VENDEDOR']) || '').toString().trim(),
      metaBw: (getVal(item, ['META BW', 'META_BW']) || '').toString().trim(),
      objSortBw: parseInt(getVal(item, ['OBJ SORT BW', 'OBJ_SORT_BW'])) || 0,
      objSortPc: parseInt(getVal(item, ['OBJ SORT PC', 'OBJ_SORT_PC'])) || 0,
    };
  }).filter(item => item.codCliente && item.codVendedor);

  console.log('Parsing COB...');
  const cob = rawCob.map(item => {
    const codCliente = (getVal(item, ['COD CLI', 'COD CLIENTE', 'COD_CLI', 'CODIGO CLIENTE', 'COD CLIENTES']) || '').toString().trim();
    const codVendedor = (getVal(item, ['COD RCA', 'COD VENDEDOR', 'COD DO VENDEDOR', 'COD_VENDEDOR', 'COD_RCA', 'RCA_COD', 'CODIGO VENDEDOR']) || '').toString().trim();
    return {
      codVendedor,
      codCliente,
      cnpj: (getVal(item, ['CNPJ']) || '').toString().trim(),
      cliente: (getVal(item, ['CLIENTES', 'CLIENTE', 'NOME CLIENTE']) || '').toString().trim(),
      cidade: (getVal(item, ['CIDADES', 'CIDADE']) || '').toString().trim(),
      vendedor: (getVal(item, ['VENDEDOR', 'NOME VENDEDOR', 'RCA', 'NOME RCA']) || '').toString().trim(),
    };
  }).filter(item => item.codCliente && item.codVendedor);

  const finalData = {
    numericas: numericasHc, // legacy fallback
    ponderadas: ponderadasHc, // legacy fallback
    numericasHc,
    ponderadasHc,
    numericasPc,
    ponderadasPc,
    cob,
    lastUpdate: new Date().toISOString()
  };

  const targetDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, 'unico_data.json');
  fs.writeFileSync(targetPath, JSON.stringify(finalData, null, 2));
  console.log(`Saved ${numericasHc.length} numéricas HC, ${ponderadasHc.length} ponderadas HC, ${numericasPc.length} numéricas PC, ${ponderadasPc.length} ponderadas PC, and ${cob.length} COB to ${targetPath}`);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
