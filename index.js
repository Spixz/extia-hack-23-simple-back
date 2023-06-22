const express = require("express");
const mongoose = require("mongoose");
const util = require("util");
const sendEmail = require("./send_email");
const cors = require("cors");

const MONGO_KEY = process.env.MONGO_KEY;
const mongo_url = `mongodb+srv://spud:${MONGO_KEY}@cluster0.xb6iw9v.mongodb.net/?retryWrites=true&w=majority`;
const BUDDIE_FORM_ID = "oSHgmEFS";
const FRESHER_FORM_ID = "TO_CHANGE";

mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connexion à MongoDB réussie");
  })
  .catch((error) => {
    console.error("Erreur de connexion à MongoDB :", error);
  });

const extiensSchema = new mongoose.Schema({
  name: String,
  email: String,
  socialBehavior: String,
  languages: [String],
  contact: [String],
});

const fresherSchema = new mongoose.Schema({
  name: String,
  contactPreference: [String],
  isDisable: String,
  disabilityName: String,
  socialBehavior: String,
  languages: [String],
  date: Date,
  destination: String,
  phoneNumber: String,
  email: String,
  buddyPreference: [String],
});

const Extien = mongoose.model("extiens", extiensSchema);
const Fresher = mongoose.model("fresher", fresherSchema);

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.post("/buddies", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Some fields are missing" });
    }

    const newExtien = new Extien({
      name,
      email,
    });

    await newExtien.save();

    res.status(201).json(newExtien);
  } catch (error) {
    console.error("Error during the buddy creation :", error);
    res.status(500).json({ error: "Error during the buddy creation" });
  }
});

app.post("/fresher", async (req, res) => {
  try {
    const { name, email, destination, date } = req.body;

    if (!name || !email || !destination || !date) {
      return res.status(400).json({ error: "Some fields are missing" });
    }
    const newFresher = new Fresher({
      name,
      email,
      destination,
      date: Date(date),
    });

    const firstExtien = await Extien.findOne().exec();

    if (!firstExtien) {
      return res.status(204).json({ error: "No buddy found :(" });
    }
    const extienBackup = firstExtien.toObject();

    await Extien.findOneAndDelete({ email: firstExtien.email }).exec();
    await Extien.create(new Extien(extienBackup));

    console.log(`${newFresher.name} meat ${extienBackup.name}`);
    sendExtienEmail(newFresher, extienBackup);

    res.status(201).json(newFresher);
  } catch (error) {
    console.error("Error during the fresher creation :", error);
    res.status(500).json({ error: "Error during the fresher creation" });
  }
});

app.post("/webhook", async (request, response) => {
  console.log("req recue");
  console.log(util.inspect(request.body, false, null, true));
  const body = request.body;
  if (body.oSHgmEFS == BUDDIE_FORM_ID) {
    const newExtien = new Extien({
      name: body.form_response.answers[0].text,
      email: body.form_response.answers[1].email,
      socialBehavior: body.form_response.answers[2].choice.label,
      languages: body.form_response.answers[3].choices.labels,
      contact: body.form_response.answers[4].choices.labels,
    });
    await newExtien.save();
  } else if (body.oSHgmEFS == FRESHER_FORM_ID) {
    const newFresher = new Fresher({
      name: body.form_response.answers[0].text,
      contactPreference: body.form_response.answers[1].choices.labels,
      isDisable: body.form_response.answers[2].choice.label,
      disabilityName: body.form_response.answers[3].text,
      socialBehavior: body.form_response.answers[4].choice.label,
      languages: body.form_response.answers[5].choices.labels,
      date: body.form_response.answers[6].date,
      destination: body.form_response.answers[7].text,
      phoneNumber: body.form_response.answers[8].phone_number,
      email: body.form_response.answers[9].email,
      buddyPreference: body.form_response.answers[10].choices.labels,
    });

    const firstExtien = await Extien.findOne().exec();

    if (!firstExtien) {
      return res.status(204).json({ error: "No buddy found :(" });
    }
    const extienBackup = firstExtien.toObject();

    //matching function here
    await Extien.findOneAndDelete({ email: firstExtien.email }).exec();
    await Extien.create(new Extien(extienBackup));

    console.log(`${newFresher.name} meat ${extienBackup.name}`);
    sendExtienEmail(newFresher, extienBackup);
  }
});

function formatDate(date) {
  const options = { day: "numeric", month: "long", year: "numeric" };
  return date.toLocaleDateString("fr-FR", options);
}

function sendExtienEmail(fresher, extien) {
  const mailOptions = {
    subject: `Un nouvel extien à besoin de toi de ton aide !`,
    html: `<p>Salut ${extien.name},</p><p>${
      fresher.name
    } arrive bientôt (${formatDate(fresher.date)}) à Extia ${
      fresher.destination
    } !
        </p><p>Tu peux le contacter à l'adresse suivante : ${
          fresher.email
        }</p><br>
        Merci pour ton aide :)`,
  };

  sendEmail(mailOptions);
}

//welcome route
app.get("/", (req, res) => {
  res.send("Welcome to Extia Buddy API");
});

// Démarrage du serveur
app.listen(process.env.PORT || 3000, () => {
  console.log("Serveur démarré sur le port 3000");
});
