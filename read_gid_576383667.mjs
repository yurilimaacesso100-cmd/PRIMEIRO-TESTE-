
import fetch from 'node-fetch';

async function extract() {
  const gid = '576383667';
  const csvUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSu-AB7a5WEcbUwdqYrBbosDZMTXmEqBH-fPWxsairBggIpjz4XmmzXT76maDkCx3ewinpuLWW__-j0/pub?gid=${gid}&single=true&output=csv`;
  const res = await fetch(csvUrl);
  const csv = await res.text();
  
  console.log(csv.split('\n').slice(0, 100).join('\n'));
}

extract();
