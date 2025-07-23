const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

function parseAddress(address) {
  if (!address) return { street: null, city: null, state: null, zipCode: null };
  
  // Common address formats:
  // "295 Day Street, San Francisco, CA 94131"
  // "19th Street, San Francisco, CA 94114"
  // "36 Cunningham Place, San Francisco, CA 94110"
  
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    const street = parts[0];
    const city = parts[1];
    
    // Parse the last part which should contain state and zip
    const stateZipPart = parts[2];
    const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    
    if (stateZipMatch) {
      return {
        street: street,
        city: city,
        state: stateZipMatch[1],
        zipCode: stateZipMatch[2]
      };
    } else {
      // If no zip code pattern found, treat the whole thing as state
      return {
        street: street,
        city: city,
        state: stateZipPart,
        zipCode: null
      };
    }
  } else if (parts.length === 2) {
    // Handle cases like "Street, City"
    return {
      street: parts[0],
      city: parts[1],
      state: null,
      zipCode: null
    };
  } else {
    // Single part - treat as street
    return {
      street: address,
      city: null,
      state: null,
      zipCode: null
    };
  }
}

async function migrateAddresses() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Get all classes with addresses
    const result = await client.query('SELECT id, address FROM classes WHERE address IS NOT NULL');
    console.log(`Found ${result.rows.length} classes to migrate`);
    
    for (const row of result.rows) {
      const { id, address } = row;
      const parsed = parseAddress(address);
      
      console.log(`Migrating class ${id}: "${address}"`);
      console.log(`  -> Street: ${parsed.street}`);
      console.log(`  -> City: ${parsed.city}`);
      console.log(`  -> State: ${parsed.state}`);
      console.log(`  -> Zip Code: ${parsed.zipCode}`);
      
      // Update the database
      await client.query(
        'UPDATE classes SET street = $1, city = $2, state = $3, zip_code = $4 WHERE id = $5',
        [parsed.street, parsed.city, parsed.state, parsed.zipCode, id]
      );
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrateAddresses();