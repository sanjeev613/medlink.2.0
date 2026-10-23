const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Hospital = require('../models/Hospital');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink_demo');
    console.log('Connected to MongoDB for hospital seeding...');

    const seedFile = path.join(__dirname, '../data/seed_hospitals.json');
    const hospitalsData = JSON.parse(fs.readFileSync(seedFile, 'utf8'));

    for (const h of hospitalsData) {
      await Hospital.findOneAndUpdate(
        { registrationNumber: h.id },
        {
          name: h.name,
          registrationNumber: h.id,
          phoneNumber: h.phoneNumber,
          latitude: h.latitude,
          longitude: h.longitude,
          address: h.address,
          city: h.city,
          state: h.state,
          bedCapacity: h.bedCapacity,
          availableBeds: h.availableICUBeds || 10,
          ambulanceCount: 5,
          apiKey: `API_KEY_${h.id}`,
          isActive: true
        },
        { upsert: true, new: true }
      );
      console.log(`✓ Seeded ${h.name}`);
    }

    console.log('Hospital seeding completed successfully!');
    process.exit(0);
  } catch (e) {
    console.error('Hospital seeding failed:', e);
    process.exit(1);
  }
}

seed();
