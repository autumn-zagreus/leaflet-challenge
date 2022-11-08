// create tile layers for background
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
  ext: 'png'
});

// water color layer
var watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
});

var topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make a map object
var myMap = L.map("map", {
  center: [36.7783, -119.4179],
  zoom: 3,
  layers: [defaultMap, grayscale, watercolor, topoMap]
});

// make basemaps object
let basemaps = {
  Default: defaultMap,
  Grayscale: grayscale,
  Watercolor: watercolor,
  Topographical: topoMap
};

// add the default map to the map
defaultMap.addTo(myMap);
// grayscale.addTo(myMap);

// get the data for the tectonic plates and draw on the map
// variable to hold the tectonic plates layer
let tectonicplates = new L.layerGroup();

// call the api to get the info for the tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
  .then(function(plateData){
    // load data using geoJson and add to the tectonic plates layer group
    L.geoJson(plateData, {
        // add styling to make the lines visible
        color: "blue",
        weight: 1
    }).addTo(tectonicplates);
  });

  // add the tectonic plates to the map
  tectonicplates.addTo(myMap);

  // create the info for the overlay for the earthquakes
  // variable to hold the earthquake data layer
  let earthquakes = new L.layerGroup();

  // get the data for the earthquakes and populate the layer group
  // call the USGS GeoJson API
  d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
  .then(
    // function to return color dependent on depth
    function(earthquakeData){
      function dataColor(depth){
        if (depth > 90)
          return "red";
        else if (depth > 70)
          return "#fc4903"
        else if (depth > 50)
          return "#fc8403"
        else if (depth > 30)
          return "#fcad03"
        else if (depth > 10)
          return "#cafc03"
        else
          return "green"
      }

      // function to return the size of radius dependent on magnitude
      function radiusSize(mag){
        if (mag == 0)
          return 1; // makes sure that a 0 mag earthquake shows up
        else
          return mag * 3; // makes sure that the circle is pronounced in the map
      }

      // add on to the style for each data point
      function dataStyle(feature){
        return {
          stroke: 1,
          opacity: 0.6,
          fillOpacity: 0.6,
          fillColor: dataColor(feature.geometry.coordinates[1]), // use index 2 for depth
          color: "000000", // black outline
          radius: radiusSize(feature.properties.mag), // gets mag
          weight: 0.5
        }
      }

      // add the GEOJson Data to the earthquake layergroup
      L.geoJson(earthquakeData, {
          // make each feature a marker that is on the map, each marker is a circle
          pointToLayer: function(feature, latLng) {
            return L.circleMarker(latLng);
          },
          // set the style for each marker
          style: dataStyle, // calls the data style function and passes in the earthquake data to make a circle
          // add the pop ups
          onEachFeature: function(feature, layer){
            layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                            Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                            Location: <b>${feature.properties.place}</b></br>`);
          }
      }).addTo(earthquakes)
    }
  );
  // add the earthquake layer to the map
  earthquakes.addTo(myMap)

  // add the overlay for the tectonic plates and the earthquakes
  let overlays = {
    TectonicPlates: tectonicplates,
    EarthquakeData: earthquakes
  }

// add layer control
L.control
.layers(basemaps, overlays)
.addTo(myMap);

// add the legend overlay to the map
let legend = L.control({
  position: "bottomright"
});

// add properties for the legend (same colors as dataColor)
legend.onAdd = function() {
  // div for the legend to appear in the page
  let div = L.DomUtil.create("div", "info legend");

  // set up the intervals
  let intervals = [-10, 10, 30, 50, 70, 90];
  // set the colors for the intervals
  let colors = [
    "green",
    "#cafc03",
    "#fcad03",
    "#fc8403",
    "#fc4903",
    "red"
  ];

  // loop through intervals and colors and generate the label with a colored square for each interval
  for(var i = 0; i< intervals.length; i++)
  {
    // inner html that sets the square for each interval and label
    div.innerHTML += "<i style=background: "
      + colors[i]
      + "></i> "
      + intervals[i]
      + (intervals[i + 1] ? "&ndash km;" + intervals[i + 1] + "km<br>" : "+");
  }

  return div;
};

// add legend to the map
legend.addTo(myMap);