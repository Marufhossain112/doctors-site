const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
// middleware
app.use(cors());
app.use(express.json());
// port
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("I am running on the home of the Server.");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.efpjwcu.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  const doctorsCollection = client
    .db("doctorsPortal")
    .collection("appointmentOptions");
  const bookingsCollection = client.db("doctorsPortal").collection("bookings");

  app.get("/appointmentOptions", async (req, res) => {
    const date = req.query.date;
    console.log(date);
    const query = {};
    const cursor = doctorsCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });

  app.post("/bookings", async (req, res) => {
    const booking = req.body;
    console.log(booking);
    const result = await bookingsCollection.insertOne(booking);
    res.send(result);
  });
}
run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
