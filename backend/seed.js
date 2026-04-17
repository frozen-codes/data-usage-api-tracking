require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});
const datasetDir = path.resolve(__dirname, '../all-india-villages-master-list-excel/dataset');

async function seed() {
  const files = fs.readdirSync(datasetDir).filter(f => !f.startsWith('.'));
  
  for (const file of files) {
    const filePath = path.join(datasetDir, file);
    console.log(`Processing ${file}...`);
    
    let workbook;
    try {
      workbook = xlsx.readFile(filePath);
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
      continue;
    }
    
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });
    
    if (!data || data.length === 0) continue;
    
    const columns = Object.keys(data[0]);
    const getCol = (keywords) => {
      return columns.find(c => keywords.some(k => c.toUpperCase().includes(k)));
    };
    
    const stateCol = getCol(['STATE NAME', 'STATE_NAME']);
    const distCol = getCol(['DISTRICT NAME', 'DISTRICT_NAME']);
    const subCol = getCol(['SUB-DISTRICT NAME', 'SUB_DIST', 'SUB DIST']);
    const villCol = getCol(['AREA NAME', 'AREA_NAME', 'VILLAGE']);
    
    if (!stateCol || !distCol || !subCol || !villCol) {
      console.error(`Skipping ${file}: Columns not matched -> State: ${stateCol}, Dist: ${distCol}, Sub: ${subCol}, Vill: ${villCol}`);
      continue;
    }
    
    console.log(`Found cols: ${stateCol}, ${distCol}, ${subCol}, ${villCol}`);
    
    // Process unique locations in-memory before saving to optimize
    for (const row of data) {
      const stateName = String(row[stateCol]).trim();
      const distName = String(row[distCol]).trim();
      const subName = String(row[subCol]).trim();
      const villName = String(row[villCol]).trim();
      
      if (!stateName || stateName === 'undefined' || !villName || villName === 'undefined') continue;
      // Skip state/district summary rows where area name might be the same as state
      if (villName === stateName && !subName) continue;
      
      // UPSERT State
      const state = await prisma.state.upsert({
        where: { id: parseInt(row['MDDS STC']) || -1 }, // Try upsert by ID or Name if we had an alternate unique key
        update: {},
        create: { name: stateName }
      }).catch(async (e) => {
        // If unique constraint or something fails, fallback to findFirst/create
        let s = await prisma.state.findFirst({ where: { name: stateName } });
        if (!s) s = await prisma.state.create({ data: { name: stateName } });
        return s;
      });
      
      let s = await prisma.state.findFirst({ where: { name: stateName } });
      if (!s) s = await prisma.state.create({ data: { name: stateName } });

      let d = await prisma.district.findFirst({ where: { name: distName, state_id: s.id } });
      if (!d) d = await prisma.district.create({ data: { name: distName, state_id: s.id } });
      
      let sd = await prisma.subDistrict.findFirst({ where: { name: subName, district_id: d.id } });
      if (!sd) sd = await prisma.subDistrict.create({ data: { name: subName, district_id: d.id } });
      
      // Since a dataset can have thousands of villages, findFirst per row for Village is slow. We just create them.
      // Actually doing this per row is extremely slow. We should batch.
    }
  }
}

// Rewriting for performance
async function seedBatch() {
  const files = fs.readdirSync(datasetDir).filter(f => !f.startsWith('.'));
  
  // Cache to avoid db roundtrips
  const cache = { states: {}, districts: {}, subDistricts: {} };
  
  for (const file of files.slice(0, 5)) { // Just 5 files downsized for prototyping otherwise it'll take hours
    const filePath = path.join(datasetDir, file);
    console.log(`Processing ${file}...`);
    
    let workbook;
    try {
      workbook = xlsx.readFile(filePath);
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
      continue;
    }
    
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });
    if (!data || data.length === 0) continue;
    
    const columns = Object.keys(data[0]);
    const stateCol = columns.find(c => c.toUpperCase().includes('STATE NAME'));
    const distCol = columns.find(c => c.toUpperCase().includes('DISTRICT NAME'));
    const subCol = columns.find(c => c.toUpperCase().includes('SUB-DISTRICT') || c.toUpperCase().includes('SUB_DIST'));
    const villCol = columns.find(c => c.toUpperCase().includes('AREA NAME'));
    
    if (!stateCol || !distCol || !subCol || !villCol) continue;
    
    const villageCreates = [];
    
    for (const row of Object.values(data)) {
        const stateName = String(row[stateCol] || '').trim();
        const distName = String(row[distCol] || '').trim();
        const subName = String(row[subCol] || '').trim();
        const villName = String(row[villCol] || '').trim();
        
        if (!stateName || !distName || !subName || !villName) continue;
        if (["N.A.", "UNDEFINED", "NULL", ""].includes(villName.toUpperCase())) continue;
        
        // 1. STATE
        if (!cache.states[stateName]) {
            let s = await prisma.state.findFirst({ where: { name: stateName } });
            if (!s) s = await prisma.state.create({ data: { name: stateName } });
            cache.states[stateName] = s.id;
        }
        const stateId = cache.states[stateName];
        
        // 2. DISTRICT
        const dKey = `${stateId}-${distName}`;
        if (!cache.districts[dKey]) {
            let d = await prisma.district.findFirst({ where: { name: distName, state_id: stateId } });
            if (!d) d = await prisma.district.create({ data: { name: distName, state_id: stateId } });
            cache.districts[dKey] = d.id;
        }
        const districtId = cache.districts[dKey];
        
        // 3. SUBDISTRICT
        const sdKey = `${districtId}-${subName}`;
        if (!cache.subDistricts[sdKey]) {
            let sd = await prisma.subDistrict.findFirst({ where: { name: subName, district_id: districtId } });
            if (!sd) sd = await prisma.subDistrict.create({ data: { name: subName, district_id: districtId } });
            cache.subDistricts[sdKey] = sd.id;
        }
        const subId = cache.subDistricts[sdKey];
        
        // 4. VILLAGE
        villageCreates.push({ name: villName, sub_district_id: subId });
    }
    
    // Batch insert villages
    if (villageCreates.length > 0) {
        console.log(`Inserting ${villageCreates.length} villages...`);
        // slice to avoid SQLite limit
        const chunkSize = 2000;
        for (let i = 0; i < villageCreates.length; i += chunkSize) {
            await prisma.village.createMany({
                data: villageCreates.slice(i, i + chunkSize)
            });
        }
    }
  }
}

seedBatch().then(() => {
  console.log("Seeding complete.");
  prisma.$disconnect();
}).catch(e => {
  console.error(e);
  prisma.$disconnect();
});
