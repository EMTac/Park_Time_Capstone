// Access token for mapbox API
const accessToken = 'pk.eyJ1IjoiZW10YWMiLCJhIjoiY2w5ejR0bXZyMGJpbDNvbG5jMTFobGJlZCJ9.UMi2J2LPPuz0qbFaCh0uRA';    
// App ID for TravelTime Isochrone generator
const APPLICATION_ID = "7cf7cc27"
// Application Key for TravelTime isochrone generator
const API_KEY = "0874bc9fae906324041167cb3348c66b"
// Creating tilemap for light theme
var light = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id:'mapbox/light-v10',
    accessToken: accessToken,
    tileSize: 512,
    zoomOffset: -1,
});

// Creating tilemap for dark theme
var dark = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id:'mapbox/dark-v10',
    accessToken: accessToken,
    tileSize: 512,
    zoomOffset: -1,
});

// Creating map object and setting initial view
const map = L.map('map', {layers:[light]})

map.on('load', onMapLoad);
map.fitWorld();
map.setView([47.22, -120.97], 8);

// Adding light and dark tilemaps as basemaps
var baseMaps = {
    "Light Theme": light,
    "Dark Theme": dark
};

// Creating custom icon to mark user-specified location
var LeafIcon = L.Icon.extend({
    options: {
        iconUrl: 'resources/red-marker.png',
        shadowUrl: 'resources/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }
});

var redIcon = new LeafIcon;

// Creating layergroup to store marker. This allows the layergroup to be cleared when the user chooses a new location
const layerGroup = L.layerGroup();

var activeMarker;

// Using leaflet-control-geocoder plugin to add geocoding function to map. Search results limited to Washington
var geocoder = L.Control.geocoder({
    defaultMarkGeocode: false,
    placeholder: "Find an Address in Washington",
    collapsed: false,
    geocoder: new L.Control.Geocoder.Nominatim({
        geocodingQueryParams: {"viewbox": "-124.80854040819138, 45.15013696014261, -116.6733582340411, 49.08335516894325", "bounded": "1"},
    })
})
// When a geocoding result is produced, a custom icon is created and can be adjusted by the user
    .on('markgeocode', function(e) {
        layerGroup.clearLayers();
        var latlng = e.geocode.center;
        activeMarker = new L.marker(latlng, {
            icon: redIcon,
            draggable: true
                })
                .bindTooltip("Drag me to update the location")
                .bindPopup(e.geocode.name + "<br>" + "Lat: " + latlng.lat.toFixed(4) + "<br>Lng: " + latlng.lng.toFixed(4))
                .addTo(layerGroup)
                .on('dragend', onDragEnd);
        map.setView(latlng, 16);
        map.addLayer(layerGroup);
        activeMarker.openPopup();
    }).addTo(map);
// // When the custom icon is moved, this function updates the popup to include the current coordinates
function onDragEnd(e) {
    var activeMarker = e.target;
    var latlng = activeMarker.getLatLng();
    activeMarker.bindPopup("Lat: " + latlng.lat.toFixed(4) + "<br>Lng: " + latlng.lng.toFixed(4)).openPopup();
}

// When the map is right clicked, this listener creates a custom marker and updates the popup with the current location
map.on('contextmenu', function(e){
    var latlng = e.latlng;
    layerGroup.clearLayers();
    activeMarker = new L.marker(latlng, {
        icon: redIcon,
        draggable: true
            })
            .bindTooltip("Drag me to update the location")
            .bindPopup("Lat: " + latlng.lat.toFixed(4) + "<br>Lng: " + latlng.lng.toFixed(4))
            .addTo(layerGroup)
            .on('dragend', onDragEnd);
    map.addLayer(layerGroup);
    activeMarker.openPopup();
});

var timeMapButton = L.easyButton('fa-clock', function(btn, map) {
    if (activeMarker) {
      updateStyle(activeMarker.getLatLng());
    }
  }).setPosition('topright');
  
  timeMapButton.addTo(map);

  var differencePolygonGroup = L.layerGroup()
  var differencePolygons = [];

  async function sendTimeMapRequest() {

    
    
    // The request for Time Map. Reference: http://docs.traveltimeplatform.com/reference/time-map/
    var latLng = { lng: activeMarker.getLatLng().lng, lat: activeMarker.getLatLng().lat };
    var travelTimes = [5 * 60, 10 * 60, 15 * 60, 20 * 60];
  
    var colors = ['#04d66d', '#3BCA6D', '#77945C', '#B25F4A'];
  
    var polygons = []; // empty array to hold all polygons
  
    for (var i = 0; i < travelTimes.length; i++) {
      var request = {
        departure_searches: [{
          id: "first_location",
          coords: latLng,
          transportation: {
            type: "driving"
          },
  
          departure_time: new Date,
          travel_time: travelTimes[i],
        }],
  
        arrival_searches: []
      };
  
      try {
        const response = await fetch("https://api.traveltimeapp.com/v4/time-map", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Application-Id": APPLICATION_ID,
            "X-Api-Key": API_KEY,
          },
          body: JSON.stringify(request),
        });
  
        if (response.ok) {
          const data = await response.json();
          const polygon = drawTimeMap(data, colors[i]);
          polygons.push(polygon);
        } else {
          throw new Error("Network response was not ok.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  
    // create the new polygon group with difference polygons
    differencePolygons = [polygons[0]];
    for (var i = 1; i < polygons.length; i++) {
      var prevPolygon = polygons[i - 1];
      var currentPolygon = polygons[i];
      var diff = turf.difference(currentPolygon.toGeoJSON(), prevPolygon.toGeoJSON());
      var differencePolygon = L.geoJSON(diff, {
        style: function (feature) {
          if (map.hasLayer(light)){
          return {
            color: colors[i],
            weight: 2,
            fillOpacity: 0.2
          }
          } else { 
            return {
              color: colors[i],
              weight: 1,
              fillOpacity: 0.1
            }
          }
        }
      });
      differencePolygonGroup.clearLayers();
      differencePolygons.push(differencePolygon);
    }
  
    // add all difference polygons to the map at once
    differencePolygonGroup = L.layerGroup(differencePolygons)
    dt = L.featureGroup();
    map.addLayer(differencePolygonGroup);
    testLayer.bringToFront();
    var groupBounds = L.featureGroup(differencePolygons).getBounds();
    map.fitBounds(groupBounds);
  };
  
  function ringCoordsHashToArray(ring) {
    return ring.map(function (latLng) {
      return [latLng.lat, latLng.lng];
    });
  }
  
  function drawTimeMap(response, color) {
  
    // Reference for the response: http://docs.traveltimeplatform.com/reference/time-map/#response-body-json-attributes
    var shapesCoords = response.results[0].shapes.map(function (polygon) {
      var shell = ringCoordsHashToArray(polygon.shell);
      var holes = polygon.holes.map(ringCoordsHashToArray);
      return [shell].concat(holes);
    });
      if (map.hasLayer(light)){
        return L.polygon(shapesCoords, { color: color, fillOpacity: 0.2, weight: 0 });
      }
      else {
        return L.polygon(shapesCoords, { color: color, fillOpacity: 0.1, weight: 0 });
      }
    
  };

// Light and dark theme can be toggled manually
var layerControl = L.control.layers(baseMaps).addTo(map);

// When the map loads, the Suncalc plugin gets the current date and time in Washington and chooses light or dark theme depending on the current light level
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

// Custom styling for the parks layer
var myStyle = {
    "color": "white",
    "fillColor": "#4da343",
    "weight": 1,
    "opacity": 1,
    "fillOpacity": 1,
};

// Parks GeoJSON is added to the map with custom styling on appropriate popups for each feature
var testLayer = L.geoJSON(State_Parks, {
    onEachFeature: onEachFeature,
    boundary: { weight: 0 },
    style: myStyle,
}).addTo(map).bringToFront();

// This function uses the current date and time in Washington to determine if parks in the parks GeoJSON are open or closed, then adjusts their symbology and popups to communicate this to the user
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
    layer.setStyle({fillOpacity: 1, fillColor: "#ED2938", color: "#ffffff"});
}
}

async function updateStyle() {
  await sendTimeMapRequest();
  var geojsonArray = [];

  // Iterate through each Leaflet polygon
  for (var i = 0; i < differencePolygons.length; i++) {
    // Convert the polygon to GeoJSON
    var geojson = differencePolygons[i].toGeoJSON();

    // If the GeoJSON object is a FeatureCollection, iterate through each feature
    if (geojson.type === "FeatureCollection") {
      for (var j = 0; j < geojson.features.length; j++) {
        // Convert each feature to a single feature and add it to the array
        geojsonArray.push({
          type: "Feature",
          properties: geojson.features[j].properties,
          geometry: geojson.features[j].geometry
        });
      }
    } else {
      // Otherwise, add the GeoJSON object to the array as is
      geojsonArray.push(geojson);
    }
  }
// Define an array to hold unique fill colors for each polygon in geojsonArray
var fillColors = ['#04d66d', '#3BCA6D', '#77945C', '#B25F4A'];

// Define a fill color for features that don't intersect any polygons in geojsonArray
var defaultFillColor = '#808080';

// Iterate over each layer in testLayer
testLayer.eachLayer(function(layer) {
  
  if (layer.feature.properties.status === 'open') {
  // Initialize the fill color to the default fill color
  var fillColor = defaultFillColor;

  // Iterate over each polygon in geojsonArray
  for (var i = 0; i < geojsonArray.length; i++) {
    // Use turf.intersect to check if the layer intersects the polygon
    if (turf.intersect(layer.toGeoJSON(), geojsonArray[i])) {
      // If the layer intersects the polygon, set the fill color to the corresponding color from fillColors
      fillColor = fillColors[i];
      break;
    }
  }

  // Define the new style for the layer
  var newStyle = {
    fillColor: fillColor,
    // other style properties to update
  };

  // Apply the new style to the layer
  layer.setStyle(newStyle);
}
});
}
