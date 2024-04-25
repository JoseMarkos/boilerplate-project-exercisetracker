const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User  = require('./models/user.model');
const Exercise  = require('./models/exercise.model');
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
// Manejar eventos de conexión de Mongoose
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
  
  // Iniciar el servidor una vez que Mongoose se haya conectado
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
});

// Manejar errores de conexión de Mongoose
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
// api users

app.post(
  '/api/users', 
  async (req, res) => {
    try {
      const { username } = req.body;
      const newUser = new User({
        username
      });
      const savedUser = await newUser.save();

      res.json({
        username: savedUser.username,
        _id: savedUser._id
      });
    } catch (error) {
      console.error('Error creating user:', error);

      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
app.get(
  '/api/users', 
  async (req, res) => {
    res.json(await User.find());
  }
);

app.post('/api/users/:id/exercises', async (req, res) => {
  try {
    let { description, duration, date } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    let theDuration = parseInt(duration);
    if(date == undefined) {
      date = new Date();
    } else {
      date = new Date(date);
    } 
    let exercise = new Exercise({
      owner: user._id,
      description: description,
      duration: theDuration,
      date: date
    });
    const exerciseSaved = await exercise.save();
    const response = {
      username: user.username,
      description: exerciseSaved.description,
      duration: exerciseSaved.duration,
      date: date.toDateString(),
      _id: user._id
    } 
    console.log(response);
    
    return res.json(response);
  } catch (error) {
    console.error('Error creating exercise:', error);

    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const owner = req.params._id;
    const user = await User.findById(owner);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    let { from, to, limit } = req.query;
    if (from) from = new Date(from);
    if (to) to = new Date(to);
    const query = { owner };
    if (from) query.date = { $gte: from };
    if (to) query.date = { ...query.date, $lte: to };
    let logsQuery;
    if (from) {
      logsQuery = Exercise.find(query);
    } else {
      logsQuery = Exercise.find();
    }
    if (limit) logsQuery = logsQuery.limit(parseInt(limit));
    logsQuery.select('description duration date');
    const log = await logsQuery.exec();
    const response = {
      username: user.username,
      count: log.length,
      _id: user._id,
      log: log.map(e => ({
            description: e.description,
            duration: e.duration,
            date: e.date.toDateString()
          }))
    };
    console.log(response);
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching exercise logs:', error);

    res.status(500).json({ error: 'Internal server error' });
  }
});
