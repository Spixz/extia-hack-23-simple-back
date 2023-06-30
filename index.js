const express = require("express");
const mongoose = require("mongoose");
const util = require("util");
const sendEmail = require("./send_email");
const cors = require("cors");
const calcMatch = require("./matching");
var buddy_resp = require("./buddyAnswer3v2");
var fresher_resp = require("./fresher2v2");

const MONGO_KEY = process.env.MONGO_KEY;
const mongo_url = `mongodb+srv://spud:${MONGO_KEY}@cluster0.xb6iw9v.mongodb.net/?retryWrites=true&w=majority`;
const BUDDIE_FORM_ID = "JdVugwSh";
const FRESHER_FORM_ID = "RgIDfA1x";

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
  supportLGBT: Boolean,
  disability: [String],
  gender: String,
  languages: [String],
  contact: String,
  city: String,
});

const fresherSchema = new mongoose.Schema({
  name: String,
  email: String,
  socialBehavior: String,
  disability: [String],
  gender: String,
  languages: [String],
  contact: String,
  city: String, //change text 'what city are you moving'
  date: Date,
  phoneNumber: String,
  buddyPreference: String, // to change for []
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
  // request.body = buddy_resp;
  // request.body = fresher_resp;
  // console.log(util.inspect(request.body, false, null, true));
  // console.log("============================\n");
  const body = request.body;
  if (body.form_response.form_id == BUDDIE_FORM_ID) {
    const newExtien = new Extien({
      name: selectFromForm(body, "GN7CasiGHiix"),
      email: selectFromForm(body, "hYD2z5I26f36"),
      socialBehavior: selectFromForm(body, "hYD2z5I26f36"),
      gender: selectFromForm(body, "rLMuSW4vJHfa"),
      languages: selectFromForm(body, "6jaFeLtXTYqI"),
      contact: selectFromForm(body, "YQOFd2QaiVWH"),
      city: selectFromForm(body, "QDicbRiXht8f"),
      disability: selectFromForm(body, "jKFouJyCCkOb"),
      supportLGBT: selectFromForm(body, "X0kKaaPtTUs5"),
    });
    console.log("\n");
    // console.log(newExtien);
    console.log("extien save in db");
    await newExtien.save();
  } else if (body.form_response.form_id == FRESHER_FORM_ID) {
    const newFresher = new Fresher({
      name: selectFromForm(body, "aTGSjnNn4oEq"),
      email: selectFromForm(body, "Smoju7WEdB9k"),
      socialBehavior: selectFromForm(body, "NU0hDw52a7xk"),
      disability: selectFromForm(body, "0k2fqeneFDEt"), //missing
      gender: selectFromForm(body, "sfftV9TXNYnz"),
      languages: selectFromForm(body, "BQBY8aeJJxDl"),
      contact: selectFromForm(body, "ZXELRkh4NQJc"),
      city: selectFromForm(body, "clnMcloIyKPr"),
      date: selectFromForm(body, "cziBv6p38JjT"),
      phoneNumber: selectFromForm(body, "fLaj9bi28HLa"),
      buddyPreference: selectFromForm(body, "Q5qQ5smKb1Ce"),
    });
    console.log("\n");
    console.log(newFresher);

    var allExtien = await Extien.find().exec();
    var match = calcMatch(allExtien, newFresher);
    sendExtienEmail(newFresher, match);
  }
});

function selectFromForm(form, field) {
  answer = form.form_response.definition.fields.find(
    (element) => element.id == field
  );
  if (answer) {
    ansObj = form.form_response.answers.find(
      (element) => element.field.id == field
    );
    // console.log(ansObj);
    if (ansObj.type == "choice") return ansObj[ansObj.type].label;
    if (ansObj.type == "choices") return ansObj[ansObj.type].labels;
    return ansObj[ansObj.type];
  }
  return null;
}

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
