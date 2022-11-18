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
  const appointmentOptionCollection = client
    .db("doctorsPortal")
    .collection("appointmentOptions");
  const bookingsCollection = client.db("doctorsPortal").collection("bookings");

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
      console.log(date, option.name, bookedSlots.length);
    });
    res.send(options);
  });

  app.post("/bookings", async (req, res) => {
    const booking = req.body;
    // console.log(booking);
    const query = {
      appointmentDate: booking.appointmentDate,
    };
    const alreadyBooked = await bookingsCollection.find(query).toArray();
    if (alreadyBooked.length) {
      const message = `You already have a ${booking.appointmentDate} `;
      return res.send({ acknowledged: false, message });
    }

    const result = await bookingsCollection.insertOne(booking);
    res.send(result);
  });
}
run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
