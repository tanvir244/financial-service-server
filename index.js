const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { default: axios } = require('axios');
require('dotenv').config();
const app = express();
const port = process.env.process || 5000;


// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9nu6wnq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const registerCollection = client.db('financialBanking').collection('registerInfo');


    app.post('/register_data', async (req, res) => {
      const registerInfo = req.body;
      // Ensure the pin is a string
      const pin = registerInfo.pin.toString();
      // Generate a salt
      const salt = await bcrypt.genSalt(10);
      // Hash the PIN with the salt
      const hashedPin = await bcrypt.hash(pin, salt);

      const finalData = { name: registerInfo.name, mobile: registerInfo.mobile, email: registerInfo.email, pin: hashedPin, status: registerInfo.status, role: registerInfo.role };
      const result = await registerCollection.insertOne(finalData);
      res.send({ email: registerInfo.email });
    });


    app.post('/register_data/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const pin = req.body.pin;

        if (!pin) {
          return res.status(400).send({ error: 'PIN is required in the request body' });
        }

        const query = { email: email };
        const result = await registerCollection.findOne(query);

        if (!result) {
          return res.status(404).send({ error: 'User not found' });
        }

        const storedHashedPin = result.pin;

        // Verify the PIN
        const isMatch = await bcrypt.compare(pin, storedHashedPin);

        if (isMatch) {
          const finalInfo = { name: result.name, mobile: result.mobile, email: result.email, pin: storedHashedPin };
          res.send(finalInfo);
        } else {
          res.status(401).send({ error: 'Invalid PIN' });
        }
      } catch (error) {
        res.status(500).send({ error: 'Internal server error' });
      }
    });

    app.get('/register_data/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const options = {
        projection: {name: 1, email: 1, status: 1, role: 1}
      }
      const result = await registerCollection.findOne(query, options);
      res.send(result);
    })


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('complex project server is running');
})

app.listen(port, () => {
  console.log(`Car Doctor server is running on port ${port}`);
})