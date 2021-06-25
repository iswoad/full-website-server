const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
const ObjectId = require("mongodb").ObjectId;


app.use(cors());
app.use(bodyParser.json());
// app.use(express.static('doctors'));
app.use(fileUpload());


const port = 4200


app.get('/', (req, res) => {
    res.send("hello from db it's working working")
    console.log('db connected')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pljh2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const serviceCollection = client.db("repairCar").collection("services");
    const bookingCollection = client.db("repairCar").collection("bookings");
    const reviewCollection = client.db("repairCar").collection("reviews");
    const adminCollection = client.db("repairCar").collection("admins");


    //create services
    app.post('/addAService', (req, res) => {
        const file = req.files.file;
        const title = req.body.title;
        const description = req.body.description;
        const charge = req.body.charge;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        serviceCollection.insertOne({ title, description, image, charge })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    });

    //read services
    app.get('/services', (req, res) => {
        serviceCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    //selected service by customer
    app.get('/service/:id', (req, res) => {
        const id = ObjectId(req.params.id)
        serviceCollection.find({_id : id})
        .toArray((err, items) =>{
          res.send(items[0])
        })
      })
    
      //booking after payment
      app.post('/addBooking', (req, res) => {
        const order = req.body;
        bookingCollection.insertOne(order)
        .then( result => {
          res.send(result.insertedCount > 0)
        })
      })

      //load bookings from db for loggedInUser
      app.get('/bookings', (req, res) => {
        bookingCollection.find({email: req.query.email})
        .toArray((err, documents) =>{
          res.send(documents);
        })
      })

      //create client's review db
      app.post('/addAReview', (req, res) => {
        const clientN = req.body.client;
        const clientsReview = req.body.clientReview;
        reviewCollection.insertOne({ clientN, clientsReview})
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    });

    //read reviews
    app.get('/reviews', (req, res) => {
        reviewCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    //allbookings for admins
    app.get('/allBookings', (req, res) => {
        bookingCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    //add a new admin
    app.post('/addAdmin', (req, res) => {
        const adminEmail = req.body.email;
        adminCollection.insertOne({ adminEmail })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    });

    //check admin access
    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({ adminEmail: email })
            .toArray((err, admins) => {
                res.send(admins.length > 0);
            })
    })



  });


app.listen(process.env.PORT || port)