
import fetch from 'node-fetch';

async function extract() {
  const getCsv = async (gid) => {
    const csvUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSZD5lc7owHnxnM20hXU4vt6N4jJAkESznhdJPI8GmEsIM-4Ex4hUJXCw-ACeP_3ywOOjNhZaqjLslf/pub?gid=${gid}&single=true&output=csv`;
    const res = await fetch(csvUrl);
    return await res.text();
  };

  const gid = '1084601264';
  const csv = await getCsv(gid);
  console.log(csv.split('\n').slice(0, 50).join('\n'));
}

extract();
