const { ItemsDat } = require('./node_modules/.pnpm/grow-items@2.1.0/node_modules/grow-items/dist/index.js');
const fs = require('fs');
const buf = Array.from(fs.readFileSync('./apps/server/.cache/growtopia/dat/items-v5.42.dat'));
const dat = new ItemsDat(buf);
dat.decode().then(() => {
  console.log('Item 0:', JSON.stringify(dat.meta.items.get('0')?.name));
  console.log('Item 2:', JSON.stringify(dat.meta.items.get('2')?.name));
  console.log('Item 4:', JSON.stringify(dat.meta.items.get('4')?.name));
  console.log('Item 6:', JSON.stringify(dat.meta.items.get('6')?.name));
  console.log('Item 8:', JSON.stringify(dat.meta.items.get('8')?.name));
  console.log('Item 10:', JSON.stringify(dat.meta.items.get('10')?.name));
  console.log('Item 14:', JSON.stringify(dat.meta.items.get('14')?.name));
  console.log('Total items:', dat.meta.items.size);
});
