import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/data/gear-database.ts', 'utf-8');

function addSubcategory(id, subcategory) {
  const idPattern = `id: "${id}"`;
  const idx = content.indexOf(idPattern);
  if (idx === -1) return false;
  const blockEnd = content.indexOf('},', idx);
  const block = content.slice(idx, blockEnd);
  if (block.includes('subcategory:')) return false;
  const catLineIdx = content.indexOf('category:', idx);
  if (catLineIdx === -1 || catLineIdx > blockEnd) return false;
  const catLineEnd = content.indexOf('\n', catLineIdx);
  content = content.slice(0, catLineEnd + 1) + `    subcategory: "${subcategory}",\n` + content.slice(catLineEnd + 1);
  return true;
}

const itemRegex = /id: "([^"]+)"/g;
const items = [];
let match;
while ((match = itemRegex.exec(content)) !== null) {
  const id = match[1];
  const blockStart = match.index;
  const blockEnd = content.indexOf('},', blockStart);
  const block = content.slice(blockStart, blockEnd);
  items.push({ id, block });
}

console.log(`Found ${items.length} items`);
let tagged = 0;

for (const { id, block } of items) {
  if (block.includes('category: "shelter"')) {
    if (block.includes('shelterType: "trekking-pole-tent"')) { if(addSubcategory(id,'trekking-pole-tent')) tagged++; }
    else if (block.includes('shelterType: "freestanding-tent"')) { if(addSubcategory(id,'freestanding-tent')) tagged++; }
    else if (block.includes('shelterType: "tarp"')) { if(addSubcategory(id,'tarp')) tagged++; }
    else if (block.includes('shelterType: "hammock"')) { if(addSubcategory(id,'hammock')) tagged++; }
    else if (block.includes('shelterType: "bivy"')) { if(addSubcategory(id,'bivy')) tagged++; }
    else if (block.includes('shelterType: "pyramid"')) { if(addSubcategory(id,'pyramid')) tagged++; }
  }
  if (block.includes('category: "sleep"')) {
    if (block.includes('sleepStyle: "quilt"')) { if(addSubcategory(id,'quilt')) tagged++; }
    else if (block.includes('sleepStyle: "mummy"') || block.includes('sleepStyle: "semi-rectangular"')) { if(addSubcategory(id,'sleeping-bag')) tagged++; }
    else if (block.includes('rValue:') && !block.includes('tempRating:')) {
      if (block.toLowerCase().includes('foam') || block.toLowerCase().includes('ccf') || block.toLowerCase().includes('closed-cell')) { if(addSubcategory(id,'pad-foam')) tagged++; }
      else if (block.toLowerCase().includes('pump') || block.toLowerCase().includes('inflat')) { if(addSubcategory(id,'pillow')) tagged++; }
      else { if(addSubcategory(id,'pad-inflatable')) tagged++; }
    }
    else if (block.toLowerCase().includes('pillow')) { if(addSubcategory(id,'pillow')) tagged++; }
    else if (block.toLowerCase().includes('underquilt')) { if(addSubcategory(id,'underquilt')) tagged++; }
    else if (block.toLowerCase().includes('liner')) { if(addSubcategory(id,'liner')) tagged++; }
    else if (block.includes('tempRating:')) {
      if (block.toLowerCase().includes('quilt') || block.toLowerCase().includes('open-bottom')) { if(addSubcategory(id,'quilt')) tagged++; }
      else { if(addSubcategory(id,'sleeping-bag')) tagged++; }
    }
  }
  if (block.includes('category: "pack"')) {
    const volMatch = block.match(/volume: (\d+)/);
    if (volMatch) {
      const vol = parseInt(volMatch[1]);
      if (vol <= 15) { if(addSubcategory(id,'running-vest')) tagged++; }
      else if (vol <= 30) { if(addSubcategory(id,'daypack')) tagged++; }
      else if (vol <= 44) { if(addSubcategory(id,'fast-light')) tagged++; }
      else { if(addSubcategory(id,'thru-hike')) tagged++; }
    }
  }
  if (block.includes('category: "kitchen"')) {
    if (block.includes('fuelType:')) { if(addSubcategory(id,'stove')) tagged++; }
    else if (block.toLowerCase().includes('filter') || block.toLowerCase().includes('purif')) { if(addSubcategory(id,'water-filter')) tagged++; }
    else if (block.toLowerCase().includes('bottle') || block.toLowerCase().includes('bladder') || block.toLowerCase().includes('reservoir') || block.toLowerCase().includes('collapsible') || block.toLowerCase().includes('container') || block.toLowerCase().includes('vecto') || block.toLowerCase().includes('hydra')) { if(addSubcategory(id,'water-storage')) tagged++; }
    else if (block.toLowerCase().includes('pot') || block.toLowerCase().includes('mug') || block.toLowerCase().includes('kettle') || block.toLowerCase().includes('cook set') || block.toLowerCase().includes('windscreen') || block.toLowerCase().includes('cozy')) { if(addSubcategory(id,'cookware')) tagged++; }
    else if (block.toLowerCase().includes('meal') || block.toLowerCase().includes('food') || block.toLowerCase().includes('coffee') || block.toLowerCase().includes('instant') || block.toLowerCase().includes('freeze-dried') || block.toLowerCase().includes('ramen') || block.toLowerCase().includes('rice') || block.toLowerCase().includes('butter') || block.toLowerCase().includes('cal,') || block.toLowerCase().includes('cal.') || block.toLowerCase().includes('breakfast') || block.toLowerCase().includes('dinner') || block.toLowerCase().includes('bar') || block.toLowerCase().includes('chew') || block.toLowerCase().includes('waffle') || block.toLowerCase().includes('oatmeal') || block.toLowerCase().includes('tortilla') || block.toLowerCase().includes('tuna') || block.toLowerCase().includes('granola') || block.toLowerCase().includes('mousse')) { if(addSubcategory(id,'food')) tagged++; }
    else if (block.toLowerCase().includes('spork') || block.toLowerCase().includes('spoon') || block.toLowerCase().includes('fork') || block.toLowerCase().includes('lighter') || block.toLowerCase().includes('fuel') || block.toLowerCase().includes('canister') || block.toLowerCase().includes('syringe') || block.toLowerCase().includes('adapter') || block.toLowerCase().includes('spatula') || block.toLowerCase().includes('shaker') || block.toLowerCase().includes('squeeze') || block.toLowerCase().includes('towel') || block.toLowerCase().includes('grill') || block.toLowerCase().includes('wash bag')) { if(addSubcategory(id,'utensils')) tagged++; }
  }
  if (block.includes('category: "electronics"')) {
    if (block.toLowerCase().includes('headlamp') || block.toLowerCase().includes('lantern') || block.toLowerCase().includes('flashlight') || block.toLowerCase().includes('keychain light') || block.toLowerCase().includes('camp light')) { if(addSubcategory(id,'headlamp')) tagged++; }
    else if (block.toLowerCase().includes('watch')) { if(addSubcategory(id,'gps-watch')) tagged++; }
    else if (block.toLowerCase().includes('satellite') || block.toLowerCase().includes('inreach') || block.toLowerCase().includes('messenger') || block.toLowerCase().includes('plb') || block.toLowerCase().includes('zoleo') || block.toLowerCase().includes('spot x')) { if(addSubcategory(id,'satellite')) tagged++; }
    else if (block.toLowerCase().includes('power') || block.toLowerCase().includes('battery') || block.toLowerCase().includes('bank') || block.toLowerCase().includes('mah')) { if(addSubcategory(id,'power')) tagged++; }
    else if (block.toLowerCase().includes('solar')) { if(addSubcategory(id,'solar')) tagged++; }
    else if (block.toLowerCase().includes('app') || block.toLowerCase().includes('caltopo') || block.toLowerCase().includes('gaia') || block.toLowerCase().includes('farout') || block.toLowerCase().includes('alltrails')) { if(addSubcategory(id,'nav-app')) tagged++; }
    else if (block.toLowerCase().includes('camera') || block.toLowerCase().includes('gopro') || block.toLowerCase().includes('insta360')) { if(addSubcategory(id,'camera')) tagged++; }
    else if (block.toLowerCase().includes('cable') || block.toLowerCase().includes('charger') || block.toLowerCase().includes('phone') || block.toLowerCase().includes('strap')) { if(addSubcategory(id,'power')) tagged++; }
    else if (block.toLowerCase().includes('gps') || block.toLowerCase().includes('etrex') || block.toLowerCase().includes('montana')) { if(addSubcategory(id,'nav-app')) tagged++; }
  }
  if (block.includes('category: "safety"')) {
    if (block.toLowerCase().includes('bear')) { if(addSubcategory(id,'bear')) tagged++; }
    else if (block.toLowerCase().includes('first aid') || block.toLowerCase().includes('blister') || block.toLowerCase().includes('splint') || block.toLowerCase().includes('trauma') || block.toLowerCase().includes('moleskin') || block.toLowerCase().includes('afterbite')) { if(addSubcategory(id,'first-aid')) tagged++; }
    else if (block.toLowerCase().includes('repair') || block.toLowerCase().includes('seam') || block.toLowerCase().includes('tenacious') || block.toLowerCase().includes('glue') || block.toLowerCase().includes('duct tape') || block.toLowerCase().includes('aquaseal') || block.toLowerCase().includes('revivex') || block.toLowerCase().includes('trailsmith')) { if(addSubcategory(id,'repair')) tagged++; }
    else if (block.toLowerCase().includes('insect') || block.toLowerCase().includes('deet') || block.toLowerCase().includes('picaridin') || block.toLowerCase().includes('permethrin') || block.toLowerCase().includes('mosquito') || block.toLowerCase().includes('tick') || block.toLowerCase().includes('bug jacket')) { if(addSubcategory(id,'insect')) tagged++; }
    else if (block.toLowerCase().includes('spike') || block.toLowerCase().includes('crampon') || block.toLowerCase().includes('traction') || block.toLowerCase().includes('snowshoe') || block.toLowerCase().includes('ice axe')) { if(addSubcategory(id,'traction')) tagged++; }
    else if (block.toLowerCase().includes('knife') || block.toLowerCase().includes('multi-tool') || block.toLowerCase().includes('leatherman') || block.toLowerCase().includes('victorinox') || block.toLowerCase().includes('morakniv')) { if(addSubcategory(id,'tools')) tagged++; }
    else if (block.toLowerCase().includes('whistle') || block.toLowerCase().includes('mirror') || block.toLowerCase().includes('fire') || block.toLowerCase().includes('matches') || block.toLowerCase().includes('ferro') || block.toLowerCase().includes('lighter') || block.toLowerCase().includes('sunscreen') || block.toLowerCase().includes('lip balm') || block.toLowerCase().includes('compass')) { if(addSubcategory(id,'fire-signal')) tagged++; }
    else if (block.toLowerCase().includes('water') || block.toLowerCase().includes('tablet') || block.toLowerCase().includes('iodine') || block.toLowerCase().includes('steripen')) { if(addSubcategory(id,'first-aid')) tagged++; }
  }
  if (block.includes('category: "accessories"')) {
    if (block.toLowerCase().includes('trekking pole') || block.includes('poleMaterial:')) { if(addSubcategory(id,'trekking-poles')) tagged++; }
    else if (block.toLowerCase().includes('stuff sack') || block.toLowerCase().includes('dry bag') || block.toLowerCase().includes('dry sack') || block.toLowerCase().includes('pack liner') || block.toLowerCase().includes('compression') || block.toLowerCase().includes('food bag') || block.toLowerCase().includes('opsak') || block.toLowerCase().includes('nylofume') || block.toLowerCase().includes('stakes bag')) { if(addSubcategory(id,'stuff-sacks')) tagged++; }
    else if (block.toLowerCase().includes('rain') || block.toLowerCase().includes('poncho') || block.toLowerCase().includes('umbrella') || block.toLowerCase().includes('frogg togg') || block.toLowerCase().includes('rain kilt') || block.toLowerCase().includes('rain wrap')) { if(addSubcategory(id,'rain-gear')) tagged++; }
    else if (block.toLowerCase().includes('jacket') || block.toLowerCase().includes('puff') || block.toLowerCase().includes('wind') || block.toLowerCase().includes('insul') || block.toLowerCase().includes('down par') || block.toLowerCase().includes('fleece') || block.toLowerCase().includes('hoody') || block.toLowerCase().includes('hoodie') || block.toLowerCase().includes('base layer') || block.toLowerCase().includes('vest') || block.toLowerCase().includes('crew')) { if(addSubcategory(id,'insulation')) tagged++; }
    else if (block.toLowerCase().includes('hat') || block.toLowerCase().includes('sun glove') || block.toLowerCase().includes('buff') || block.toLowerCase().includes('headwear') || block.toLowerCase().includes('bandana') || block.toLowerCase().includes('sun sleeve') || block.toLowerCase().includes('gaiter')) { if(addSubcategory(id,'sun-protection')) tagged++; }
    else if (block.toLowerCase().includes('chair') || block.toLowerCase().includes('towel') || block.toLowerCase().includes('seat') || block.toLowerCase().includes('sit pad') || block.toLowerCase().includes('clothesline') || block.toLowerCase().includes('warmer') || block.toLowerCase().includes('snowshoe')) { if(addSubcategory(id,'camp-comfort')) tagged++; }
    else if (block.toLowerCase().includes('soap') || block.toLowerCase().includes('bidet') || block.toLowerCase().includes('trowel') || block.toLowerCase().includes('sanitizer') || block.toLowerCase().includes('head net') || block.toLowerCase().includes('toothbrush') || block.toLowerCase().includes('toothpaste') || block.toLowerCase().includes('wilderness wash')) { if(addSubcategory(id,'hygiene')) tagged++; }
    else if (block.toLowerCase().includes('sock')) { if(addSubcategory(id,'socks')) tagged++; }
    else if (block.toLowerCase().includes('whoopie') || block.toLowerCase().includes('tree strap') || block.toLowerCase().includes('hammock') || block.toLowerCase().includes('dutch clip') || block.toLowerCase().includes('continuous loop') || block.toLowerCase().includes('suspension') || block.toLowerCase().includes('ridgeline') || block.toLowerCase().includes('atlas strap')) { if(addSubcategory(id,'hammock-suspension')) tagged++; }
    else if (block.toLowerCase().includes('shoe') || block.toLowerCase().includes('sandal') || block.toLowerCase().includes('clog') || block.toLowerCase().includes('trail runner') || block.toLowerCase().includes('lone peak') || block.toLowerCase().includes('speedgoat') || block.toLowerCase().includes('cascadia') || block.toLowerCase().includes('altra') || block.toLowerCase().includes('hoka') || block.toLowerCase().includes('salomon') || block.toLowerCase().includes('topo') || block.toLowerCase().includes('xero') || block.toLowerCase().includes('crocs') || block.toLowerCase().includes('bedrock') || block.toLowerCase().includes('brooks') || block.toLowerCase().includes('sportiva')) { if(addSubcategory(id,'sun-protection')) tagged++; }
    else if (block.toLowerCase().includes('pant') || block.toLowerCase().includes('jogger')) { if(addSubcategory(id,'insulation')) tagged++; }
    else if (block.toLowerCase().includes('carabiner') || block.toLowerCase().includes('cord') || block.toLowerCase().includes('paracord') || block.toLowerCase().includes('gear tie') || block.toLowerCase().includes('stake') || block.toLowerCase().includes('peg') || block.toLowerCase().includes('footprint') || block.toLowerCase().includes('groundsheet')) { if(addSubcategory(id,'stuff-sacks')) tagged++; }
    else if (block.toLowerCase().includes('shoulder') || block.toLowerCase().includes('pouch') || block.toLowerCase().includes('fanny') || block.toLowerCase().includes('daypack') || block.toLowerCase().includes('stuff pack')) { if(addSubcategory(id,'stuff-sacks')) tagged++; }
  }
}

writeFileSync('src/data/gear-database.ts', content);
console.log(`Tagged ${tagged} items with subcategories`);
