import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI; 
if(!MONGODB_URI){
    throw new Error('Please define the MONGODB_URI in environment variable')
}

//To use the cache db
declare global{
    var mongooseCache: {
        conn: typeof mongoose | null
        promise: Promise<typeof mongoose> | null 
    }
}

const cached = global.mongooseCache || (global.mongooseCache = { conn : null , promise: null });

export const connectToDatabase = async () => {
    if(cached.conn) return cached.conn;
    
    if(!cached.promise){
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands : false
        })
    }

    try {
        cached.conn = await cached.promise;
    
    } catch (error) {
        cached.promise = null;
        console.error('MongoDB connecton error. Please make sure Mongodb is running.' + error);
        throw error;
    }

    console.info("Connected to MongoDB");
    return cached.conn;
}
