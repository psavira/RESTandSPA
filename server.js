//modules
let path = require('path');
let express = require('express');
let sqlite3 = require('sqlite3');
var fs = require("fs");

let app = express();
let port = 8000;

let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

// open stpaul_crime.sqlite3 database
// data source: https://information.stpaul.gov/Public-Safety/Crime-Incident-Report-Dataset/gppb-g9cg
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));


// REST API: GET /codes
// Respond with list of codes and their corresponding incident type
app.get('/codes', (req, res) => {
    res.header();
    //let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    
    var codeArray = [];
    var query = "SELECT * FROM Codes";

    if (req.query.code !== undefined) { //codes are specified
        var codeDataRows = req.query.code.split(",");

        query += " WHERE code=?";
        for (let i=1; i<codeDataRows.length; i++) {
            query += " OR code=?"
        }
        db.each(query, codeDataRows, (err, row) => {
            codeObj = {};
            codeObj["code"] = row.code;
            codeObj["type"] = row.incident_type;
            codeArray.push(codeObj);            
        }, ()=> {
            res.type("json").send(codeArray);
            //res.type("json").send(JSON.stringify(codeArray, null, 1));
        });


    } else { //codes are NOT specified
        db.each(query, (err, row) => {
            codeObj = {};
            codeObj["code"] = row.code;
            codeObj["type"] = row.incident_type;
            codeArray.push(codeObj);            
        }, ()=> {
            res.type("json").send(codeArray);
            //res.type("json").send(JSON.stringify(codeArray, null, 1));
        });
    }
});

// REST API: GET /neighborhoods
// Respond with list of neighborhood ids and their corresponding neighborhood name
app.get('/neighborhoods', (req, res) => {
    res.header();
    //let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    var neighborhoodArray = []; //needs to be a JSON object instead of a JSON array
    var query = "SELECT * FROM Neighborhoods";

    if (req.query.id !== undefined) { //neighborhoods are specified
        var neighborhoodDataRows = req.query.id.split(",");

        query += " WHERE neighborhood_number=?";
        for (let i=1; i<neighborhoodDataRows.length; i++) {
            query += " OR neighborhood_number=?"
        }
        console.log(query);
        db.each(query, neighborhoodDataRows, (err, row) => {
            neighborhoodObj = {};
            neighborhoodObj["id"] = row.neighborhood_number;
            neighborhoodObj["name"] = row.neighborhood_name;
            neighborhoodArray.push(neighborhoodObj);            
        }, ()=> {
            res.type("json").send(neighborhoodArray);
            //res.type("json").send(JSON.stringify(neighborhoodArray, null, 1));
        });


    } else { //codes are NOT specified
        db.each(query, neighborhoodDataRows, (err, row) => {
            neighborhoodObj = {};
            neighborhoodObj["id"] = row.neighborhood_number;
            neighborhoodObj["name"] = row.neighborhood_name;
            neighborhoodArray.push(neighborhoodObj);            
        }, ()=> {
            res.type("json").send(neighborhoodArray);
            //res.type("json").send(JSON.stringify(neighborhoodArray, null, 1));
        });
    }
});

