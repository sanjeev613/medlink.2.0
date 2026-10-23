// mongodbExample.js
// Minimal beginner-friendly Node.js MongoDB Atlas example.
// Reads URI from environment or config file, connects to Atlas, inserts + queries documents.

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || (() => {
  const configPath = path.resolve(process.cwd(), 'mongodbConfig.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    if (config.MONGODB_URI) {
      return config.MONGODB_URI;
    }
  }
  throw new Error(
    'MONGODB_URI not found in environment variables or mongodbConfig.json.\n' +
    'Set it through `setx MONGODB_URI "your-uri"` or create mongodbConfig.json in project root.'
  );
})();

const DATABASE_NAME = 'medilink_demo';
const COLLECTION_NAME = 'user_profiles';

async function main() {
  console.log('1) Starting MongoDB Atlas example');
  console.log('2) Database:', DATABASE_NAME);
  console.log('3) Collection:', COLLECTION_NAME);

  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    console.log('4) Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('   ✓ Connected successfully.');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    await collection.drop().catch(() => {
      console.log('   ▶ No existing collection to drop or collection dropped.');
    });

    const baseTime = Date.now();
    const docs = Array.from({ length: 10 }, (_v, i) => {
      const idx = i + 1;
      return {
        name: `User ${idx}`,
        username: `user${idx}`,
        email: `user${idx}@medilink.example.com`,
        role: idx % 2 === 0 ? 'nurse' : 'doctor',
        status: idx % 3 === 0 ? 'active' : 'pending',
        createdAt: new Date(baseTime - (10 - idx) * 60 * 60 * 1000),
      };
    });

    console.log('5) Inserting 10 realistic documents...');
    const inserted = await collection.insertMany(docs);
    console.log('   ✓ Inserted count:', inserted.insertedCount);

    const docIds = Object.values(inserted.insertedIds);
    const firstId = docIds[0];

    console.log('6) Reading 5 most recent docs by createdAt:');
    const recentDocs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    recentDocs.forEach((doc, idx) => {
      console.log(`   [${idx + 1}] _id=${doc._id} createdAt=${doc.createdAt.toISOString()}`);
    });

    console.log(JSON.stringify(recentDocs, null, 2));

    console.log('7) Reading one document by _id:', firstId);
    const single = await collection.findOne({ _id: new ObjectId(firstId) });
    console.log(JSON.stringify(single, null, 2));

  } catch (err) {
    console.error('ERROR:', err.message || err);
    process.exitCode = 1;
  } finally {
    console.log('8) Closing MongoDB connection');
    await client.close();
    console.log('   ✓ Connection closed');
  }
}

main();
