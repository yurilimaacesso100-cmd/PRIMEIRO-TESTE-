
import fetch from 'node-fetch';

async function extract() {
  const gid = '892426632';
  const csvUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vRY_bLuau54-txiB9LFpMM7-hwaADWwve8kJYmk-MGlBfpWU0ngx7AZukR0V3At1zzP8hKNCjfj1Ks1/pub?gid=${gid}&single=true&output=csv`;
  const res = await fetch(csvUrl);
  const csv = await res.text();
  
  console.log(csv.split('\n').slice(0, 20).join('\n'));
}

extract();
