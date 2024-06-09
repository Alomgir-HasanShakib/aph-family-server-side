const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// const stripe = require("stripe")(process.env.PAYMENT_KEY);
app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.0.106:5173"],
    credentials: true,
  })
);

app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.mmdewqm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    // ====================================jwt api =========================================

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_TOKEN, {
        expiresIn: "1h",
      });
      console.log(token);
      res.send({ token });
    });

    // ==========================middleware ======================
    const verifytoken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({
          message: "Forbidden Access",
        });
      }
      const token = req.headers.authorization.split(" ")[1];
      console.log("token is here", token);
      jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;

        next();
      });
    };

    //  ========================================================all collection is here=========================================

    const userCollection = client.db("aph_family").collection("users");
    const petCollection = client.db("aph_family").collection("pets");
    const campaignCollection = client.db("aph_family").collection("campaigns");
    const adoptRequestCollection = client
      .db("aph_family")
      .collection("adoptRequests");

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User Already Exist", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.post("/pets", verifytoken, async (req, res) => {
      const pet = req.body;
      const result = await petCollection.insertOne(pet);
      res.send(result);
    });
    // ============================================get all the pets  here=========================================

    app.get("/pets", async (req, res) => {
      const result = await petCollection.find().sort({ date: -1 }).toArray();
      res.send(result);
    });

    //====================== for showing single data info. if i can't do this so im not able to show single data info=================
    app.get("/pets/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await petCollection.findOne(query);
      res.send(result);
    });

    app.get("/campaigns/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await campaignCollection.findOne(query);
      res.send(result);
    });

    //  =========================================================update pet status====================================
    app.put("/pets/:id", verifytoken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatePetStatus = req.body;
      const item = {
        $set: {
          adopted: updatePetStatus.adopted,
        },
      };
      const result = await petCollection.updateOne(filter, item, options);
      res.send(result);
    });

    //  =============================================update pet information=============================================

    app.patch("/pets/:id", verifytoken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedPet = req.body;
      const item = {
        $set: {
          name: updatedPet.name,
          age: updatedPet.age,
          locaiton: updatedPet.locaiton,
          category: updatedPet.category,
          shortDescription: updatedPet.shortDescription,
          long: updatedPet.long,
          image: updatedPet.image,
        },
      };
      const result = await petCollection.updateOne(filter, item, options);
      res.send(result);
    });

    // delete pets from database
    app.delete("/pets/:id", verifytoken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await petCollection.deleteOne(query);
      res.send(result);
    });

    // ==============================================adopt request collection here=========================================

    app.post("/adoptRequest", verifytoken, async (req, res) => {
      const pet = req.body;
      const result = await adoptRequestCollection.insertOne(pet);
      res.send(result);
    });

    // ================================================campaign api here =========================================================

    app.post("/campaigns", verifytoken, async (req, res) => {
      const campaignData = req.body;
      const result = await campaignCollection.insertOne(campaignData);
      res.send(result);
    });
    app.get("/campaigns", verifytoken, async (req, res) => {
      const result = await campaignCollection.find().toArray();
      res.send(result);
    });
    //  ============================================= updatedIsPause variable=============================================

    app.patch("/campaigns/:id", verifytoken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedIsPause = req.body;
      const item = {
        $set: {
          isPause: updatedIsPause.isPause,
        },
      };
      const result = await campaignCollection.updateOne(filter, item, options);
      res.send(result);
    });

    app.put("/campaigns/:id", verifytoken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedInfo = req.body;
      const item = {
        $set: {
          petName: updatedInfo.petName,
          totalAmount: updatedInfo.totalAmount,
          lastDate: updatedInfo.lastDate,
          image: updatedInfo.image,
          shortDescription: updatedInfo.shortDescription,
          longDescription: updatedInfo.longDescription,
        },
      };
      const result = await campaignCollection.updateOne(filter, item, options);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("aph-family is runnig here");
});
app.listen(port, (req, res) => {
  console.log(`server running on port ${port}`);
});
