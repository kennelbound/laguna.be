const Xray = require('x-ray');
const Incident = require('./incident');

function loadSourceEvents(source, collection, database) {
    return new Promise((resolveUpdateEvents, rejectUpdateEvents) => {
        let x = Xray();

        x(source, {
            title: 'title',
            items: x('a.fbFileName', [{
                filename: '@html',
                filepath: '@href'
            }])
        })(function (err, obj) {
            if (err) throw err;
            let promises = [];
            let allEvents = [];

            obj.items.forEach(dailyEventReport => {
                // let dailyEventReport = obj.items[0];
                console.log("Processing", dailyEventReport.filename);
                Incident.fetchAndParse(dailyEventReport.filepath)
                    .then(events => {
                        events.forEach(event => {
                            if (event === null) {
                                console.log("Skipping the null event");
                            } else {
                                promises.push(new Promise((resolve, reject) => {
                                    database.insertOne(collection, event.json())
                                        .then(it => {
                                            console.log("Successfully inserted " + JSON.stringify(event));
                                            resolve(it)
                                        })
                                        .catch(err => {
                                            console.error("Failed to insert " + JSON.stringify(event), err);
                                        });
                                }));
                            }
                        });
                    })
                    .catch(error => {
                        console.log("Failed to fetch and parse " + dailyEventReport.filepath, error.message);
                        promises.push(Promise.reject(dailyEventReport.filepath));
                    });
            });

            Promise.all(promises).then(it => resolveUpdateEvents(allEvents)).catch(err => rejectUpdateEvents(err));
        });
    });
}

module.exports = loadSourceEvents;