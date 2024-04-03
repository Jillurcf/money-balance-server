require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://money-balance-dedbe.web.app",
      "https://money-balance-dedbe.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wfumfky.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, docoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = docoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const incomeCollection = client.db("allIncome").collection("income");
    const expenseCollection = client.db("allIncome").collection("income");
    const userCollection = client.db("userDB").collection("user");

    // Income Related Api
    app.get("/api/v1/allIncome", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      console.log("pagination", req.query);
      const result = await incomeCollection
        .find()
        .sort({ count: -1 })
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.get("/api/v1/allIncome/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await incomeCollection.findOne(query);
      res.send(result);
      console.log(result);
    });

    app.get("/api/v1/allIncome/:email", async (req, res) => {
      const emailToFind = req.params.email;
      const query = { email: emailToFind };
      const result = await incomeCollection.find(query).toArray();
      res.send(result);
      console.log(result);
    });

    app.post("/api/v1/addIncome", async (req, res) => {
      const allIncome = req.body;
      const result = await incomeCollection.insertOne(allIncome);
      res.send(result);
    });

    app.put("/api/v1/allIncome/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedFood = req.body;
      const food = {
        $set: {
          food_name: updatedFood.food_name,
          food_image: updatedFood.food_image,
          food_category: updatedFood.food_category,
          quantity: updatedFood.quantity,
          price: updatedFood.price,
          count: updatedFood.count,
          userName: updatedFood.userName,
          email: updatedFood.email,
          origin: updatedFood.origin,
          description: updatedFood.description,
        },
      };
      const result = await incomeCollection.updateOne(filter, food, options);
      res.send(result);
      console.log(result);
    });

    app.put("/api/v1/allIncome/update/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      // const options = {upsert: true};
      const updatedCount = req.body;
      console.log(updatedCount);
      const food = {
        $set: {
          count: updatedCount.count,
        },
      };
      const result = await incomeCollection.updateOne(filter, food);
      res.send(result);
      console.log(result);
    });

    app.delete("/api/v1/allIncome/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await incomeCollection.deleteOne(query);
      res.send(result);
    });

    // expense related api
    app.post("/api/v1/addExpense", async (req, res) => {
      const allExpense = req.body;
      const result = await expenseCollection.insertOne(allExpense);
      res.send(result);
    });

    // auth related api

    app.post("/api/v1/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/api/v1/loggedOut", async (req, res) => {
      const user = req.body;
      console.log("logged out", user);
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Money-balance is running");
});

app.listen(port, () => {
  console.log(`Money-Balance server is running ${port}`);
});
