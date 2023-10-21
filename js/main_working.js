//declare map variable globally so all functions have access
var map;
var minValue;

var attributes;

//step 1 create map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [43, -110],
        zoom: 4
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


//Step 1: Create new sequence controls
function createSequenceControls(attributes){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    //set slider attributes
    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    //add step buttons
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse"></button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward"></button>');

    //replace button content with images
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse_icon.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward_icon.png'>")

    //Step 5: click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            //sequence
        })
    });

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


    })

};



//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //update the layer style and popup
                    //Example 3.18 line 4
            if (layer.feature && layer.feature.properties[attribute]){
                //access feature properties
                var props = layer.feature.properties;

                //update each feature's radius based on new attribute values
                var radius = calcPropRadius(props[attribute]);
                layer.setRadius(radius);

                //add city to popup content string
                var popupContent = createPopupContent (props, attribute);

                //update popup content            
                popup = layer.getPopup();            
                popup.setContent(popupContent).update();
            };
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
            minValue = calculateMinValue(json);
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        })
};

document.addEventListener('DOMContentLoaded',createMap)