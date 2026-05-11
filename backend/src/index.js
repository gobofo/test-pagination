const express  = require("express");
const cors     = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app       = express();
const PORT      = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

async function start() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connecté à MongoDB");

  const db = client.db("shop");
  app.locals.db = db;

  app.use(cors());
  app.use(express.json());

  app.listen(PORT, () => console.log("Serveur demarre sur http://localhost:" + PORT));
}

start().catch((err) => {
  console.error("Erreur de connexion MongoDB :", err.message);
  process.exit(1);
});
