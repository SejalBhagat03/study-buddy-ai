const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'PORT'];

const validateEnv = () => {
    const missing = requiredEnv.filter(env => !process.env[env]);
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
};

module.exports = { validateEnv };
