import mongoose from 'mongoose'

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI is missing. Add it to backend/.env before starting the server.');
    }

    await mongoose.connect(mongoUri);
    console.log('Database connected');
}

export default connectDB;
