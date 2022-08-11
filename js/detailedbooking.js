"use strict"

let mapMarkers = []; // Holds Markers

// Plot creating function
function createNewMarker(coordinatePair, addressArray) {
    if (coordinatePair.length != 2) {
        return false;
    }
    let markerId = mapMarkers.length; // The newest marker

    // Creating a custom element to house the point number
    let markerElement = document.createElement('div')
    markerElement.className = "custom-marker";
    markerElement.id = `mapMarker-${markerId}`;
    markerElement.innerText = `${markerId + 1}`;

    // Create the marker
    let marker = new mapboxgl.Marker({
        element: markerElement,
        draggable: false
    })
        .setLngLat(coordinatePair)
        .addTo(map)

    mapMarkers.push({
        markerId: markerId,
        marker: marker,
        //isSet: false, // Not needed here
        locationData: {
            part1: addressArray[0],
            part2: addressArray[1]
        }
    });
    updatePointsList();
    return marker;
}

// Mapbox direction API
let request = new XMLHttpRequest();
function handleMapboxDirectionsRQST(coordinates) {
    if (coordinates.length < 2) {
        return false;
    }
    let url = "https://api.mapbox.com/directions/v5/mapbox/driving/";
    let coordComponent = "";
    coordinates.forEach((element, index) => {
        coordComponent += element.join(",");
        if (index != coordinates.length - 1)
            coordComponent += ";"
    });
    coordComponent = encodeURIComponent(coordComponent);
    url += coordComponent;
    url += "?alternatives=false&geometries=geojson&steps=false&access_token=pk.eyJ1IjoiZ3JvdXAwMzMiLCJhIjoiY2ttdmd2dXJsMDUxbDJwbWtzd2JzaGQ2MSJ9.7Q1Z7XBU1PSebyo5S3HSuA";

    // Prepare the HTTP request using XMLHttpRequest
    request.open('GET', url, true);
    // WIll run when request returns
    request.onload = function () {
        if (this.status >= 200 && this.status < 400) {
            // retrieve the JSON from the response
            let json = JSON.parse(this.response);
            // Our data goes here
            // console.log(json);
            let geoJsonData = json.routes[0].geometry.coordinates;
            // Updates the route line
            map.getSource("directionRoute").setData({
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': geoJsonData
                }
            });
        }
    }
    request.send();
};

// Point updating function
function updatePointsList() {
    let pointsListRef = document.getElementById("pointsList");
    let output = "";
    // If there is no points, display "No points"
    if (mapMarkers.length == 0) {
        pointsListRef.innerHTML = `<h3 id="noPoints">No Points</h3>`;
        return;
    }
    // Else if there are points, display them
    mapMarkers.forEach((element, index) => {
        let markerLocation = element.locationData;
        output += mapObjectCreator(index, [markerLocation.part1, markerLocation.part2]);
    });
    pointsListRef.innerHTML = output;
}

/*
--Method--
Function Input:
    markerID,addressArray
Function Output:
    Displays address for user
Function Description:
    Function is responsible for displaying address for user by updating the HTML
*/

function mapObjectCreator(markerId, addressArray) {
    let icon = "multiple_stop";
    let addressesToDisplay = addressArray;
    if (markerId == mapMarkers.length - 1) {
        icon = "flag";
    }
    if (markerId == 0) {
        icon = "trip_origin";
    }
    return `<li class="mdl-list__item mdl-list__item--two-line">
        <span class="mdl-list__item-primary-content" style="display: flex;">
            <i class="material-icons mdl-list__item-icon large-icons">${icon}</i>
            <div style="flex-grow: 0.3;"></div>
            <div>
                <span>${addressesToDisplay[0]}</span>
                <span class="mdl-list__item-sub-title">${addressesToDisplay[1]}</span>
            </div>
        </span>
        <span class="mdl-list__item-secondary-content mdl-list__item-secondary-content-center">
            <span class="mdl-list__item-secondary-info">Go</span>
            <a class="mdl-list__item-secondary-action flyToPoint" onclick="flyToPoint(${markerId})"><i class="material-icons"
                style="color: gray;">center_focus_strong</i></a>
        </span>
    </li>`;
}
/*
--Method--
Function Input:
    markerID
Function Output:
    Zoomed view of point on Map
Function Description:
    This function on click by user, zooms to the point selected on map
*/

