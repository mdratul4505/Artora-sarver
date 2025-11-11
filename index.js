const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("./serverKey.json");

const app = express();
const port = process.env.PORT || 3000;

// Firebase Admin Initialization
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware
app.use(cors());
app.use(express.json());

// Token verification middleware
const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({ message: "unauthorized access." });
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decodedEmail = decoded.email; 
    next();
  } catch (error) {
    return res.status(401).send({ message: "unauthorized access." });
  }
};

// MongoDB URI
const uri =
  "mongodb+srv://ArtoradbUser:07G26GufuDf3TbKY@cluster0.mj89i6p.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("Artora-db");
    const ArtProductsCollection = db.collection("artora");
    const FavoritesCollection = db.collection("favorites");

    console.log("MongoDB connected successfully");

    // --- All Public Artworks ---
    app.get("/explore-artworks", async (req, res) => {
      try {
        const result = await ArtProductsCollection.find({ visibility: "public" }).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch artworks" });
      }
    });

    // --- Single Artwork ---
    app.get("/explore-artworks/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await ArtProductsCollection.findOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch artwork" });
      }
    });

    // --- Add Artwork ---
    app.post("/explore-artworks", async (req, res) => {
      const data = req.body;
      data.created_at = new Date();
      try {
        const result = await ArtProductsCollection.insertOne(data);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to add artwork" });
      }
    });

    // --- My Gallery ---
    app.get("/my-gallery", async (req, res) => {
      const email = req.query.email;
      try {
        const result = await ArtProductsCollection.find({ userEmail: email }).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching user's gallery:", error);
        res.status(500).send({ error: "Failed to load user's gallery" });
      }
    });

    // --- Update Artwork ---
    app.put("/explore-artworks/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      try {
        const result = await ArtProductsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: data }
        );
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to update artwork" });
      }
    });

    // --- Delete Artwork ---
    app.delete("/explore-artworks/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await ArtProductsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to delete artwork" });
      }
    });

    // --- Latest 6 Artworks ---
    app.get("/latest-artworks", async (req, res) => {
      try {
        const result = await ArtProductsCollection.find({ visibility: "public" })
          .sort({ created_at: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch latest artworks" });
      }
    });

    // --- Search Artworks ---
    app.get("/search", async (req, res) => {
      const searchText = (req.query.search || "").trim();
      try {
        if (!searchText) {
          const allData = await ArtProductsCollection.find().toArray();
          return res.send(allData);
        }
        const regexPattern = searchText.split(/\s+/).map((word) => `(?=.*${word})`).join("") + ".*";
        const result = await ArtProductsCollection.find({
          $or: [
            { title: { $regex: regexPattern, $options: "i" } },
            { userName: { $regex: regexPattern, $options: "i" } },
          ],
        }).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to search artworks" });
      }
    });

    // --- Like Artwork ---
    app.patch("/explore-artworks/:id/like", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await ArtProductsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $inc: { likes: 1 } }
        );
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to update like count" });
      }
    });

    // --- Favorites ---
    app.post("/favorites", async (req, res) => {
      const favoriteData = req.body;
      try {
        const result = await FavoritesCollection.insertOne(favoriteData);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to add favorite" });
      }
    });

    app.get("/favorites", async (req, res) => {
      const email = req.query.email;
      const query = email ? { userEmail: email } : {};
      try {
        const result = await FavoritesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch favorites" });
      }
    });

    app.delete("/favorites/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await FavoritesCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to delete favorite" });
      }
    });


    app.get("/artist-artworks/:artistName", async (req, res) => {
      const { artistName } = req.params;
      try {
        const result = await ArtProductsCollection.find({ userName: artistName }).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch artist artworks" });
      }
    });

  } finally {

  }
}

run().catch(console.dir);

app.listen(port, () => console.log(`Server running on port ${port}`));
