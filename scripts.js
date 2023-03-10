const accessToken = 'pk.eyJ1IjoiZW10YWMiLCJhIjoiY2w5ejR0bXZyMGJpbDNvbG5jMTFobGJlZCJ9.UMi2J2LPPuz0qbFaCh0uRA';    

var light = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id:'mapbox/light-v10',
    accessToken: accessToken,
    tileSize: 512,
    zoomOffset: -1,
});

var dark = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id:'mapbox/dark-v10',
    accessToken: accessToken,
    tileSize: 512,
    zoomOffset: -1,
});

const map = L.map('map', {layers:[light]})

map.on('load', onMapLoad);
map.fitWorld();
map.setView([47.22, -120.97], 8);

var baseMaps = {
    "Light Theme": light,
    "Dark Theme": dark
};

var geocoder = L.Control.geocoder({
    placeholder: "Find an Address in Washington",
    collapsed: false,
    geocoder: new L.Control.Geocoder.Nominatim({
        geocodingQueryParams: {"viewbox": "-124.80854040819138, 45.15013696014261, -116.6733582340411, 49.08335516894325", "bounded": "1"},
    })
}).addTo(map); 
var layerControl = L.control.layers(baseMaps).addTo(map);


function onMapLoad() {
var times = SunCalc.getTimes(new Date(), 47.22, -121.17);
        var sunrise = times.sunrise.getHours();
        var sunset = times.sunset.getHours();

        var currentTime = new Date().getHours();
            if (sunrise < currentTime && currentTime < sunset){
                map.removeLayer(dark);
                map.addLayer(light);
            }
            else {
                map.removeLayer(light);
                map.addLayer(dark);
            }
};

var myStyle = {
    "color": "#4da343",
    "weight": 0,
    "opacity": 1,
    "fillOpacity": 0.5,
};

var testLayer = L.geoJSON(State_Parks, {
    onEachFeature: onEachFeature,
    boundary: { weight: 0 },
    style: myStyle,
}).addTo(map);

function onEachFeature(feature, layer) {
    if (!feature.properties.Open_Date || feature.properties.Open_Date === null) {
        feature.properties.status = "open";
    } else { 
        let open = feature.properties.Open_Date;
        openSlice = open.slice(0, 2)+ open.slice(3);
        let close = feature.properties.Close_Date;
        closeSlice = close.slice(0, 2)+ close.slice(3);
        var currentYear = new Date().getFullYear();
        var nextYear = currentYear + 1;
        var currentDate = new Date();
        var today = new Date();
        var oneYearLater = today.setFullYear(today.getFullYear() + 1);

        if (closeSlice > openSlice) {
            open+="/"+currentYear;
            close+="/"+currentYear;
        }   else {
            open+="/"+currentYear;
            close+="/"+nextYear;
        }
        var from = Date.parse(open);
        var to   = Date.parse(close);
        var check = Date.parse(currentDate);
        var check2 = Date.parse(oneYearLater);

        if(check <= to && check >= from)  {
            feature.properties.status = "open";
        }   else if (check2 <= to && check2 >= from) {
            feature.properties.status = "open";
        }   else {
            feature.properties.status = "closed";
        }
    }
    var times = SunCalc.getTimes(new Date(), 47.22, -121.17);
    if (!feature.properties.Open_Time || feature.properties.Open_Time === null) {
        feature.properties.status = "open";
    }   else if (feature.properties.status === "open") {
        let openTime = feature.properties.Open_Time;
                if (openTime === "Sunrise-30") {
                    openTime = (times.dawn.getHours()<10?'0':'')+times.dawn.getHours()+""+(times.dawn.getMinutes()<10?'0':'')+times.dawn.getMinutes()
                }   else {
                    openTime = feature.properties.Open_Time;
                };
            let closeTime = feature.properties.Close_Time;
                if (closeTime === "Sunset+30") {
                    closeTime = (times.dusk.getHours()<10?'0':'')+times.dusk.getHours()+""+(times.dusk.getMinutes()<10?'0':'')+times.dusk.getMinutes()
                }   else {
                    closeTime = feature.properties.Close_Time;
                };
            var today2 = new Date();
            var currentTime = today2.getHours()+""+(today2.getMinutes()<10?'0':'')+today2.getMinutes();
            if (currentTime <= closeTime && currentTime >= openTime) {
                feature.properties.status = "open";
            }   else {
                feature.properties.status = "closed";
            }
        }
if (feature.properties.status === "open") {
    layer.bindPopup("<b>"+feature.properties.name+"</b>"+"<hr>"+"Open");
}   else if (feature.properties.status = "closed") {
    layer.bindPopup("<b>"+feature.properties.name+"</b>"+"<hr>"+"Closed. The park will open again on "+feature.properties.Open_Date)
    layer.setStyle({fillOpacity: 0.4, color: "#c22134"});
}
}

