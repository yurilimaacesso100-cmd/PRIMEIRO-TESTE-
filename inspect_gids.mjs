
import fetch from 'node-fetch';

async function extract() {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZD5lc7owHnxnM20hXU4vt6N4jJAkESznhdJPI8GmEsIM-4Ex4hUJXCw-ACeP_3ywOOjNhZaqjLslf/pubhtml';
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
    const csvUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSZD5lc7owHnxnM20hXU4vt6N4jJAkESznhdJPI8GmEsIM-4Ex4hUJXCw-ACeP_3ywOOjNhZaqjLslf/pub?gid=${gid}&single=true&output=csv`;
    const res = await fetch(csvUrl);
    return await res.text();
  };

  for (const gid of gids) {
    const csv = await getCsv(gid);
    console.log(`GID ${gid} Headers:`, csv.split('\n')[0]);
  }
}

extract();
