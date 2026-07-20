const mongoose = require('mongoose');

// Note: Using direct shard hosts instead of +srv because Node v24
// has a known issue with SRV DNS resolution on some networks.
// The direct connection string works identically — same replica set,
// same failover behavior, just bypasses the SRV lookup step.

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