// REST API: GET/incidents
// Respond with list of crime incidents
app.get('/incidents', (req, res) => { //NOT QUITE WORKING YET
    res.header();
    //let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    
    //setting limit to 1000 by default
    var limit=1000;
    if(req.query.limit!==undefined) {
		limit=parseInt(req.query.limit);
    }

    var incidentArray = [];
    //var query = "SELECT * FROM Incidents ORDER BY date_time DESC LIMIT ?"; //order by time in descending order
    var whereQuery = "";

    //start date
    if(req.query.start_date!==undefined) {
		if(whereQuery==="") {
			whereQuery = "WHERE (date_time >= "+"'"+ req.query.start_date+"T00:00:00"+"')";
		} else {
			whereQuery = whereQuery + " AND (date_time >= "+"'"+req.query.start_date+"T"+"00:00:00')";
		}
    }
    
    //end date
    if(req.query.end_date!==undefined) {
		if(whereQuery==="") {
			whereQuery = "WHERE ( date_time <= "+"'"+ req.query.end_date+"T"+"23:59:59')";
		} else {
			whereQuery = whereQuery + " AND ( date_time <= "+ "'"+req.query.end_date+"T"+"23:59:59')";
		}
	}

    //code
    if(req.query.code!==undefined) {
        var codes=req.query.code.split(",");
        if(whereQuery==="") {
            whereQuery = "WHERE (code="+codes[0];;
        } else {
            whereQuery= whereQuery + " AND (code="+codes[0];
        }
		for(let i =1;i<codes.length;i++) {
			whereQuery = whereQuery+  " OR code="+codes[i];
		}
		whereQuery = whereQuery+")";
    }

    //grid
    if(req.query.grid!==undefined) {
		var grids= req.query.grid.split(",");
		if(whereQuery==="") {
			whereQuery = "WHERE (police_grid="+grids[0];
		} else {
			whereQuery = whereQuery+" AND (police_grid="+grids[0];
		}
		for(let i=1;i<grids.length;i++) {
			whereQuery = whereQuery+ " OR police_grid="+grids[i];
		}
		whereQuery = whereQuery+")";
    }
    
    //neighborhood
    if(req.query.neighborhood!==undefined) {
		var neighborhood= req.query.neighborhood.split(",");
		if(whereQuery==="") {
			whereQuery= "WHERE (neighborhood_number="+neighborhood[0];
		} else {			
			whereQuery = whereQuery + " AND (neighborhood_number="+neighborhood[0];
		}
		for(let i =1;i<neighborhood.length;i++){
			whereQuery = whereQuery + " OR neighborhood_number="+ neighborhood[i];
		}
		whereQuery = whereQuery+")";
	}

    //let fullQuery = "SELECT * FROM Incidents " + whereQuery + "ORDER BY date_time DESC LIMIT ?";
    //console.log(fullQuery);
    db.each("SELECT * FROM Incidents " + whereQuery + "ORDER BY date_time DESC LIMIT ?", [limit], (err, row) => {
        incidentObj = {};
        incidentObj["case_number"] = row.case_number;
        var dateAndTime = row.date_time.split("T");
        incidentObj["date"] = dateAndTime[0];
        incidentObj["time"] = dateAndTime[1];
        incidentObj["code"] = row.code;
        incidentObj["incident"] = row.incident;
        incidentObj["police_grid"] = row.police_grid;
        incidentObj["neighborhood_number"] = row.neighborhood_number;
        incidentObj["neighborhood_name"] = row.neighborhood_name;
        incidentObj["block"] = row.block;
        incidentArray.push(incidentObj);            
    }, ()=> {
        res.type("json").send(incidentArray);
        //res.type("json").send(JSON.stringify(incidentArray, null, 1));
    });
});

// REST API: PUT /new-incident

// Respond with 'success' or 'error'

app.put('/new-incident', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    //check for case_number
    if(req.body.hasOwnProperty("case_number") == false) {
        res.status(500).send("Need case number");
    }

    //create new incident object
    var new_incident = {
        case_number: req.body.case_number,
        date_time: "",
        code: "",
        incident: "",
        police_grid: "",
        neighborhood_number: "",
        block: ""
    }

    //populate object if fields exist
    if(req.body.hasOwnProperty("date")) {
        new_incident["date_time"] = req.body.date;
    }
    if(req.body.hasOwnProperty("time")) {
        new_incident["date_time"] = new_incident.date_time + "T" + req.body.time;
    }
    if(req.body.hasOwnProperty("code")) {
        new_incident["code"] = parseInt(req.body.code);
    }
    if(req.body.hasOwnProperty("incident")) {
        new_incident["incident"] = req.body.incident;
    }
    if(req.body.hasOwnProperty("police_grid")) {
        new_incident["police_grid"] = parseInt(req.body.police_grid);
    }
    if(req.body.hasOwnProperty("neighborhood_number")) {
        new_incident["neighborhood_number"] = req.body.neighborhood_number;
    }
    if(req.body.hasOwnProperty("block")) {
        new_incident["block"] = req.body.block;
    }

    //check if case number already exists
    db.all("SELECT * FROM Incidents WHERE case_number=?", [new_incident.case_number], (err, row) => {
        if(row.length > 0) {
            res.status(500).send("The case number already exists");
        } else if (err) {
            res.status(500).send("error with database");
        } else {
            //add to database
            db.run("INSERT INTO incidents (case_number, date_time, code, incident, police_grid, neigborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?", [new_incident.case_number, new_incident.date_time, new_incident.code, new_incident.incident, new_incident.police_grid, new_incident.neighborhood_number, new_incident.block], (err) => {
                if(err){
                    res.status(500).send("error inserting incident into database");
                    console.log("error when inserting incident into database");
                    console.log(err);
                } else {
                    res.status(200).type('txt').send('success');
                }
            });
        }

    });

});

// Create Promise for SQLite3 database SELECT query 
function databaseSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        })
    })
}

// Create Promise for SQLite3 database INSERT query
function databaseInsert(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}


// Start server
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
