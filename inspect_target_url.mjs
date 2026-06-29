import fetch from 'node-fetch';

async function extract() {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRY_bLuau54-txiB9LFpMM7-hwaADWwve8kJYmk-MGlBfpWU0ngx7AZukR0V3At1zzP8hKNCjfj1Ks1/pubhtml';
  console.log('Fetching', url);
  const response = await fetch(url);
  const html = await response.text();
  
  const gids = [];
  const gidRegex = /gid=([0-9]+)/g;
  let match;
  while ((match = gidRegex.exec(html)) !== null) {
    if (!gids.includes(match[1])) gids.push(match[1]);
  }
  
  console.log('GIDs found:', gids);
  
  const getCsv = async (gid) => {
    const csvUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vRY_bLuau54-txiB9LFpMM7-hwaADWwve8kJYmk-MGlBfpWU0ngx7AZukR0V3At1zzP8hKNCjfj1Ks1/pub?gid=${gid}&single=true&output=csv`;
    const res = await fetch(csvUrl);
    return await res.text();
  };

  for (const gid of gids) {
    const csv = await getCsv(gid);
    const lines = csv.split('\n');
    console.log(`GID ${gid} Headers:`, lines[0]);
    console.log(`GID ${gid} Sample Row 1:`, lines[1]);
    console.log(`GID ${gid} Sample Row 2:`, lines[2]);
    console.log(`GID ${gid} Total lines:`, lines.length);
  }
}

extract();
