var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

class Database {
    constructor() {
        this.db = null;
    }

    async initialize() {
        let self = this;
        return new Promise((resolve, reject) => {
            mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                // Save database object from the callback for reuse.
                self.db = database;
                console.log("Database connection ready");
                resolve(self);
            });
        });
    }

    async list(collection) {
        return new Promise((resolve, reject) => {
            this.db.collection(collection).find({}).toArray(function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

    async insertOne(collection, newContact) {
        return new Promise((resolve, reject) => {
            try {
                newContact.createDate = new Date();
                this.db.collection(collection).insertOne(newContact, function (err, doc) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc);
                    }
                });
            }
            catch (err) {
                console.log("Failed to insert one with error", err.message);
                reject(err);
            }
        });
    }

    async findOne(collection, id) {
        return new Promise((resolve, reject) => {
            try {
                this.db.collection(collection).findOne({_id: new ObjectID(id)}, function (err, doc) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc);
                    }
                });
            }
            catch (err) {
                console.log("Failed to find one with error", err.message);
                reject(err);
            }
        });
    }

    async updateOne(collection, updateDoc, id) {
        return new Promise((resolve, reject) => {
            try {
                // delete updateDoc._id;
                this.db.collection(collection).updateOne({_id: new ObjectID(id)}, updateDoc, function (err, doc) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc);
                    }
                });
            }
            catch (err) {
                console.log("Failed to update one with error", err.message);
                reject(err);
            }
        });
    }

    async deleteOne(collection, id) {
        return new Promise((resolve, reject) => {
            this.db.collection(collection).deleteOne({_id: new ObjectID(id)}, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}

module.exports = Database;