const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User  = require('./models/user.model');
const Log  = require('./models/log.model');
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

app.post('/api/users/:id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let log = await Log.findById(userId);
    if (!log) {
      log = new Log({
        _id: userId,
        username: user.username,
        log: []
      });
    }
    console.log(log)
    durationInt = parseInt(duration);
    finalDate = getDate(date); 
    log.log.push({
      description: description,
      duration: durationInt,
      date: finalDate?.date || new Date()
    });
    if (!log.count) {
      log.count = log.count + 1;
      const savedLog = await log.save();
    } else {
      log.count = log.count + 1;
      const savedLog = await Log.updateOne(log);
    }

    res.json({
      username: user.username,
      description: description,
      duration: durationInt,
      date: finalDate?.formatted,
      _id: user._id
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
    const _id = req.params._id;
    let { from, to, limit } = req.query;

    if (from) from = new Date(from);
    if (to) to = new Date(to);

    const query = { _id };

    if (from) query['log.date'] = { $gte: from };
    if (to) query['log.date'] = { ...query['log.date'], $lte: to };

    let logsQuery;
    console.log(query);
  
    if (from) {
      logsQuery = Log.find(query);
      console.log('from');
    } else {
      logsQuery = Log.find();
      console.log('no from');
    }
    // console.log('logsQuery')
    // console.log(logsQuery);
    if (limit) logsQuery = logsQuery.limit(parseInt(limit));

    const logs = await logsQuery.exec();

    res.json(logs);
  } catch (error) {
    console.error('Error fetching exercise logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
