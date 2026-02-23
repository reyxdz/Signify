// Script to clear all data from MongoDB collections
const mongoose = require('mongoose');

async function clearDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/signify', {});
        console.log('Connected to MongoDB');

        // Get all collection names
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections`);

        // Delete all documents from each collection
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`Clearing ${collectionName}...`);
            
            const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
            console.log(`  Deleted ${result.deletedCount} documents from ${collectionName}`);
        }

        console.log('\n✅ All data cleared successfully!');
        console.log('Collections are kept intact, only documents deleted.');
        
        // Disconnect
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    }
}

// Run the cleanup
clearDatabase();