// Map Fly to point function
function flyToPoint(markerId) {
    let mapMarker = mapMarkers[markerId].marker;
    map.flyTo({
        center: [mapMarker.getLngLat().lng, mapMarker.getLngLat().lat],
        zoom: 17
    })
}

let thisBooking;
let avgLon = 0;
let avgLat = 0;
let thisBookingID;
if (checkForStoredData(CURRENT_BOOKING_KEY)) { // Check to see if data already exists in local storage
    // -- If data already exists --
    thisBookingID = getData(CURRENT_BOOKING_KEY);

    thisBooking = bookingList.getBooking(thisBookingID);
    let coordsT = [];
    thisBooking.bookingPoints.forEach(element => {
        coordsT.push([element.lon, element.lat]);
    });
    coordsT.forEach(element => {
        avgLon += element[0];
        avgLat += element[1];
    });
    avgLon = avgLon / coordsT.length;
    avgLat = avgLat / coordsT.length;

    // -- Set the booking time on the page --
    // Create reference variables to elements on the page
    let tripDetailDateRef = document.getElementById("td-date");
    let tripDetailTimeRef = document.getElementById("td-time");
    let tripDetailEtaRef = document.getElementById("td-eta");
    let tripDetailVehicleRef = document.getElementById("td-vehicle");
    let tripDetailRegoRef = document.getElementById("td-rego");
    let fareDetailTotalRef = document.getElementById("fd-total");
    // Get crucial information from the booking
    let bookingTime = new Date(thisBooking.bookingTime);
    let bookingCost = thisBooking.tripCost;
    let bookingDuration = thisBooking.tripDuration;
    let bookingDistance = thisBooking.tripDistance;
    // Display the cost
    bookingCost = "$" + bookingCost.toFixed(2);
    fareDetailTotalRef.innerText = bookingCost;
    // Display booking date
    tripDetailDateRef.innerText = bookingTime.toDateString();
    // Display booking time and ETA
    let timeString = bookingTime.toTimeString();
    let etaTimeString = new Date()
    let duration = bookingDuration * 1000;
    etaTimeString.setTime(bookingTime.valueOf() + duration);
    timeString = timeString.split(" GMT")[0];
    etaTimeString = etaTimeString.toTimeString().split(" GMT")[0];
    tripDetailTimeRef.innerText = timeString;
    tripDetailEtaRef.innerText = etaTimeString;
    // Display vehicle information
    tripDetailRegoRef.innerText = thisBooking.assignedTaxi;
    let capitalisedVehicle = `${getTaxiByRego(thisBooking.assignedTaxi)}`;
    capitalisedVehicle = capitalisedVehicle.charAt(0).toUpperCase() + capitalisedVehicle.slice(1);
    tripDetailVehicleRef.innerText = capitalisedVehicle;
    tripCost(getTaxiByRego(thisBooking.assignedTaxi), bookingTime.getHours()+1, bookingDistance);
}

function tripCost(vehicle, time, distance) {
    let fareDetailDistanceRef = document.getElementById("fd-distance");
    let fareDetailNightRef = document.getElementById("fd-night");
    let fareDetailAVLRef = document.getElementById("fd-avl");
    let distanceBasedRate = 1.622;
    let additionalLevyVType = {
        "sedan": 0,
        "suv": 3.5,
        "van": 6,
        "minibus": 10
    }
    let distanceCost = (distance/1000) * distanceBasedRate;
    distanceCost = "$" + distanceCost.toFixed(2);
    fareDetailDistanceRef.innerText = distanceCost;
    let additionalVTypeCost = additionalLevyVType[vehicle];
    let costAVT = "$" + additionalVTypeCost.toFixed(2);
    fareDetailAVLRef.innerText = costAVT;
    if (time >= 17 || time <= 9) {
        fareDetailNightRef.innerText = "x 1.2";
    } else {
        fareDetailNightRef.innerText = "None"
    }
}

