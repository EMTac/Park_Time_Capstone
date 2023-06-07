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
let travelTimes = [10, 20, 30, 40];
let departureTime = new Date();

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

const optionsButton = document.querySelector('#options');
const optionsPane = document.querySelector('#options-pane');
const profileButton = document.querySelector('#profile');
const profilePane = document.querySelector('#profile-pane');
const caret = document.querySelector('#caret')
const caret2 = document.querySelector('#caret2')
const mapboxLabel = document.querySelector('#options-pane label#mapbox-label');
const travelTimeLabel = document.querySelector('#options-pane label#traveltime-label');
const profileLabels = document.querySelectorAll('#profile-pane label');
const optionLabels = document.querySelectorAll('#options-pane label');

function resetProfileLabels() {
  profileLabels.forEach(function(label) {
    label.style.backgroundColor = '';
    const carsItem = label.querySelectorAll('i');
    carsItem.forEach(function(item) {
      item.style.backgroundColor = '';
    });
    if (label.querySelector('input').checked) {
      label.style.backgroundColor = '#0f2eb8';
      carsItem.forEach(function(item) {
        item.style.backgroundColor = '#0f2eb8';
      });
    }
  });
}

profileLabels.forEach(function(label) {
  label.addEventListener('click', function() {
    resetProfileLabels();
    const carsItem = label.querySelectorAll('i');
    carsItem.forEach(function(item) {
      item.style.backgroundColor = '#0f2eb8';
    });
    label.style.backgroundColor = '#0f2eb8';
    label.style.borderRadius = '5px';
  });
});

// trigger a click event on the default option label
document.querySelector('#traffic').click();

function resetOptionLabels() {
  optionLabels.forEach(function(label) {
    label.style.backgroundColor = '';
    if (label.querySelector('input').checked) {
      label.style.backgroundColor = '#0f2eb8';
    }
  });
}

optionLabels.forEach(function(label) {
  label.addEventListener('click', function() {
    resetOptionLabels();
    label.style.backgroundColor = '#0f2eb8';
    label.style.borderRadius = '5px';
  });
});

document.querySelector('#mapbox-label').click();

optionsButton.addEventListener('click', (event) => {
  event.stopPropagation();
  optionsPane.classList.toggle('visible');
  caret.classList.toggle('visible');
});

profileButton.addEventListener('click', (event) => {
  event.stopPropagation();
  profilePane.classList.toggle('visible');
  caret2.classList.toggle('visible');
});

document.addEventListener('click', (event) => {
  const isOptionsButtonClicked = optionsButton.contains(event.target);
  const isProfileButtonClicked = profileButton.contains(event.target);
  const isInsideOptionsPane = optionsPane.contains(event.target);
  const isInsideProfilePane = profilePane.contains(event.target);

  if (!isOptionsButtonClicked && !isInsideOptionsPane) {
    optionsPane.classList.remove('visible');
    caret.classList.remove('visible');
  }

  if (!isProfileButtonClicked && !isInsideProfilePane) {
    profilePane.classList.remove('visible');
    caret2.classList.remove('visible');
  }
});

const timeMapInput = document.querySelector('#calculate');

