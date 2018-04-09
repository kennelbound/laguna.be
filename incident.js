const request = require('request');
const PDFParser = require("pdf2json");
var mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;

class Incident {
    constructor() {
        this.incidentId = null;
        this.typeId = null;
        this.typeLabel = null;
        this.subtypeId = null;
        this.timestamp = null;
        this.caseNumber = null;
        this.disposition = null;
        this.description = null;
        this.location = null;
    }

    json() {
        return {
            incidentId: this.incidentId,
            typeId: this.typeId,
            typeLabel: this.typeLabel,
            subtypeId: this.subtypeId,
            timestamp: this.timestamp,
            caseNumber: this.caseNumber,
            disposition: this.disposition,
            description: this.description,
            location: this.location
        }
    }

    static fromJSON(json) {
        let incident = new Incident();
        incident.incidentId = json.incidentId;
        incident.typeId = json.typeId;
        incident.typeLabel = json.typeLabel;
        incident.subtypeId = json.subtypeId;
        incident.timestamp = json.timestamp;
        incident.caseNumber = json.caseNumber;
        incident.disposition = json.disposition;
        incident.description = json.description;
        incident.location = json.location;
        return incident;
    }

    static fromTo(text, startWord, endWord) {
        let start = text.split(startWord);
        if (start.length === 1) {
            return "";
        }
        return start[1].split(endWord)[0].trim();
    }

    static fetchAndParse(url) {
        return new Promise((resolve, reject) => {
            let pdfParser = new PDFParser();

            pdfParser.on("pdfParser_dataError", errData => reject("pdfParseError:" + errData.parserError));
            pdfParser.on("pdfParser_dataReady", pdfData => {
                try {
                    let incidents = Incident._processPDFJSON(pdfParser, pdfData);
                    console.log("PDF Parsed incidents", incidents.length);
                    resolve(incidents);
                } catch (err) {
                    console.error("Failed to parse pdf json", err);
                    reject(err);
                }
            });

            request
                .get(url)
                .on('error', function (err) {
                    reject(err);
                })
                .pipe(pdfParser);
        })
    }

    static _processPDFJSON(parser, data) {
        let incidents = [];
        let line = "";

        data.formImage.Pages.forEach((page) => {
            page.Texts.forEach((text) => {
                let val = text.R.map(rec => {
                    return rec.T ? decodeURIComponent(rec.T) : "";
                }).join("");

                // console.log(val);

                if (val.indexOf("______________________________________") > -1) {
                    line = line.replace(/\_+/, "");
                    incidents.push(Incident._parseLine(line));
                    line = "";
                } else {
                    line += val + " ";
                }
            });
            incidents.push(Incident._parseLine(line));
            line = "";
        });

        incidents.push(Incident._parseLine(line));
        return incidents.filter(it => {
            return it !== null;
        });
    }

    static _parseLine(incidentLine) {
        let incident = new Incident();
        if (incidentLine.indexOf("Event #") === -1) {
            return null;
        }

        incident.line = incidentLine;
        incident.incidentId = Incident.fromTo(incidentLine, /E ?v ?e ?n ?t ?#/, /T ?y ?p ?e/);

        let type = Incident.fromTo(incidentLine, /T ?y ?p ?e/, /C ?a ?s ?e ?#/).split(" ");
        incident.typeId = type.splice(0, 1)[0];
        incident.typeLabel = type.join(" ");
        incident.locationString = incidentLine.split("Location ")[1];

        let date = incidentLine.match(/\d\d\/\d\d\/\d\d\d\d\W+\d\d:\d\d:\d\d/);
        incident.timestamp = date ? new Date(date[0]) : null;

        incident.caseNumber = Incident.fromTo(incidentLine, /C ?a ?s ?e ?#/, /S ?u ?b ?t ?y ?p ?e/);
        incident.subtypeId = Incident.fromTo(incidentLine, /S ?u ?b ?t ?y ?p ?e/, /D ?i ?s ?p ?o ?s ?i ?t ?i ?o ?n/);
        incident.disposition = Incident.fromTo(incidentLine, /D ?i ?s ?p ?o ?s ?i ?t ?i ?o ?n/, /D ?e ?s ?c ?r ?i ?p ?t ?\./);
        incident.description = Incident.fromTo(incidentLine, /D ?e ?s ?c ?r ?i ?p ?t ?\./, /L ?o ?c ?a ?t ?i ?o ?n/);

        // incident._id = new ObjectID(incident.incidentId);
        return incident;
    }
}

module.exports = Incident;