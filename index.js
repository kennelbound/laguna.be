const source = "http://www.lagunabeachcity.net/cityhall/police/daily_police_log.htm";
const Event = require('./Event');

function updateEvents() {
    let Xray = require('x-ray');
    let x = Xray();

    x(source, {
        title: 'title',
        items: x('a.fbFileName', [{
            filename: '@html',
            filepath: '@href'
        }])
    })(function (err, obj) {
        if (err) throw err;
        database.then(db => {
            let promises = [];
            obj.items.forEach(dailyEventReport => {
                console.log("Processing", dailyEventReport.filename);
                Event.fetchAndParse(dailyEventReport.filepath)
                    .then(events => {
                        events.forEach(event => {
                            promises.push(
                                new Promise((resolve, reject) => {
                                    event.save((err, res) => {
                                        if (err) reject(err);
                                        else resolve(res);
                                    })
                                })
                            );
                        });
                    }).catch(err => {
                    console.log("Fetch error:", err);
                });
            });
            Promise.all(promises).then(res => {
                console.log("Inserted all events", res);
            }).catch(err => {
                console.error("Failed to insert all records", err);
            });
        }).catch(err => {
            console.log("Database connection error", err);
        });
    });
}

console.log("Starting to load events");
updateEvents();