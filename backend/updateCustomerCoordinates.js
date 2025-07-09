const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('swifttiger', 'swifttiger', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

// Puerto Rico geographic regions with approximate coordinates
const PUERTO_RICO_REGIONS = {
  'San Juan Metro': {
    center: { lat: 18.4655, lng: -66.1057 },
    radius: 0.1 // degrees
  },
  'Bayamon': {
    center: { lat: 18.3989, lng: -66.1614 },
    radius: 0.08
  },
  'Carolina': {
    center: { lat: 18.3809, lng: -65.9528 },
    radius: 0.08
  },
  'Guaynabo': {
    center: { lat: 18.4178, lng: -66.1075 },
    radius: 0.06
  },
  'Caguas': {
    center: { lat: 18.2342, lng: -66.0356 },
    radius: 0.1
  },
  'Arecibo': {
    center: { lat: 18.4506, lng: -66.7320 },
    radius: 0.1
  },
  'Mayaguez': {
    center: { lat: 18.2013, lng: -67.1397 },
    radius: 0.1
  },
  'Ponce': {
    center: { lat: 18.0113, lng: -66.6140 },
    radius: 0.1
  },
  'Humacao': {
    center: { lat: 18.1494, lng: -65.8272 },
    radius: 0.08
  },
  'Aguadilla': {
    center: { lat: 18.4282, lng: -67.1541 },
    radius: 0.08
  }
};

function generateRandomCoordinate(region) {
  const regionData = PUERTO_RICO_REGIONS[region];
  if (!regionData) return { lat: 18.2208, lng: -66.5901 }; // Default to PR center
  
  const randomLat = regionData.center.lat + (Math.random() - 0.5) * regionData.radius;
  const randomLng = regionData.center.lng + (Math.random() - 0.5) * regionData.radius;
  
  return { lat: randomLat, lng: randomLng };
}

async function updateCustomerCoordinates() {
  try {
    console.log('🔄 Starting coordinate update for existing customers...');
    
    // Get all customers without coordinates
    const [customers] = await sequelize.query(`
      SELECT id, name, address_city 
      FROM customers 
      WHERE address_latitude IS NULL OR address_longitude IS NULL
      ORDER BY name
    `);
    
    console.log(`Found ${customers.length} customers without coordinates`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const customer of customers) {
      const region = customer.address_city;
      
      if (!PUERTO_RICO_REGIONS[region]) {
        console.log(`⚠️  Skipping ${customer.name} - Unknown region: ${region}`);
        skipped++;
        continue;
      }
      
      const coordinates = generateRandomCoordinate(region);
      
      try {
        await sequelize.query(`
          UPDATE customers 
          SET address_latitude = :lat, address_longitude = :lng
          WHERE id = :id
        `, {
          replacements: {
            lat: coordinates.lat,
            lng: coordinates.lng,
            id: customer.id
          }
        });
        
        console.log(`✅ Updated ${customer.name} (${region}): lat=${coordinates.lat.toFixed(6)}, lng=${coordinates.lng.toFixed(6)}`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Failed to update ${customer.name}:`, error.message);
      }
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\n📊 Update Summary:`);
    console.log(`✅ Successfully updated: ${updated} customers`);
    console.log(`⚠️  Skipped: ${skipped} customers`);
    console.log(`📍 Total customers processed: ${customers.length}`);
    
    // Verify updates
    console.log('\n🔍 Verifying updates...');
    const [verificationResults] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(address_latitude) as with_coordinates
      FROM customers
    `);
    
    const result = verificationResults[0];
    console.log(`📈 Database status: ${result.with_coordinates}/${result.total} customers now have coordinates`);
    
  } catch (error) {
    console.error('❌ Error updating coordinates:', error);
  } finally {
    await sequelize.close();
    console.log('✅ Database connection closed');
  }
}

// Run the update
updateCustomerCoordinates();