const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chapterRoutes = require('./routes/chapterRoutes');
const quizRoutes = require('./routes/quizRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const noteRoutes = require('./routes/noteRoutes');
const summaryRoutes = require('./routes/summaryRoutes');

const chatRoutes = require('./routes/chatRoutes');
const videoRoutes = require('./routes/videoRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');




// Validate Environment Variables
if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Logger
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // Protected route example
app.use('/api/chapters', chapterRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/videos', videoRoutes);


app.use('/api/quizzes', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/summaries', summaryRoutes);



// Basic structure test endpoint
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    }).catch(err => {
        console.error('Failed to connect to DB on start:', err);
    });
} else {
    // For testing/CI without DB
    module.exports = app;
}

module.exports = app;
