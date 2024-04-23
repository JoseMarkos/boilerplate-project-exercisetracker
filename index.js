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
    const { description, duration, date } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    theDuration = parseInt(duration);
    theDate = getDate(date); 
    let exercise = new Exercise({
      owner: user._id,
      description: description,
      duration: theDuration,
      date: theDate?.date || new Date()
    });
    const exerciseSaved = await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exerciseSaved.description,
      duration: exerciseSaved.duration,
      date: theDate?.formatted
    });
  } catch (error) {
    console.error('Error creating exercise:', error);

    res.status(500).json({ error: 'Internal server error' });
  }
});

function getDate(dateinput) {
  dateinput = new Date(dateinput);
  if ("Invalid Date" == dateinput) {
    const time = parseInt(dateinput);
    if (isNaN(time)) {
      return null;
    }
    dateinput = new Date(time);
  }
  const options = { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' };
  const dateFormatter = new Intl.DateTimeFormat('en-US', options);
  const formattedDate = dateFormatter.format(dateinput);

  return { date: dateinput, formatted: formattedDate};
}

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
    let logs = await logsQuery.exec();
    let arr = [];
    logs.forEach(
      log => {
        let _log = { 
          description: log.description,
          duration : log.duration,
          date: new Date(log.date).toDateString()
         };
        arr.push(_log);
      }
    )

    res.json({
      username: user.username,
      count: logs.length,
      _id: user._id,
      log: arr
    });
  } catch (error) {
    console.error('Error fetching exercise logs:', error);

    res.status(500).json({ error: 'Internal server error' });
  }
});
