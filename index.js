const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

    app.get('/explore-artworks:id', async (req , res) =>{
        const {id} = req.params
        console.log(id)
        res.send(
            {success : true}
        )
    })



    app.post('/explore-artworks',async (req , res) =>{
        const data = req.body
        
        const result = await ArtProductsCollection.insertOne(data)
        res.send(result)
    })

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
