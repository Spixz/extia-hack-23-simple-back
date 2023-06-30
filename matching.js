const { ObjectId } = require('mongodb');

// var cyril = {
//   //extien
//   name: "Cyril",
//   email: "mammar.cyril@epitech.eu",
//   socialBehavior: "mammar.cyril@epitech.eu",
//   supportLGBT: true,
//   disability: ["Visual Impairment", "I use wheelchair"],
//   gender: "Man",
//   languages: ["French", "French sign language"],
//   contact: "Any form of contact is fine for me",
//   city: "Barcelona",
//   _id: new ObjectId("649c3c234f6a8829912118f9"),
// };

// var sarah = {
//   //fresher
//   name: "Sarah",
//   email: "cyrilma@hotmail.fr",
//   socialBehavior: "Introvert",
//   disability: ["I use wheelchair", "Mental Health Conditions"],
//   gender: "Woman",
//   languages: ["Spanish", "English sign language", "French"],
//   contact: "Phone call/ voice memos",
//   city: "Barcelona",
//   date: Date("2023-04-07T00:00:00.000Z"),
//   phoneNumber: "+33695018164",
//   buddyPreference: "Man",
//   _id: new ObjectId("649c4450c1ed5be314622fa2"),
// };


compareArray = (arrayA, arrayB) =>
  Boolean(
    arrayA.filter(function (el) {
      return arrayB.indexOf(el) >= 0;
    }).length
  );

const ANYF = "Any form of contact is fine for me";

function calcPreferedContact(extien, fresher) {
  if (
    extien.contact == fresher.contact ||
    extien.contact == ANYF ||
    fresher.contact == ANYF
  ) {
    return 10;
  }
  return 0;
}

function calcFeelComfortable(extien, fresher) {
  var score = 10;
  var choices = [
    "I identify in another way",
    "Non-binary",
    "Genderqueer / Genderfluid",
  ];
  if (fresher.buddyPreference == "I'am confortable with any gender")
    return score;
  if (fresher.buddyPreference == extien.gender) return score;
  if (
    fresher.buddyPreference == "LGBTQ+ friendly" &&
    choices.indexOf(extien.gender) != -1
  )
    return score;
  if (fresher.buddyPreference == "LGBTQ+ friendly" && extien.supportLGBT)
    return score; //support LGBT
  return 0;
}

function calcDisability(extien, fresher) {
  return compareArray(extien.disability, fresher.disability) * 10;
}

function calcMatch(extiens, fresher) {
  // extiens = [cyril];
  // fresher = sarah;
  res = [];

  for (let extien of extiens) {
    var score = 0;
    sameLanguage = compareArray(extien.languages, fresher.languages);
    if (extien.city != fresher.city || !sameLanguage) {
      console.log("Pas la même ville ou pas la même langue");
      break;
    }
    score += calcPreferedContact(extien, fresher);
    score += calcFeelComfortable(extien, fresher);
    score += calcDisability(extien, fresher);
    res.push({ extien, score });
  }
  console.log(res);
  if (res.length != 0) {
    // console.log(res);
    return res.sort((a, b) => b.score - a.score)[0].extien;
  }
  return null;
}

module.exports = calcMatch;