// ---------------------
//  MAPBOX MAP CREATION 
// ---------------------
mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JvdXAwMzMiLCJhIjoiY2ttdmd2dXJsMDUxbDJwbWtzd2JzaGQ2MSJ9.7Q1Z7XBU1PSebyo5S3HSuA';
let map = new mapboxgl.Map({
    container: 'map-content',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [avgLon, avgLat], // starting position
    zoom: 10, // starting zoom
    maxBounds: [
        [140.98172985945615, -39.114684159633455],
        [150.15301996882192, -34.02682894890615]
    ]
});
map.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    }).on('geolocate', function () {
        try {
            document.getElementsByClassName("mapboxgl-user-location-dot")[0].style.pointerEvents = "none";
            document.getElementsByClassName("mapboxgl-user-location-accuracy-circle")[0].style.pointerEvents = "none";
        } catch (error) {
            console.error("Error: Failed to set location indicator pointer events to none")
        }
    }));
map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {
    map.addSource('directionRoute', {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'LineString',
                'coordinates': []
            }
        }
    });
    map.addLayer({
        'id': 'directionRoute',
        'type': 'line',
        'source': 'directionRoute',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#06048f', // Blue
            'line-width': 8
        }
    });
    // -- Load booking once map loads --
    // Get all of the points from the booking class
    // Retrieval of booking from LS
    if (checkForStoredData(CURRENT_BOOKING_KEY)) { // Check to see if data already exists in local storage
        // -- If data already exists --
        let thisBookingID = getData(CURRENT_BOOKING_KEY);

        /*let */thisBooking = bookingList.getBooking(thisBookingID);
        thisBooking.bookingPoints.forEach(element => {
            let lat = element.lat;
            let lon = element.lon;
            let addressArray = [element.address[0], element.address[1]];
            createNewMarker([lon, lat], addressArray);
        });
        let coordsT = [];
        thisBooking.bookingPoints.forEach(element => {
            coordsT.push([element.lon, element.lat]);
        });
        coordsT.forEach(element => {
            avgLon += element[0];
            avgLat += element[1];
        });
        // Update points list
        updatePointsList();
        handleMapboxDirectionsRQST(coordsT);
    } else {
        alert("Default Page Loaded\nNo booking is set to be displayed!!");
    }
});

// Adds an event listener to the radio buttons for enforcing
// The 8 point limit
document.getElementsByName("vehicle-options").forEach(element => {
	if (element.value != "minibus") {
        element.addEventListener('change', function() {
            let regoNew = getTaxiByType(element.value);
            thisBooking.assignedTaxi = regoNew;
            bookingList.getBooking(thisBookingID).assignedTaxi = thisBooking;
            window.location.href = "detailedBooking.html";
        });
    } else {
        element.addEventListener('change', function() {
            let regoNew = getTaxiByType("minibus");
            thisBooking.assignedTaxi = regoNew;
            bookingList.getBooking(thisBookingID).assignedTaxi = thisBooking;
            window.location.href = "detailedBooking.html";
        });
    }
})


// Creating Cancellation Dialog
function cancelBooking() {
    if (!confirm("Are you sure you want to cancel your booking?")) {
        return false;
    }
    bookingList.removeBooking(thisBookingID);
    storeData(BOOKING_STORAGE_KEY, bookingList)  // Store the new session in localStorage
    window.location.href = "index.html"
};

// Change Vehicle Dialog

let changeVehButtonRef = document.getElementById('changeVehButton');
let changeVehDialogRef = document.getElementById('changeVehdialog');
let changeVehDialogCancelRef = document.getElementById('changeVehDialogCancel');
let updateVehButtonRef = document.getElementById('updateVehBt');

changeVehButtonRef.addEventListener('click', function onOpen() {
    if (typeof changeVehDialogRef.showModal === "function") {
        changeVehDialogRef.showModal();
    } else {
        alert("The <dialog> API is not supported by this browser");
    }
});

changeVehDialogCancelRef.addEventListener('click', function () {
    changeVehDialogRef.close();
   
});

updateVehButtonRef.addEventListener('click', function () {
    if (!confirm("Do you want to update the vehicle?")) {
        changeVehDialogRef.close();
        return false;
        
    }
    let currentBookingIndex = bookingList.bookingList.length - 1;
    storeData(CURRENT_BOOKING_KEY,currentBookingIndex);
    changeVehDialogRef.close();
    
    
});
