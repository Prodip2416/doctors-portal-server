const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
// const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();


const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.bbk7z.mongodb.net:27017,cluster0-shard-00-01.bbk7z.mongodb.net:27017,cluster0-shard-00-02.bbk7z.mongodb.net:27017/${process.env.DB_NAME}?ssl=true&replicaSet=atlas-1227kd-shard-0&authSource=admin&retryWrites=true&w=majority`;

const app = express()

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload());

const port = 5000;

app.get('/', (req, res) => {
    res.send("hello from db it's working working")
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const appointmentCollection = client.db(process.env.DB_NAME).collection("appointments");
    const doctorCollection = client.db("doctorsPortal").collection("doctors");

    app.post('/addAppointment', (req, res) => {
        const appointment = req.body;
        appointmentCollection.insertOne(appointment)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    });

    app.get('/appointments', (req, res) => {
        appointmentCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.post('/appointmentsByDate', (req, res) => {
        // const date = req.body;
        // appointmentCollection.find({ date: date.date })
        //     .toArray((err, documents) => {
        //         res.send(documents);
        //     })
        const date = req.body;
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                const filter = { date: date.date }
                if (doctors.length === 0) {
                    filter.email = email;
                }
                appointmentCollection.find(filter)
                    .toArray((err, documents) => {
                        console.log(email, date.date, doctors, documents)
                        res.send(documents);
                    })
            })
    })

    app.post('/addDoctor', (req, res) => {
        // Save Folder on this project
        // const file = req.files.file;
        // const name = req.body.name;
        // const email = req.body.email;

        // file.mv(`${__dirname}/doctors/${file.name}`, err => {
        //     if (err) {
        //         console.log(err);
        //         return res.status(500).send({ msg: 'Failed to upload Image' });
        //     }
        //     doctorCollection.insertOne({ name, email, img: file.name })
        //         .then(result => {
        //             res.send(result.insertedCount > 0)
        //         })
        //    // return res.send({name: file.name, path: `/${file.name}`})
        // })

        // Save Base64 on Mongodb
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        // console.log(file, name, email);
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: req.files.file.mimetype,
            size: req.files.file.size,
            img: Buffer.from(encImg, 'base64')
        };

        doctorCollection.insertOne({ name, email, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/doctors', (req, res) => {
        doctorCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });


});


app.listen(process.env.PORT || port)