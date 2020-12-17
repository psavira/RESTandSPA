let app;
let map;
let neighborhood_markers = 
[
    {count:0, location: [44.942068, -93.020521], marker: null},
    {count:0, location: [44.977413, -93.025156], marker: null},
    {count:0, location: [44.931244, -93.079578], marker: null},
    {count:0, location: [44.956192, -93.060189], marker: null},
    {count:0, location: [44.978883, -93.068163], marker: null},
    {count:0, location: [44.975766, -93.113887], marker: null},
    {count:0, location: [44.959639, -93.121271], marker: null},
    {count:0, location: [44.947700, -93.128505], marker: null},
    {count:0, location: [44.930276, -93.119911], marker: null},
    {count:0, location: [44.982752, -93.147910], marker: null},
    {count:0, location: [44.963631, -93.167548], marker: null},
    {count:0, location: [44.973971, -93.197965], marker: null},
    {count:0, location: [44.949043, -93.178261], marker: null},
    {count:0, location: [44.934848, -93.176736], marker: null},
    {count:0, location: [44.913106, -93.170779], marker: null},
    {count:0, location: [44.937705, -93.136997], marker: null},
    {count:0, location: [44.949203, -93.093739], marker: null}
];

//MAP and MARKERS
function neighborhoodMarkers() {
    $.getJSON("http://localhost:8000/neighborhoods")
        .then(data => {
            console.log(data[0]);
            for(let n in neighborhood_markers){
                let latLng = neighborhood_markers[n].location;
                let neighborhoodName = data[n].name;
                let popup = L.popup({closeOnClick: false, autoClose: false}).setContent(neighborhoodName + ' (crime count)');
                let marker = L.marker(latLng, {title: neighborhoodName, icon:L.icon({iconUrl: 'img/houses.png', iconSize: [25,25],
                    popupAnchor: [0,0]})}).bindPopup(popup).addTo(map).openPopup();
                    neighborhood_markers[n].marker = marker;
            }
            
        }).catch(err => {
            console.log(err);
        });
    
    $.getJSON("http://localhost:8000/incidents")
        .then(incidentData => {
            let count = 0;
            for(let n in incidentData){
                neighborhood_markers[(incidentData[n].neighborhood_number)-1].count++;
            }
            for(let n in neighborhood_markers){
                let popup = neighborhood_markers[n].marker.getPopup();
                let updatedPopup = popup.getContent().replace(' (crime count)', ': '+ neighborhood_markers[n].count);
                popup.setContent(updatedPopup);
            }
            app.incidents = incidentData; //populate table
        }).catch(err => {
            console.log(err);
        });
    }


function popAddress(){
    getJSON('https://nominatim.openstreetmap.org/search?format=json&country=United States&state=MN&city=St.Paul&street=' + app.map.address)
    .then(data => {
        if(data.length>0) {
            app.map.center.lat = data[0].lat;
            app.map.center.lng = data[0].lng; 
            map.setZoom(17); //zoom
            map.panZoom([app.map.center.lat, app.map.center.lng]); //pan
            popTable(1000); //update table here
        } else {
            alert("invalid address");
        }
    }).catch(err => {
        console.log(err);
    });
}

function popTable(limit) {
    var getNeighborhoodLatLng = []; //array of lat,lng
    for(i=0; i<neighborhood_markers.length; i++) {
        if((map.getBounds()).contains(L.latlng(neighborhood_markers[i].location[0], neighborhood_markers[i].location[1]))) {
            getNeighborhoodLatLng.push(i+1);
        }
    }

    var incidentNeighborhoodAPI = "http://localhost:8000/incidents?neighborhood=" + getNeighborhoodLatLng.join(',');
    if(limit!="") {
        incidentNeighborhoodAPI = incidentNeighborhoodAPI+"&limit="+limit;
    }



    /*$.getJSON("http://localhost:8000/incidents")
        .then(incidentData => {
            let count = 0;
            for(let n in incidentData){
                neighborhood_markers[(incidentData[n].neighborhood_number)-1].count++;
            }
            for(let n in neighborhood_markers){
                let popup = neighborhood_markers[n].marker.getPopup();
                let updatedPopup = popup.getContent().replace(' (crime count)', ': '+ neighborhood_markers[n].count);
                popup.setContent(updatedPopup);
            }
            app.incidents = incidentData; //populate table
        }).catch(err => {
            console.log(err);
        });*/
}

