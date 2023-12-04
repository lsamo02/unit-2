//declare map variable globally so all functions have access
var map;
var minValue;
var attributes;
var dataStats= {};

//step 1 create map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [43, -110],
        zoom: 3.5
    });

    //add OSM base tilelayer
    L.tileLayer.provider('Stadia.StamenTerrain').addTo(map);

    //call getData function
    getData(map);
};

function calculateMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each year
    for(var park of data.features){
        //loop through each year
        for(var year = 1960; year <= 2020; year+=10){
              //get population for current year
              var value = park.properties["Visitation_"+ String(year)];
              //add value to array
              if(value !== 0){
                allValues.push(value);
              }
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)

    console.log(minValue)
    return minValue;
    
}

function calcStats(data){
    console.log('check me', data); // Check if data is defined and has the correct structure

    //create empty array to store all data values
    var allValues = [];

    //loop through each park
    for(var park of data.features){
        console.log(park); // Check if park is defined and has the correct structure

        //loop through each year
        for(var year = 1960; year <= 2020; year+=10){
            //get population for current year
            var value = park.properties["Visitation_"+ String(year)];
            console.log(value); // Check if value is a number and not NaN

            if(value !== 0){
                allValues.push(value);
            }
        }
    }

    console.log(allValues); // Check if allValues is correctly populated

    //get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);

    //calculate meanValue
    var sum = allValues.reduce(function(a, b){return a+b;});
    dataStats.mean = sum/ allValues.length;

    console.log('datastats',dataStats); // Check if dataStats is correctly populated
}     


//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 1;
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};

//function to create pop u content
function createPopupContent (properties, attribute){
    var popupContent = "<p><b>Park Name:</b> " + properties["Park_Name"] + "</p>";

    //add formatted attribute to popup content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Visitation in " + year + ":</b> " + properties[attribute].toLocaleString("en-US");

    return popupContent;
};



//Add circle markers for point features to the map
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    console.log(attribute)

    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string w/ createPopupContent function
    var popupContent = createPopupContent (feature.properties, attribute);
    
    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {  offset: new L.Point(0,-options.radius)    });     

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Add circle markers for point features to the map
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
            
            container.innerHTML = '<p class="temporalLegend"><b>Visitation in <span class="year">1960</span></p>';
            
            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="200px" height="260px">';

            //array of circle names to base loop on
            var circles = ["max", "mean", "min"];

            console.log(circles); // Check the value of the circles array


            console.log(attributes); // Check the value of attributes array
            
        // Assuming attributes is an array of objects and 'value' is the property you're interested in
            var values = attributes.map(a => a.value); // Replace 'value' with your actual property name

            // Calculate max, mean, and min
            var max = Math.max(...values);
            var min = Math.min(...values);
            var mean = values.reduce((a, b) => a + b, 0) / values.length;

          

            // Now your loop
            for (var i=0; i < circles.length; i++){
        
                //Step 3: assign the r and cy attributes            
                var radius = calcPropRadius(dataStats[circles[i]]);           
                var cy = 59 - radius;    
            
                //circle string            
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="65"/>';

                var cx = 320 / 2; // Half of the new width
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="' + cx + '"/>';
                
                //evenly space out labels            
                var textY = i * 20 + 20;            

                //text string            
                svg += '<text id="' + circles[i] + '-text" x="65" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " million" + '</text>';
                
            };
    
            //close svg string
            svg += "</svg>";
    
            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend',svg);

            console.log(dataStats); // Check if dataStats is defined and has the correct structure
            console.log(circles[i]); // Check the value of circles[i]
            console.log(dataStats[circles[i]]); // Check the value of dataStats[circles[i]]
            console.log(calcPropRadius(dataStats[circles[i]])); // Check the return value of calcPropRadius function
            
            return container;
        }
    });

    map.addControl(new LegendControl());
};

//Step 1: Create new sequence controls
function createSequenceControls(attributes){

    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/reverse_icon.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward_icon.png"></button>');

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl()); 
    

    //set slider attributes
    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;


    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //Step 6: get the new index value
        var index = this.value;
        console.log(index)
        console.log(attributes[index])
        updatePropSymbols(attributes[index]);
    });

    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;

            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 6 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 6 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider').value = index;  
            console.log(attributes[index]);

            updatePropSymbols(attributes[index]); 
          
        })
        return attributes;


    })

};


//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    var year = attribute.split("_")[1];
    //update temporal legend
    document.querySelector("span.year").innerHTML = year;

    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add popup content string
            var popupContent = createPopupContent (props, attribute);

            //update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();

        };
          
    });
};

//Above Example 3.10...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Visitation") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};

//Import GeoJSON data
function getData(map){
    //load the data
    fetch("data/ParkVisitation.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processData(json); 
            calcStats(json); // Call calcStats here
            minValue = calculateMinValue(json);
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
            console.log(attributes);
            createLegend(attributes);

    
        })
       
};

document.addEventListener('DOMContentLoaded',createMap)