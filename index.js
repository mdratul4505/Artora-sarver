const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();

const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());



const uri =
  "mongodb+srv://ArtoradbUser:07G26GufuDf3TbKY@cluster0.mj89i6p.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function run() {
  try {
    await client.connect();

    const db = client.db('Artora-db');
    const ArtProductsCollection = db.collection('artora')



    app.get('/explore-artworks', async (req, res) => {
        const result = await ArtProductsCollection.find().toArray()
        res.send(result)

    })

    app.get('/explore-artworks/:id', async (req , res) =>{
        const {id} = req.params
        const result = await ArtProductsCollection.findOne({_id : new ObjectId(id)})
        res.send(result)
    })



    app.post('/explore-artworks',async (req , res) =>{
        const data = req.body
        
        const result = await ArtProductsCollection.insertOne(data)
        res.send(result)
    })

    app.put('/explore-artworks/:id', async (req , res) =>{
        const {id} = req.params
        const objectId = new ObjectId(id)
        const data  = req.body
        const filter = {_id : objectId}
        
        const updateData = {
            $set: data
        }

        const result = await ArtProductsCollection.updateOne(filter , updateData)
        res.send(result)

    })


    app.delete('/explore-artworks/:id' , async (req , res) =>{
        const {id} = req.params
        const objectId = new ObjectId(id);
        const data = req.body
        const filter = {_id : objectId}

        const result = await ArtProductsCollection.deleteOne(filter)
        res.send(result);
    })


    app.get('/latest-artworks' , async (req,res) =>{
        const result = await ArtProductsCollection.find().sort({created_at : -1}).limit(6).toArray()
        res.send(result)
    })

    app.patch('/explore-artworks/:id/like', async (req, res) => {
  const { id } = req.params;

  try {
    const filter = { _id: new ObjectId(id) };
    const updateDoc = { $inc: { likes: 1 } }; // increment likes by 1
    const result = await ArtProductsCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to update like count" });
  }
});



    const FavoritesCollection = db.collection('favorites');

app.post('/favorites', async (req, res) => {
  const favoriteData = req.body; 
  const result = await FavoritesCollection.insertOne(favoriteData);
  res.send(result);
});


app.get('/favorites', async (req, res) => {
  const email = req.query.email;
  const result = await FavoritesCollection.find({ userEmail: email }).toArray();
  res.send(result);
});


app.delete('/favorites/:id', async (req, res) => {
  const { id } = req.params;
  const result = await FavoritesCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});




    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Artora is running on port ${port}`);
});
