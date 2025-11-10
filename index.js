const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

    // Get all artworks
    app.get("/explore-artworks", async (req, res) => {
      const result = await ArtProductsCollection.find().toArray();
      res.send(result);
    });

    // Get single artwork
    app.get("/explore-artworks/:id", async (req, res) => {
      const { id } = req.params;
      const result = await ArtProductsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // Add new artwork
    app.post("/explore-artworks", async (req, res) => {
      const data = req.body;
      const result = await ArtProductsCollection.insertOne(data);
      res.send(result);
    });

    // Update artwork
    app.put("/explore-artworks/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const result = await ArtProductsCollection.updateOne(filter, {
        $set: data,
      });
      res.send(result);
    });

    // Delete artwork
    app.delete("/explore-artworks/:id", async (req, res) => {
      const { id } = req.params;
      const result = await ArtProductsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // get all artworks of a specific artist
    app.get("/artist-artworks/:artistName", async (req, res) => {
      const { artistName } = req.params;
      try {
        const result = await ArtProductsCollection.find({
          userName: artistName,
        }).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch artist artworks" });
      }
    });

    // Latest 6 artworks
    app.get("/latest-artworks", async (req, res) => {
      const result = await ArtProductsCollection.find()
        .sort({ created_at: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // ✅ Like an artwork
    app.patch("/explore-artworks/:id/like", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await ArtProductsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $inc: { likes: 1 } } // increment likes by 1
        );
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to update like count" });
      }
    });

    // ✅ Favorites CRUD
    app.post("/favorites", async (req, res) => {
      const favoriteData = req.body;
      const result = await FavoritesCollection.insertOne(favoriteData);
      res.send(result);
    });

    app.get("/favorites", async (req, res) => {
      const email = req.query.email;
      const query = email ? { userEmail: email } : {}; // return all if no email
      const result = await FavoritesCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/favorites/:id", async (req, res) => {
      const { id } = req.params;
      const result = await FavoritesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    console.log("MongoDB connected successfully ✅");
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => console.log(`Server running on port ${port}`));
