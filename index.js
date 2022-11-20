const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const jwt = require("jsonwebtoken");
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
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send("Unauthorized access.");
  }
  const token = authHeader.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      res.status(403).send({ message: "Forbidden Access." });
    }
    // console.log(decoded, "line no 35");
    req.decoded =
      decoded; /* if the token match then set this decoded to req.decoded */
    next(); /* if you don't do this verify token won't work */
  });
};

async function run() {
  const appointmentOptionCollection = client
    .db("doctorsPortal")
    .collection("appointmentOptions");
  const bookingsCollection = client.db("doctorsPortal").collection("bookings");
  const usersCollection = client.db("doctorsPortal").collection("users");
  app.get("/jwt", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    console.log(user);

    if (user) {
      const token = jwt.sign({ email }, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      return res.send({ accessToken: token });
    }
    res.status(403).send({ accessToken: "" });
  });

  app.get("/bookings", verifyJWT, async (req, res) => {
    const email = req.query.email;
    // console.log(email);
    const decodedEmail = req.decoded.email;
    if (email != decodedEmail) {
      return res.status(403).send({ message: "Unauthorized access" });
    }
    const query = { email: email };
    const cursor = bookingsCollection.find(query);
    const bookings = await cursor.toArray();
    res.send(bookings);
  });

  app.get("/appointmentOptions", async (req, res) => {
    const date = req.query.date;
    // console.log(date);
    const query = {};
    const cursor = appointmentOptionCollection.find(query);
    const options = await cursor.toArray();
    const bookingQuery = { appointmentDate: date };
    const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
    options.forEach((option) => {
      const optionBooked = alreadyBooked.filter(
        (book) => book.treatment === option.name
      );
      // console.log(optionBooked);
      const bookedSlots = optionBooked.map((book) => book.slot);
      const remainingSlots = option.slots.filter(
        (slot) => !bookedSlots.includes(slot)
      );
      option.slots = remainingSlots;
      // console.log(date, option.name, bookedSlots.length);
    });
    res.send(options);
  });

  app.post("/bookings", async (req, res) => {
    const booking = req.body;
    // console.log(booking);
    const query = {
      appointmentDate: booking.appointmentDate,
      treatment: booking.treatment,
      email: booking.email,
    };
    const alreadyBooked = await bookingsCollection.find(query).toArray();
    if (alreadyBooked.length) {
      const message = `You already have a ${booking.appointmentDate} `;
      return res.send({ acknowledged: false, message });
    }
    const result = await bookingsCollection.insertOne(booking);
    res.send(result);
  });
  app.get("/users", async (req, res) => {
    const query = {};
    const users = await usersCollection.find(query).toArray();
    res.send(users);
  });
  app.post("/users", async (req, res) => {
    const user = req.body;
    console.log(user);
    const data = await usersCollection.insertOne(user);
    res.json(data);
  });
}
run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
