import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Could not set custom DNS servers, using system default:", e);
}

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not found in .env file.");
  process.exit(1);
}

async function run() {
  console.log("Connecting to MongoDB Atlas to clear database...");
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();

    // List all collections
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      console.log(`Dropping collection: ${col.name}`);
      try {
        await db.collection(col.name).drop();
      } catch (dropErr) {
        console.error(`Error dropping collection ${col.name}:`, dropErr);
      }
    }

    console.log("Seeding clean default user and config...");
    
    // Seed default admin
    await db.collection("users").insertOne({
      id: "1",
      name: "Administrador Vexa POS",
      email: "admin@vexapos.com",
      password: "123",
      role: "admin",
      profileImage: ""
    });

    // Seed default business config
    await db.collection("config").updateOne(
      { _id: "business_config" },
      {
        $set: {
          name: "Vexa POS",
          nit: "",
          foundationYear: "",
          phone: "",
          address: "",
          city: ""
        }
      },
      { upsert: true }
    );

    // Seed default lists
    await db.collection("metadata").updateOne(
      { _id: "lists" },
      {
        $set: {
          laboratories: ["Genfar", "MK", "Tecnoquímicas", "GSK", "Bayer", "Abbott", "Sanofi", "Roche"],
          categories: ["Analgésicos", "Antibióticos", "Antihistamínicos", "Vitaminas y Multivitamínicos", "Inyectables", "Cuidado Bebé", "Higiene y Salud Orgánica"]
        }
      },
      { upsert: true }
    );

    console.log("MongoDB Atlas database cleared and seeded with clean defaults successfully!");
  } catch (err) {
    console.error("Error clearing database:", err);
  } finally {
    await client.close();
  }
}

run();
