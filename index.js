const express = require('express');
const mongoose = require('mongoose');
const sendEmail = require('./send_email');
const cors = require('cors');

const MONGO_KEY = process.env.MONGO_KEY
const mongo_url = `mongodb+srv://spud:${MONGO_KEY}@cluster0.xb6iw9v.mongodb.net/?retryWrites=true&w=majority`;

mongoose.connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connexion à MongoDB réussie');
  })
  .catch((error) => {
    console.errhttps://discord.com/channels/@me/1119368357368561796or('Erreur de connexion à MongoDB :', error);
  });

const extiensSchema = new mongoose.Schema({
  name: String,
  email: String
});

const fresherSchema = new mongoose.Schema({
    name: String,
    email: String,
    destination: String,
    date: Date
  });

const Extien = mongoose.model('extiens', extiensSchema);
const Fresher = mongoose.model('fresher', fresherSchema);

const app = express();

app.use(cors({
    origin: '*'
  }));
  
app.use(express.json());

app.post('/buddies', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Some fields are missing' });
      }

      const newExtien = new Extien({
      name,
      email
    });

    await newExtien.save();

    res.status(201).json(newExtien);
  } catch (error) {
    console.error('Error during the buddy creation :', error);
    res.status(500).json({ error: 'Error during the buddy creation' });
  }
});

app.post('/fresher', async (req, res) => {
    try {
      const { name, email, destination, date } = req.body;
  
      if (!name || !email || !destination || !date) {
          return res.status(400).json({ error: 'Some fields are missing' });
        }
      const newFresher = new Fresher({
        name,
        email,
        destination,
        date: Date(date)
      });
  
      const firstExtien = await Extien.findOne().exec();

      if (!firstExtien) {
        return res.status(204).json({ error: 'No buddy found :(' });
      }
      const extienBackup = firstExtien.toObject();

      await Extien.findOneAndDelete({ email: firstExtien.email }).exec();
      await Extien.create(new Extien(extienBackup));

      console.log(`${newFresher.name} meat ${extienBackup.name}`);
    //   sendExtienEmail()

      res.status(201).json(newFresher);
    } catch (error) {
      console.error('Error during the fresher creation :', error);
      res.status(500).json({ error: 'Error during the fresher creation' });
    }
  });

function sendExtienEmail(fresher, extien) {
    
    const mailOptions = {
        from: 'extia.buddy@gmail.com',
        to: extien.email,
        subject: `Un nouvel extien à besoin de toi !`,
        text: 'content email' //html
      };

}

//welcome route
app.get('/', (req, res) => {
    res.send('Welcome to Extia Buddy API');
});


// Démarrage du serveur
app.listen(process.env.PORT || 3000, () => {
  console.log('Serveur démarré sur le port 3000');
});