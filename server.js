var express = require("express");
var bodyParser = require("body-parser");

var CONTACTS_COLLECTION = "contacts";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

const Database = require('./database');
const Incident = require('./incident');

let database = new Database();
let loadSourceEvents = require('./dailyLoadJob');

let server;
database.initialize()
    .then(() => {
        // Initialize the app.
        server = app.listen(process.env.PORT || 8080, function () {
            var port = server.address().port;
            console.log("App now running on port", port);
        });
    })
    .catch(err => {
        console.error("Couldn't open db connection", err.message);
        process.exit(1);
    });


// CONTACTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}

/*  "/contacts"
 *    GET: finds all contacts
 *    POST: creates a new contact
 */

app.get("/contacts", function (req, res) {
    database.list(CONTACTS_COLLECTION)
        .then(docs => res.status(200).json(docs))
        .catch(err => handleError(res, err.message, "Failed to get contacts."))
    ;
});

app.get("/incidents", function (req, res) {
    database.list("Incidents")
        .then(docs => res.status(200).json(docs))
        .catch(err => handleError(res, err.message, "Failed to get events."))
    ;
});

app.get("/arrests", function (req, res) {
    database.list("Arrests")
        .then(docs => res.status(200).json(docs))
        .catch(err => handleError(res, err.message, "Failed to get events."))
    ;
});

// app.post("/contacts", function (req, res) {
//     var newContact = req.body;
//     newContact.createDate = new Date();
//
//     if (!(req.body.firstName || req.body.lastName)) {
//         handleError(res, "Invalid user input", "Must provide a first or last name.", 400);
//     }
//
//     database.insertOne(CONTACTS_COLLECTION, newContact)
//         .then(doc => res.status(201).json(doc.ops[0]))
//         .catch(err => handleError(res, err.message, "Failed to create new contact."));
// });

/*  "/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */
app.get("/contacts/:id", function (req, res) {
    database.findOne(CONTACTS_COLLECTION, req.params.id)
        .then(doc => res.status(200).json(doc))
        .catch(err => handleError(res, err.message, "Failed to get contact."));
});

app.get("/jobs/daily_incidents_job", function (req, res) {
    loadSourceEvents("http://www.lagunabeachcity.net/cityhall/police/daily_police_log.htm", "Incidents", database)
        .then(results => res.status(200).json(results))
        .catch(err => handleError(res, err.message, err.message));
});

app.get("/jobs/daily_arrests_job", function (req, res) {
    loadSourceEvents("http://www.lagunabeachcity.net/cityhall/police/daily_arrest_log.htm", "Arrests", database)
        .then(results => res.status(200).json(results))
        .catch(err => handleError(res, err.message, err.message));
});
//
// app.put("/contacts/:id", function (req, res) {
//     var updateDoc = req.body;
//     delete updateDoc._id;
//
//     database.updateOne(CONTACTS_COLLECTION, updateDoc, req.params.id)
//         .then(doc => res.status(204).end())
//         .catch(err => handleError(res, err.message, "Failed to update contact"));
// });
//
// app.delete("/contacts/:id", function (req, res) {
//     database.deleteOne(CONTACTS_COLLECTION, req.params.id)
//         .then(doc => res.status(204).end())
//         .catch(err => handleError(res, err.message, "Failed to delete contact"));
// });


