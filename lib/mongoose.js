import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fynness';

if (!global._mongoose) {
  global._mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (global._mongoose.conn) return global._mongoose.conn;
  if (!global._mongoose.promise) {
    global._mongoose.promise = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongoose) => mongoose);
  }
  global._mongoose.conn = await global._mongoose.promise;
  return global._mongoose.conn;
}