timeMapInput.addEventListener('click', function() {
    if (activeMarker) {
      updateStyle(activeMarker.getLatLng());
    } else {
      var calculatePane = document.getElementById("calculate-pane");
      calculatePane.classList.add("visible");
      setTimeout(function() {
        calculatePane.classList.remove("visible");
      }, 4000);
        }
  });

  var differencePolygonGroup = L.layerGroup()
  var differencePolygons = [];

  async function sendMapboxRequest() {

    var tabContent = document.getElementById("content1");
    var tabContent2 = document.getElementById("content2");
    var tabContent3 = document.getElementById("content3");
    var tabContent4 = document.getElementById("content4");
    tabContent.innerHTML = "";
    tabContent2.innerHTML = "";
    tabContent3.innerHTML = "";
    tabContent4.innerHTML = "";
    const urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';
    // The request for Time Map. Reference: http://docs.traveltimeplatform.com/reference/time-map/
    var latlng = { lng: activeMarker.getLatLng().lng, lat: activeMarker.getLatLng().lat };
    var selectedProfile = document.querySelector('input[name="travel-method"]:checked');
    var profile = selectedProfile ? selectedProfile.value : "driving-traffic";
    var colors = ['#04d66d', '#42a858', '#77945C', '#bf7530'];
    const polygonsOn = true;
    var polygons = []; // empty array to hold all polygons
    
    document.getElementById("loading-animation").style.display = "flex";

    for (var i = 0; i < travelTimes.length; i++) {
      var url = `${urlBase}${profile}/${latlng.lng},${latlng.lat}?contours_minutes=${travelTimes[i]}&polygons=${polygonsOn}&access_token=${accessToken}`;
      
      try {
        const response = await fetch(url);
  
        if (response.ok) {
          const data = await response.json();
          const polygon = L.geoJSON(data, {
            style: {
                color: colors[i],
                weight: 2,
                opacity: 0.5,
                fillOpacity: 0.1
            }
        });
          polygons.push(polygon);
        } else {
          document.getElementById("loading-animation").style.display = "none";
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
      var diff = turf.difference(currentPolygon.toGeoJSON().features[0], prevPolygon.toGeoJSON().features[0]);
      var differencePolygon = L.geoJSON(diff, {
        style: function (feature) {
          if (map.hasLayer(light)){
          return {
            color: colors[i],
            weight: 2,
            fillOpacity: 0.1
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
    // map.addLayer(differencePolygonGroup);
    testLayer.bringToFront();
    var groupBounds = L.featureGroup(differencePolygons).getBounds();
    map.fitBounds(groupBounds);
    var collapseButton = document.getElementById("collapseButton");
    collapseButton.style.display = "block";

    if (isSidebarCollapsed === true) {
      collapseButton.click();
    }
    closeButton.style.display = "inline-block";
  };

  async function sendTravelTimeRequest() {

    // The request for Time Map. Reference: http://docs.traveltimeplatform.com/reference/time-map/
    var latLng = { lng: activeMarker.getLatLng().lng, lat: activeMarker.getLatLng().lat };
  
    var colors = ['#04d66d', '#42a858', '#77945C', '#bf7530'];
  
    var polygons = []; // empty array to hold all polygons
  
    for (var i = 0; i < travelTimes.length; i++) {
      var request = {
        departure_searches: [{
          id: "first_location",
          coords: latLng,
          transportation: {
            type: "driving"
          },
  
          departure_time: departureTime,
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
            fillOpacity: 0.1
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
    // map.addLayer(differencePolygonGroup);
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
        return L.polygon(shapesCoords, { color: color, fillOpacity: 0.1, weight: 0 });
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
        var sunrise = times.sunrise;
        var sunset = times.sunset;

        var currentTime = new Date();
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
    "color": "#4da343",
    "fillColor": "#4da343",
    "weight": 1,
    "opacity": 1,
    "fillOpacity": 0.1,
};

var testLayer = L.geoJSON(State_Parks, {
    onEachFeature: onEachFeature,
    boundary: { weight: 0 },
    style: myStyle,
}).addTo(map).bringToFront();

var closeButton = document.getElementById("closeMap");

closeButton.addEventListener("click", function () {
  map.eachLayer(function (layer) {
    if (layer !== light && layer !== dark) {
      map.removeLayer(layer);
    }
    if (isSidebarCollapsed === false) {
      var collapseButton = document.getElementById("collapseButton");
      collapseButton.click();
      collapseButton.style.display = "none";
    }
    activeMarker = null;
  closeButton.style.display = "none";
  var tabContent = document.getElementById("content1");
    var tabContent2 = document.getElementById("content2");
    var tabContent3 = document.getElementById("content3");
    var tabContent4 = document.getElementById("content4");
    tabContent.innerHTML = "";
    tabContent2.innerHTML = "";
    tabContent3.innerHTML = "";
    tabContent4.innerHTML = "";
  });

  testLayer = L.geoJSON(State_Parks, {
    onEachFeature: onEachFeature,
    boundary: { weight: 0 },
    style: myStyle,
  }).addTo(map).bringToFront();
});

// This function uses the current date and time in Washington to determine if parks in the parks GeoJSON are open or closed, then adjusts their symbology and popups to communicate this to the user
function onEachFeature(feature, layer) {
    const tempDate = new Date();
    if (!feature.properties.Open_Date || feature.properties.Open_Date === null) {
        feature.properties.status = "open";
    } else { 
        let open = feature.properties.Open_Date;
        openSlice = open.slice(0, 2)+ open.slice(3);
        let close = feature.properties.Close_Date;
        closeSlice = close.slice(0, 2)+ close.slice(3);
        var currentYear = tempDate.getFullYear();
        var nextYear = currentYear + 1;
        var currentDate = new Date();
        var today = tempDate;
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
    var times = SunCalc.getTimes(tempDate, 47.22, -121.17);
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
            var today2 = tempDate;
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
    layer.setStyle({fillOpacity: 0.1, fillColor: "#d13c21", color: "#d13c21"});
}
}

function zoomToFeature(layer, bounds) {
  map.fitBounds(bounds);

  // Create a duplicate feature
  var duplicateFeature = L.geoJSON(layer.toGeoJSON(), {
    style: function (feature) {
      // Use a custom style for the duplicate feature
      return {
        fillColor: 'transparent',
        color: 'white',
        weight: 0,
      };
    },
  }).addTo(map);

  // Get the center of the duplicate feature's bounds
  var center = duplicateFeature.getBounds().getCenter();

  // Set up CSS animation for cascading effect
  var svgElement = duplicateFeature.getLayers()[0]._path;
  svgElement.setAttribute('stroke-dasharray', '2500 1000'); // Constant dash array
  svgElement.setAttribute('stroke-dashoffset', '0'); // Start with offset 0
  svgElement.style.animation = 'none'; // Reset the animation

  // Define the fixed duration for the animation
  var animationDuration = 5; // Adjust the duration as needed

  // Delay the animation setup to allow resetting the properties
  setTimeout(function () {
    // Set up SVG animation for cascading effect
    svgElement.style.animation = `cascade ${animationDuration}s linear forwards`; // Adjust the duration as needed

    // Define keyframes for the cascading animation
    var cascadeKeyframes = `
      @keyframes cascade {
        0% {
          stroke-dashoffset: 0;
          stroke-opacity: 0;
          stroke-width: 0px;
        }
        10% {
          stroke-opacity: 1;
          stroke-width: 7px;
          stroke: #e66add;
        }
        50% {
          stroke-opacity: 0.7;
          stroke-width: 4px;
        }
        70% {
          stroke-opacity: 1;
          stroke-width: 7px;
        }
        100% {
          stroke-dashoffset: 8000;
          stroke-opacity: 0;
          stroke-width: 0px;
        }
      }
    `;

    // Create a style element and append the cascadeKeyframes to it
    var styleElement = document.createElement('style');
    styleElement.innerHTML = cascadeKeyframes;

    // Append the style element to the document's head
    document.head.appendChild(styleElement);

    // Remove the duplicate feature after a certain duration (e.g., animationDuration seconds)
    setTimeout(function () {
      map.removeLayer(duplicateFeature);
      document.head.removeChild(styleElement);
    }, animationDuration * 1000); // Adjust the duration as needed
  }, 100); // Adjust the delay as needed

  // Add click event listener to remove the duplicate feature and propagate the click to the original feature
  duplicateFeature.on('click', function (event) {
    map.removeLayer(duplicateFeature);
    layer.fire('click', event); // Propagate the click event to the original feature
  });
}

async function updateStyle() {
  const provider = document.querySelector('input[name="provider"]:checked').value;
  if (provider === 'mapbox') {
    await sendMapboxRequest();
  } else if (provider === 'traveltime') {
    await sendTravelTimeRequest();
  }
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
var fillColors = ['#04d66d', '#42a858', '#77945C', '#bf7530'];
var newWeight = 4;
// Define a fill color for features that don't intersect any polygons in geojsonArray
var defaultFillColor = '#808080';
var defaultWeight = 1;

var tabContent = document.getElementById("content1");
var tabContent2 = document.getElementById("content2");
var tabContent3 = document.getElementById("content3");
var tabContent4 = document.getElementById("content4");
// Iterate over each layer in testLayer
testLayer.eachLayer(function(layer) {
  if (layer.feature.properties.status === 'open') {
  // Initialize the fill color to the default fill color
  var fillColor = defaultFillColor;
  var weight = defaultWeight
  // Iterate over each polygon in geojsonArray
  for (var i = 0; i < geojsonArray.length; i++) {
    // Use turf.intersect to check if the layer intersects the polygon
    if (turf.intersect(layer.toGeoJSON(), geojsonArray[i])) {
      // If the layer intersects the polygon, set the fill color to the corresponding color from fillColors
      fillColor = fillColors[i];
      weight = newWeight;
      break;
    }
  }

  // Define the new style for the layer
  var newStyle = {
    fillColor: fillColor,
    fillOpacity: 0.1,
    color: fillColor,
    weight: weight,
    // other style properties to update
  };

  // Add features to the corresponding tabs and update them if necessary
  if (newStyle.fillColor === "#04d66d") {
    var tabContent = document.getElementById("content1");
    var featureName = layer.feature.properties.name;
    var bounds = layer.getBounds();
  
    // Extract individual coordinates
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
  
    // Construct the bounds string manually
    var boundsString = "L.latLngBounds([" + sw.lat + ", " + sw.lng + "], [" + ne.lat + ", " + ne.lng + "])";
  
    tabContent.innerHTML += "<p>" + featureName + "</p>" + "<button onclick='zoomToFeature(testLayer.getLayer(" + layer._leaflet_id + "), " + boundsString + ")'>Zoom To <i class='fa-solid fa-magnifying-glass'></i></button><img src='resources/parkPic.jpg'><div class='sidebar-divider'></div>";
  } else if (newStyle.fillColor === "#42a858") {
    var tabContent2 = document.getElementById("content2");
    var featureName = layer.feature.properties.name;
    var bounds = layer.getBounds();
  
    // Extract individual coordinates
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
  
    // Construct the bounds string manually
    var boundsString = "L.latLngBounds([" + sw.lat + ", " + sw.lng + "], [" + ne.lat + ", " + ne.lng + "])";
  
    tabContent2.innerHTML += "<p>" + featureName + "</p>" + "<button onclick='zoomToFeature(testLayer.getLayer(" + layer._leaflet_id + "), " + boundsString + ")'>Zoom To <i class='fa-solid fa-magnifying-glass'></i></button><img src='resources/parkPic.jpg'><div class='sidebar-divider'></div>";
  } else if (newStyle.fillColor === "#77945C") {
    var tabContent3 = document.getElementById("content3");
    var featureName = layer.feature.properties.name;
    var bounds = layer.getBounds();
  
    // Extract individual coordinates
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
  
    // Construct the bounds string manually
    var boundsString = "L.latLngBounds([" + sw.lat + ", " + sw.lng + "], [" + ne.lat + ", " + ne.lng + "])";
  
    tabContent3.innerHTML += "<p>" + featureName + "</p>" + "<button onclick='zoomToFeature(testLayer.getLayer(" + layer._leaflet_id + "), " + boundsString + ")'>Zoom To <i class='fa-solid fa-magnifying-glass'></i></button><img src='resources/parkPic.jpg'><div class='sidebar-divider'></div>";
  } else if (newStyle.fillColor === "#bf7530") {
    var tabContent4 = document.getElementById("content4");
    var featureName = layer.feature.properties.name;
    var bounds = layer.getBounds();
  
    // Extract individual coordinates
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
  
    // Construct the bounds string manually
    var boundsString = "L.latLngBounds([" + sw.lat + ", " + sw.lng + "], [" + ne.lat + ", " + ne.lng + "])";
  
    tabContent4.innerHTML += "<p>" + featureName + "</p>" + "<button onclick='zoomToFeature(testLayer.getLayer(" + layer._leaflet_id + "), " + boundsString + ")'>Zoom To <i class='fa-solid fa-magnifying-glass'></i></button><img src='resources/parkPic.jpg'><div class='sidebar-divider'></div>";
  }

    // Apply the new style to the layer
    layer.setStyle(newStyle);
    document.getElementById("loading-animation").style.display = "none";
}
});



if (tabContent.innerHTML === "") {
  tabContent.innerHTML += "No parks found in this range";
}
if (tabContent2.innerHTML === "") {
  tabContent2.innerHTML += "No parks found in this range";
}
if (tabContent3.innerHTML === "") {
  tabContent3.innerHTML += "No parks found in this range";
}
if (tabContent4.innerHTML === "") {
  tabContent4.innerHTML += "No parks found in this range";
}
}

const timeInput = document.getElementById("time-input");

function updateDropdownOptions(provider) {
  // Clear all options
  timeInput.innerHTML = '';

  // Helper function to create an option element with bold text
  function createOption(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    option.style.fontWeight = 'bold';
    return option;
  }

  // Add options based on the selected provider
  if (provider === 'traveltime') {
    // Add all options
    timeInput.appendChild(createOption(10, '10 min'));
    timeInput.appendChild(createOption(20, '20 min'));
    timeInput.appendChild(createOption(30, '30 min'));
    timeInput.appendChild(createOption(40, '40 min'));
    timeInput.appendChild(createOption(50, '50 min'));
    timeInput.appendChild(createOption(60, '1 hr'));
    timeInput.appendChild(createOption(80, '1 hr 20 mins'));
    timeInput.appendChild(createOption(90, '1 hr 30 mins'));
    timeInput.appendChild(createOption(100, '1 hr 40 mins'));
    timeInput.appendChild(createOption(110, '1 hr 50 mins'));
    timeInput.appendChild(createOption(120, '2 hrs'));
    timeInput.appendChild(createOption(140, '2 hrs 20 mins'));
    timeInput.appendChild(createOption(150, '2 hrs 30 mins'));
    timeInput.appendChild(createOption(160, '2 hrs 40 mins'));
    timeInput.appendChild(createOption(170, '2 hrs 50 mins'));
    timeInput.appendChild(createOption(180, '3 hrs'));
    timeInput.appendChild(createOption(200, '3 hrs 20 mins'));
    timeInput.appendChild(createOption(210, '3 hrs 30 mins'));
    timeInput.appendChild(createOption(220, '3 hrs 40 mins'));
    timeInput.appendChild(createOption(230, '3 hrs 50 mins'));
    timeInput.appendChild(createOption(240, '4 hrs'));
  } else if (provider === 'mapbox') {
    // Add the first 6 options
    timeInput.appendChild(createOption(10, '10 min'));
    timeInput.appendChild(createOption(20, '20 min'));
    timeInput.appendChild(createOption(30, '30 min'));
    timeInput.appendChild(createOption(40, '40 min'));
    timeInput.appendChild(createOption(50, '50 min'));
    timeInput.appendChild(createOption(60, '1 hr'));
  }
}

// Apply CSS style to the selected option
timeInput.addEventListener('change', function() {
  // Clear the bold style from all options
  const options = timeInput.getElementsByTagName('option');
  for (let i = 0; i < options.length; i++) {
    options[i].style.fontWeight = 'normal';
  }

  // Apply the bold style to the selected option
  const selectedOption = timeInput.options[timeInput.selectedIndex];
  selectedOption.style.fontWeight = 'bold';

  // Apply the bold style to the selected value in the accompanying box
  timeInput.style.fontWeight = 'bold';
});

const providerRadios = document.querySelectorAll('input[name="provider"]');
for (const radio of providerRadios) {
  radio.addEventListener('change', (event) => {
    updateDropdownOptions(event.target.value);
  });
}

// initialize the dropdown options based on the initial provider value
const initialProvider = document.querySelector('input[name="provider"]:checked').value;
updateDropdownOptions(initialProvider);
const quartiles = document.querySelectorAll("#quartiles .quartile");

window.addEventListener('load', function() {
  timeInput.value = '40';
});

const initialSelectedOption = timeInput.options[timeInput.selectedIndex];
initialSelectedOption.style.fontWeight = 'bold';

// Apply bold style to the selected value in the accompanying box on page load
timeInput.style.fontWeight = 'bold';

let maxTime = 40;
let quartileValues = [10,20,30];

timeInput.addEventListener("change", function() {
  maxTime = Number(this.value);
  quartileValues = calculateQuartiles(maxTime);
  updateTabNames();
  const roundedQuartiles = quartileValues.map(val => Math.round(val));
  travelTimes = roundedQuartiles.concat(maxTime);

  for (let i = 0; i < quartileValues.length; i++) {
    quartiles[i].innerHTML = "<b>" + formatTime(quartileValues[i]) + "</b>";
  }
});

function calculateQuartiles(maxTime) {
  const quartileValues = [];
  const range = maxTime;
  quartileValues.push(range * 0.25);
  quartileValues.push(range * 0.5);
  quartileValues.push(range * 0.75);
  return quartileValues;
}

function formatTime(minutes) {
  if (minutes < 60) {
    return minutes === 1 ? "1 min" : Math.round(minutes) + " mins";
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (mins === 60) {
      return (hours + 1) + " hr" + ((hours + 1) > 1 ? "s" : "");
    } else if (mins === 0) {
      return hours === 1 ? "1 hr" : hours + " hrs";
    } else {
      return hours + " hr" + (hours > 1 ? "s" : "") + " " + mins + " min" + (mins > 1 ? "s" : "");
    }
  }
}

// Get the input element
const departureInput = document.querySelector('#departure');

// Initialize the flatpickr date picker
flatpickr(departureInput, {
  enableTime: true,
  dateFormat: 'Y-m-d H:i',
  theme: 'material_blue',
  onClose: function(selectedDates, dateStr, instance) {
    var closeMapButton = document.querySelector('#closeMap');
    closeMapButton.click();
    departureTime = new Date(dateStr);
    if (isNaN(departureTime)){
      return
    } else {
    // Update the departureTime variable with the selected date and time
    pseudoTime = new Date(dateStr);
    var times = SunCalc.getTimes(departureTime, 47.22, -121.17);
    
    var sunrise = times.sunrise;
    var sunset = times.sunset;
    if (sunrise < departureTime && departureTime < sunset){
      map.removeLayer(dark);
      map.addLayer(light);
    }
    else {
        map.removeLayer(light);
        map.addLayer(dark);
    }
        var currentYear = pseudoTime.getFullYear();
        var nextYear = currentYear + 1;
        var currentDate = new Date(dateStr);
        var today = pseudoTime;
        var oneYearLater = today.setFullYear(today.getFullYear() + 1);
    testLayer.eachLayer(function(layer) {
      var feature = layer.feature;
      if (!feature.properties.Open_Date || feature.properties.Open_Date === null) {
        feature.properties.status = "open";
      } else { 
        let open = feature.properties.Open_Date;
        openSlice = open.slice(0, 2)+ open.slice(3);
        let close = feature.properties.Close_Date;
        closeSlice = close.slice(0, 2)+ close.slice(3);
      
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
      var times = SunCalc.getTimes(pseudoTime, 47.22, -121.17);
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
            var today2 = pseudoTime;
            var currentTime = today2.getHours()+""+(today2.getMinutes()<10?'0':'')+today2.getMinutes();
            if (currentTime <= closeTime && currentTime >= openTime) {
                feature.properties.status = "open";
            }   else {
                feature.properties.status = "closed";
            }
        }
      if (feature.properties.status === "open") {
      layer.bindPopup("<b>"+feature.properties.name+"</b>"+"<hr>"+"Open");
      layer.setStyle({fillOpacity: 0.1, fillColor: "#4da343", color: "#4da343"});
      }   else if (feature.properties.status = "closed") {
      layer.bindPopup("<b>"+feature.properties.name+"</b>"+"<hr>"+"Closed. The park will open again on "+feature.properties.Open_Date)
      layer.setStyle({fillOpacity: 0.1, fillColor: "#d13c21", color: "#d13c21"});
      }
    });
    }
  }
});

var isSidebarCollapsed = true;

    function toggleAboutContainer() {
      var sidebar = document.getElementById("sidebar");
      var contentContainer = document.getElementById("content-container");
      var caret = document.getElementById("collapseButton").querySelector(".fa-caret-up");
          
      if (!isSidebarCollapsed) {
        sidebar.style.width = "0";
        contentContainer.style.width = "100%";
        caret.style.transform = "rotate(90deg)";
        isSidebarCollapsed = true;

        var tabs = document.getElementsByClassName("tabs")[0];
        tabs.style.display = "none";
      } else {
        var viewportWidth = window.innerWidth || document.documentElement.clientWidth;

        var sidebar = document.getElementById("sidebar");
        var contentContainer = document.getElementById("content-container");
        if (viewportWidth <= 1200 && viewportWidth > 768) {
          sidebar.style.width = "40%";
          contentContainer.style.width = "60%";
        } else if (viewportWidth <= 768) {
          sidebar.style.width = "100%";
          contentContainer.style.width = "auto";
        } else {
          sidebar.style.width = "20%";
          contentContainer.style.width = "80%";
        };

        var tabs = document.getElementsByClassName("tabs")[0];
        tabs.style.display = "flex";
        var tab1 = document.querySelector('.tab:nth-child(1)');
        tab1.click();

        caret.style.transform = "rotate(270deg)";
        isSidebarCollapsed = false;
      }
      map.invalidateSize();
    }

    function updateTabNames() {
      var tabs = document.getElementsByClassName('tab');
      var selectedTab = document.querySelector('.tab.selected');
    
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].innerHTML = "";
    
        if (tabs[i] === selectedTab) {
          if (i < quartileValues.length) {
            tabs[i].innerHTML = "<b>Within " + formatTime(quartileValues[i]) + "</b>";
          } else if (i === tabs.length - 1) {
            tabs[i].innerHTML = "<b>Within " + formatTime(maxTime) + "</b>";
          }
        }
      }
    }
    
    var tabs = document.getElementsByClassName('tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function() {
        var selectedTab = document.querySelector('.tab.selected');
        if (selectedTab) {
          selectedTab.classList.remove('selected');
        }
        this.classList.add('selected');
        updateTabNames();
      });
    }

    function changeTab(tabIndex) {
      var tabs = document.getElementsByClassName('tab');
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('selected');
      }
    
      var selectedTab = document.getElementById('content' + tabIndex);
      var tabButton = document.querySelector('.tab:nth-child(' + tabIndex + ')');
      tabButton.classList.add('selected');
    
      var tabContents = document.getElementsByClassName('tab-content');
      for (var j = 0; j < tabContents.length; j++) {
        tabContents[j].style.display = 'none';
      }
    
      selectedTab.style.display = 'block';
    }
