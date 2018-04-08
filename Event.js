const request = require('request');
const PDFParser = require("pdf2json");

const mongoose = require('mongoose');

function fromTo(text, startWord, endWord) {
    let start = text.split(startWord);
    if (start.length === 1) {
        return "";
    }
    return start[1].split(endWord)[0].trim();
}

const EventSchema = new mongoose.Schema({
    // _id: mongoose.Types.ObjectId,
    eventId: 'string',
    typeId: 'string',
    typeLabel: 'string',
    subtypeId: 'string',
    timestamp: 'date',
    caseNumber: 'string',
    disposition: 'string',
    description: 'string',
    location: 'string'
});
let Event;

EventSchema.statics.fetchAndParse = (url) => {
    return new Promise((resolve, reject) => {
        let pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", errData => reject("pdfParseError:" + errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            resolve(EventSchema.statics._processPDFJSON(pdfParser, pdfData));
        });

        request
            .get(url)
            .on('error', function (err) {
                reject(err);
            })
            .pipe(pdfParser);
    })
};

EventSchema.statics._processPDFJSON = (parser, data) => {
    let events = [];
    let line = "";

    data.formImage.Pages.forEach((page) => {
        page.Texts.forEach((text) => {
            let val = text.R.map(rec => {
                return rec.T ? decodeURIComponent(rec.T) : "";
            }).join("");
            if (val.indexOf("______________________________________") > -1) {
                line = line.replace(/\_+/, "");
                events.push(EventSchema.statics._parseLine(line));
                line = "";
            } else {
                line += val + " ";
            }
        });
        events.push(EventSchema.statics._parseLine(line));
        line = "";
    });

    events.push(EventSchema.statics._parseLine(line));
    return events.filter(it => {
        return it;
    });
};

EventSchema.statics._parseLine = (eventLine) => {
    let event = new Event();
    if (eventLine.indexOf("Event #") === -1) {
        return null;
    }

    event.line = eventLine;
    console.log(eventLine);

    event.eventId = fromTo(eventLine, /E ?v ?e ?n ?t ?#/, /T ?y ?p ?e/);

    let type = fromTo(eventLine, /T ?y ?p ?e/, /C ?a ?s ?e ?#/).split(" ");
    event.typeId = type.splice(0, 1)[0];
    event.typeLabel = type.join(" ");
    event.locationString = eventLine.split("Location ")[1];

    let date = eventLine.match(/\d\d\/\d\d\/\d\d\d\d\W+\d\d:\d\d:\d\d/);
    event.timestamp = date ? new Date(date[0]) : null;

    event.caseNumber = fromTo(eventLine, /C ?a ?s ?e ?#/, /S ?u ?b ?t ?y ?p ?e/);
    event.subtypeId = fromTo(eventLine, /S ?u ?b ?t ?y ?p ?e/, /D ?i ?s ?p ?o ?s ?i ?t ?i ?o ?n/);
    event.disposition = fromTo(eventLine, /D ?i ?s ?p ?o ?s ?i ?t ?i ?o ?n/, /D ?e ?s ?c ?r ?i ?p ?t ?\./);
    event.description = fromTo(eventLine, /D ?e ?s ?c ?r ?i ?p ?t ?\./, /L ?o ?c ?a ?t ?i ?o ?n/);
    // event.disposition = eventLine.split("D ?i ?s ?p ?o ?s ?i ?t ?i ?o ?n")[1].split("Descript.")[0];
    // event.description = eventLine.split("Descript.")[1].split("Location")[0];

    event._id = event.eventId;
    return event;
};
Event = mongoose.model('Event', EventSchema);

module.exports = Event;