function init() {
    let crime_url = 'http://localhost:8000';

    app = new Vue({
        el: '#app',
        data: {
            map: {
                center: {
                    lat: 44.955139,
                    lng: -93.102222,
                    address: ""
                },
                zoom: 12,
                bounds: {
                    nw: {lat: 45.008206, lng: -93.217977},
                    se: {lat: 44.883658, lng: -92.993787}
                }
            },
            Murder:true,
            Rape:true,
            Robbery: true,
            Vandalism: true,
            Burglary: true,
            Theft: true,
            Narcotics:true,

            ConwayBattlecreekHighwood: true,
            GreaterEastSide: true,            
            WestSide: true,
            DaytonsBluff: true,
            PaynePhalen: true,
            NorthEnd: true,
            ThomasDaleFrogtown: true,
            SummitUniversity: true,
            WestSeventh: true,
            Como: true,
            HamlineMidway: true,
            StAnthony: true,
            UnionPark: true,
            MacalesterGroveland: true,
            Highland: true,
            SummitHill: true,
            CapitolRiver: true,

            incidents:[],
            incidentMarkers:[],
            neighborhoods:[],
            showNeighborhoods:[],
            startTime:"00:00:01",
            endTime:"23:59:59",
            limit: 1000, //default to 1000
            startDate: "2020-01-01",
            endDate: new Date().toISOString().slice(0,10)
        }
    });

    map = L.map('leafletmap').setView([app.map.center.lat, app.map.center.lng], app.map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 11,
        maxZoom: 18
    }).addTo(map);
    map.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);
    //map on?
    
    let district_boundary = new L.geoJson();
    district_boundary.addTo(map);

    getJSON('data/StPaulDistrictCouncil.geojson').then((result) => {
        // St. Paul GeoJSON
        $(result.features).each(function(key, value) {
            district_boundary.addData(value);
        });
    }).catch((err) => {
        console.log('Error:', err);
    });

    neighborhoodMarkers();
}

function getJSON(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            dataType: "json",
            url: url,
            success: function(data) {
                resolve(data);
            },
            error: function(status, message) {
                reject({status: status.status, message: status.statusText});
            }
        });
    });
}



//TABLE
function tableColor(crime) {
    for(crime in app.incident) {
        if (crime.incident.has("Murder", "Rape", "Robberies", "Assaults")) {
            return "background-color: red;";
        } else if (crime.incident.has("Bulglaries", "Thefts", "Arson", "Property Damage", "Graffiti")) {
            return "background-color: orange;";
        } else if (crime.incident.has("Narcotics")) {
            return "background-color: yellow;";
        } else {
            return "background-color: white;";
        }
    }
}

/*function tableColor(crime) {
    for(crime in app.incident) {
        if (crime.incident.has("Murder", "Rape", "Robberies", "Assaults")) {
            return "red;";
        } else if (crime.incident.has("Bulglaries", "Thefts", "Arson", "Property Damage", "Graffiti")) {
            return "orange;";
        } else if (crime.incident.has("Narcotics")) {
            return "yellow;";
        } else {
            return "white;";
        }
    }
}*/


function tableRowColor(code) {
    if(code<500 || code>=810 && code<900) { //murders, rapes, robberies, etc || domestic assaults
        return 'red';
    } else if(code>=500 && code<810 && code!=614 || code>=900 && code<1800) { //bulglaries, thefts || arson, property damage, graffiti
        return 'orange';
    } else if(code>=1800 && code<2619) { //narcotics
        return 'yellow';
    } else {
        return 'white';
    }
}

