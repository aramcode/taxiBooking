"use strict"
/*  --- MAIN PAGE PSEUDOCODE ---
    -- High Level (making a booking) --
    1. Show a new map with the user's location as a location marker (not route point)
        1a. If the user doesn't give their location it centers Melbourne CBD
    2. The user enters the pickup time for the trip
    3. When user clicks on "Add a stop" a new point is generated in the center of the screen
    4. The user can choose/change the location of the point
        4a. The point can be dragged to a new location
        4b. The user can enter a specific address for the point
    5. The user clicks a "Confirm" on the stop popup to confirm the location of the stop
    6. When user clicks on "Remove" on the stop popup to remove the stop
        6a. The polyline updates accordingly
    7. A polyline is created between the route points (for 2+ points)
    * Note steps 3 through 7 occur for as many points as are nessesary
    8. The user picks the vehicle for the trip
    9. The trip cost and ETA is calculated and shown to the user
    10. The user clicks "Confirm Booking" and shown a confirmation screen with trip summary
    11. Once the user is happy with the booking, they click "Confirm" and the booking is saved
        11a. If they choose not to confirm they are redirected to the main page

-- Low Level (making a booking) --
    Stage 1 (Creating the map)
        1. Get the user's location (if permitted)
        2. Create a new map instance
            2a. Center the map on the user's location (if not given, centre on Melb CBD)
            2b. Create a marker with the user's location (if given)
    Stage 2 (setting a time)
        1. On page load auto set the pickup time field to empty
        2. Get the input from the time field and verify that it is valid
        3. Change the Booking instance to store the inputted time in the bookingTime attribute
    Stage 3 (Adding a stop)
        "When the user clicks on add stop"
        1. Get the coordinates of the map's centre
        2. Create a new marker instance at the location of the map's centre
         Create a new Route instance that contains the points of the route within the current Trip instance
    Stage 4 (Moving a stop)
        1-Pre. The entered address is converted to coordinates using the Geocoding API
        2-Pre. The marker is updated and snaps to the coordinates 
         - "User drags marker (after they drop it)" -
        3. Store the coordinates of the new marker
        4. Updates the relevant Route Instance
    Stage 5 (Confirming a stop)
        1. The user clicks the confirm button on the marker popup
        2. The button is disabled and the text is changed to "Confirmed"
        3. The stop is marked as confirmed in the Route instance
    Stage 6 (Removing a stop)
        1. The user clicks the delete button on the marker popup
        2. The user is prompted if they want to confirm the deletion
        3. If the user confirms, the Route instance is deleted from the current Trip instance
    Stage 7 (Creating a polyline to show route)
        1a. Create a polyline (straight line) instance with each of the points as coordinates
        1b. Display the polyline on the map
        -- Once all points are confirmed --
        2a. Generate a new MapBox directions Instance
        2b. Supply the instance with the coordinates of the route
        2c. Plot the line on the map
    Stage 8 (picking the vehicle)
        1. On page load auto select the "Sedan" vehicle and create a new vehicle instance
        2. Get the currently selected vehicle on the booking page
        3. Change the Vehicle instance attached to the booking in accordance with the selected vehicle
         -> Change the vehicleType attribute in the Vehicle instance
    Stage 9 (Trip Cost and Trip ETA)
        1. Parse the route to the MAPBOX Directions API and retrieve the trip duration and distance
        2. Use the distance to calculate the travel portion of the fare
        3. Check for any other nessesary surcharges (vehicle, nighttime surcharge)
        4. Update the page to show the total cost as well as the fare breakdown
        5. Show the estimated trip duration as well as the ETA from trip start
    Stage 10 (Clicking Confirm Booking, and confirmation popup)
        1. When the user clicks the "Confirm Booking Button" create a new dialouge box (using MDN)
        2. Get all the trip information and prefill the popup with the trip details
            2a. Using the methods described above for trip time, trip cost, etc.
        3. Create two options on the popup for "Confirm" or "Go Back"
    Stage 11 (Confirming the booking and saving it to local storage)
        1a. If the user clicks "Confirm", save the booking in local storage and redirect them to the detailed booking page showing the new booking
        1b. If the user clicks "Go Back", the dialouge box is closed (taking them to the main page)
*/

/*
--Method--

Function Input:
    ScrollDirection - Scroll Buttons present in index.html for navigation of menu
Function Output:
    None
Function Description:
    Upon clicking of the scoll direction buttons, the navigation menu will move 
    across the page for user to select date,time and vehicle
*/

let bookingSummaryTimeRef = document.getElementById("bs-eta");

// Disable button while the map loads
document.getElementById("addPointButton").disabled = true;

// Set booking sumary info to defults
bookingSummaryTimeRef.innerHTML = "<i>Confirm all points for a duration</i>";
document.getElementById("bs-fareTotal").innerHTML = "<i>Confirm all points for trip cost</i>"

// Scrolling menu
let currentPage = 0; // Initialise the menu at the first page
function scrollTripMenu(scrollDirection) {
    const MIN_PAGE = 0;
    const MENU_PAGES = 2; // The number of pages in the menu (less 1)
    let forwardButtonRef = document.getElementById("forward-scroll-button");
    let backwardButtonRef = document.getElementById("backward-scroll-button");
    let stageIconsRef = document.getElementById("stageMarkerHolder").children;
    if (scrollDirection != "backward" && scrollDirection != "forward") {
        return false;
    }
    if (scrollDirection == "forward") {
        if (currentPage < MENU_PAGES) {
            currentPage++;
        } else {
            return false;
        }
    } else {
        if (currentPage > MIN_PAGE) {
            currentPage--;
        } else {
            return false;
        }
    }
    if (currentPage == MENU_PAGES) {
        forwardButtonRef.hidden = true;
    } else {
        forwardButtonRef.hidden = false;
    }
    if (currentPage == MIN_PAGE) {
        backwardButtonRef.hidden = true;
    } else {
        backwardButtonRef.hidden = false;
    }
    document.documentElement.style.setProperty("--booking-menu-index", currentPage);
    for (let index = 1; index <= MENU_PAGES; index++) {
        let currentStatusIcon = stageIconsRef[index];
        if (index <= currentPage) {
            currentStatusIcon.setAttribute("active", true);
        } else {
            currentStatusIcon.setAttribute("active", false);
        }
    }
}


/*
--Method--

Function Input:
    None    
Function Output:
    Return Minimum date which is current date - 1
Function Description:
    Function retirives current date and sets the minimum date for user to select vehicle, to be the previous date
*/
function setMinDate() {
    let date = new Date();
    let monthValue = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
    let dateValue = (date.getDate() < 10 ? '0' : '') + date.getDate();
    let yearValue = date.getFullYear();
    let minDateData = `${yearValue}-${monthValue}-${dateValue}`;
    let dateData = document.getElementById("tripDate");
    dateData.min = minDateData;
    return minDateData;
}

/*
--Method--

Function Input:
    None
Function Output:
    Returns date
Function Description:
    Function gets user input date and return it as an array of Number
*/

// Get user input date
function getDate() {
    let dateData = document.getElementById("tripDate");
    let dateValue = dateData.value;
    let splittedDate = [];
    dateValue.split("-").forEach(element => {
        splittedDate.push(Number(element));
    });
    return splittedDate;
}

/*
--Method--

Function Input:
    None
Function Output:
    Returns time
Function Description:
    Function gets user input inout and returns it as an array of Number
  
*/

// Get Time
function getTime() {
    let userTime = document.getElementById("tripTime");
    let timeValue = userTime.value;
    let splittedTime = [];
    timeValue.split(":").forEach(element => {
        splittedTime.push(Number(element));
    });
    return splittedTime;
}

/*
--Method--

Function Input:
    None    
Function Output:
    Return Minimum time which is current time + 10 mins
Function Description:
    Function retirives current time and sets the minimum time for user to select as 10 mins in advance
  
*/

// Create min time
let userInputTime = document.getElementById("tripTime");
let userInputDate = document.getElementById("tripDate");
let minimumBookingTime = 0;

function setMinTime() {
    let minTimeValue = document.getElementById('tripTime');
    if (!verifyTime()) {
        let currentTime = new Date();
        let minToAdd = 10;
        let futureTime = new Date(currentTime.getTime() + minToAdd * 60000);
        let futureHour = (futureTime.getHours() < 10 ? '0' : '') + futureTime.getHours();
        let futureMin = (futureTime.getMinutes() < 10 ? '0' : '') + futureTime.getMinutes();
        minimumBookingTime = futureHour + ":" + futureMin;
        minTimeValue.min = minimumBookingTime;
        let currentInputtedTime = document.getElementById('tripTime').value.split(":");
        if (Number(currentInputtedTime[0]) < Number(futureHour) || (Number(currentInputtedTime[0]) <= Number(futureHour) && Number(currentInputtedTime[1]) < Number(futureMin))) {
            document.getElementById('tripTime').parentElement.classList.add("is-invalid");
            document.getElementById('stageMarkerHolder').children[0].setAttribute("invalid", "true")
        } else {
            document.getElementById('stageMarkerHolder').children[0].setAttribute("invalid", "false")
        }
        return true;
    }
    minTimeValue.min = "";
    document.getElementById('stageMarkerHolder').children[0].setAttribute("invalid", "false")
    return false;
}

/*
--Method--

Function Input:
    None
Function Output:
    Returns Boolean 
Function Description:
    Function checks if minimum date is set to be the actualmin date 
*/


function verifyTime() {
    let functionData = setMinDate();
    if (userInputDate.value == functionData) {
        return false;
    }
    return true;
}

/*
Description:
    Allows updates using eventListener for user input of time and date
*/

let minTimeUpdater = setInterval(() => { setMinTime() }, 60000);
userInputDate.addEventListener('change', (event) => {
    setMinTime();
    // Booking Summary Page

    let dateToDisplay = userInputDate.value;
    let bsdate = document.getElementById('bs-date')
    bsdate.innerText = dateToDisplay;

    // Dialog Box 

    let dbdate = document.getElementById('db-date')
    dbdate.innerText = dateToDisplay;

});

/*
Description:
    Allows updates using eventListener for user input of time and date in dialog box 
*/

userInputTime.addEventListener('change', (event) => {
    setMinTime();

    // Booking Summary Page

    let timeToDisplay = userInputTime.value;
    let bstime = document.getElementById('bs-time')
    bstime.innerText = timeToDisplay;

    // Dialog Box 

    let dbtime = document.getElementById('db-time')
    dbtime.innerText = timeToDisplay;
    
    // Estimated Time

    let etaTimeRef = document.getElementById('bs-eta-time')
    let etaTimeString = new Date()
    etaTimeString.setTime(convertTime() + tripDuration * 1000);
    etaTimeString = etaTimeString.toTimeString().split(" GMT")[0];
    etaTimeRef.innerText = etaTimeString;
    
    // Cost 

    let bookingSummaryTripFare = document.getElementById("bs-fareTotal").innerText;

});

/*
--Method--

Function Input:
    None
Function Output:
    User Input Veh
Function Description:
    Checks for user input vehicle and return it
*/

// Get user vehicle input
let vehType = document.getElementsByName('vehicle-options');
let vehToPrint = document.getElementById('bookingSummaryVeh');
let vehToPrintDetailPage = document.getElementById('bookingDetailVeh');
function getVehicleType() {
    for (let i = 0; i < vehType.length; i++) {
        if (vehType[i].checked) {
            let userVeh = vehType[i].value;
            return userVeh;
        }
    }

}

/*
Description:
    Allows updates using eventListener for user input in dialog box 
    and opens and closes it accordingly
*/


// Creating Dialog
// "Update details" button opens the <dialog> modally
let confirmButton = document.getElementById('confirmBooking');
let dialogId = document.getElementById('confirmationDialog');
let confirmBtn = document.getElementById('confirmBtn');
let cancelBtn = document.getElementById('cancelButton');

confirmButton.addEventListener('click', function onOpen() {
    if (typeof confirmationDialog.showModal === "function") {
        dialogId.showModal();
    } else {
        alert("The <dialog> API is not supported by this browser");
    }
});

/* 
Description:
    Upon clicking confirm, data gets stored
*/

confirmBtn.addEventListener('click', function () {
    createBooking();

    let currentBookingIndex = bookingList.bookingList.length - 1;
    storeData(CURRENT_BOOKING_KEY, currentBookingIndex);

    window.location.href = "detailedBooking.html"
});



// Cancel button closes the dialog box using eventListener
cancelBtn.addEventListener('click', function () {
    dialogId.close();
    window.location.href = "index.html"
});

// "Confirm" button of form triggers "close" on dialog because of [method="dialog"]
dialogId.addEventListener('close', function onClose() {
});


/*
--Method--

Function Input:
    MarkerID
Function Output:
    Updates marker ID for chosen ID
Function Description:
    To find a marker on the map
*/


let mapMarkers = []; // Holds Markers

function findMarkerIndex(markerId) {
    let index = mapMarkers.findIndex((element) =>
        element.markerId == markerId
    )
    if (index == -1) {
        console.error(`Error: Could not find specified marker at id ${markerId}`);
        return false;
    }
    return index;
}

/*
--Method--

Function Input:
    Coordinate Pairs
Function Output:
    Updates Points List and returns marker value
Function Description:
    Function gets coordinate pair and checks if its of value 2 and then in the HTML it creates
    a button ID for each address that it gets from the coordinates which are the stops and create 
    a object for those as marker
*/


// to create a marker on the map for a new point
function createNewMarker(coordinatePair) {
    if (coordinatePair.length != 2) {
        return false;
    }
    let markerId = mapMarkers.length; // The newest marker
    let popup = new mapboxgl.Popup({
        offset: 45,
        closeOnClick: true,
        closeOnMove: true
    }).setHTML(`<button markerId="${markerId}" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="confirmMarker(Number(this.getAttribute('markerId')),true)">Confirm</button>
    <br><button markerId="${markerId}" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored mdl-color--red-600" onclick="markerDeleteButtonClick(Number(this.getAttribute('markerId')))">Delete</button>`);

    // Creating a custom element to house the point number
    let markerElement = document.createElement('div')
    markerElement.className = "custom-marker";
    markerElement.id = `mapMarker-${markerId}`;
    markerElement.innerText = `${markerId + 1}`;

    // Create the marker
    let marker = new mapboxgl.Marker({
        element: markerElement,
        draggable: true
    })
        .setLngLat(coordinatePair)
        .setPopup(popup)
        .addTo(map)
        .on('dragstart', () => {
            let markerId = marker.getPopup()
                ._content
                .getElementsByClassName("mdl-button")[0]
                .getAttribute("markerId");
            confirmMarker(markerId, false);
        })
        .on('drag', () => {
            let markerId = marker.getPopup()
                ._content
                .getElementsByClassName("mdl-button")[0]
                .getAttribute("markerId");
            let coordinates = map.getSource("route")._data.geometry.coordinates;
            coordinates[markerId][0] = marker.getLngLat().lng;
            coordinates[markerId][1] = marker.getLngLat().lat;
            map.getSource("route").setData({
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coordinates
                }
            });
            map.setLayoutProperty("directionRoute", "visibility", "none");
            map.setLayoutProperty("route", "visibility", "visible")
        });
    let coordinates = map.getSource("route")._data.geometry.coordinates;
    coordinates.push([marker.getLngLat().lng, marker.getLngLat().lat]);
    map.getSource("route").setData({
        'type': 'Feature',
        'properties': {},
        'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
        }
    });
    map.setLayoutProperty("directionRoute", "visibility", "none");
    map.setLayoutProperty("route", "visibility", "visible")

    mapMarkers.push({
        markerId: markerId,
        marker: marker,
        isSet: false,
        locationData: {
            part1: undefined,
            part2: undefined
        }
    });
    updatePointsList();
    return marker;
}

/*
--Method--
Function Input:
    markerID and coordinate Pair
Function Output:
    Boolean Value if value more than 2
Function Description:
    Function helps in setting movement of marker ID accordingly to the coordinates given in the map

*/

// this function is not used in the html
function moveMarker(markerId, coordinatePair) {
    if (coordinatePair.length != 2) {
        console.error(`Error: moveMarker expects 2 coordinates but got ${coordinatePair.length}`);
        return false;
    }
    let index = mapMarkers.findIndex((element) =>
        element.markerId == markerId
    )
    if (index == -1) {
        console.error(`Error: Could not find specified marker at id ${markerId}`);
        return false;
    }
    mapMarkers[index].marker.setLngLat(coordinatePair);
    return true;
}

/*
--Method--
Function Input:
    marker ID
Function Output:
    Returns boolean value for input markerID    
Function Description:
    Deletes the given markerID and relocated the number ID of the other markers accordingly
*/
//lets user delete a specific marker on the route

function deleteMarker(markerId) {
    let index = findMarkerIndex(markerId);
    if (index === false) {
        return false;
    }
    mapMarkers[index].marker.remove();
    mapMarkers.splice(index, 1);
    mapMarkers.forEach((element, index) => {
        element.markerId = index
        element.marker.getPopup()._content
            .getElementsByClassName("mdl-button")[0]
            .setAttribute("markerId", index);
        element.marker.getPopup()._content
            .getElementsByClassName("mdl-button")[1]
            .setAttribute("markerId", index);
        element.marker.getElement().innerText = index + 1;
        if (getVehicleType() != "minibus" && index > 4) {
            element.marker.getElement().innerText = "!";
        }
    })
    let coordinates = map.getSource("route")._data.geometry.coordinates;
    coordinates.splice(index, 1);
    map.getSource("route").setData({
        'type': 'Feature',
        'properties': {},
        'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
        }
    });
    if (mapMarkers.length < 2) {
        map.setLayoutProperty("directionRoute", "visibility", "none");
        map.setLayoutProperty("route", "visibility", "visible");
    }
    if (mapMarkers.findIndex(element => element.isSet == false) == -1) {
        let coordsT = [];
        mapMarkers.forEach(element => {
            coordsT.push([element.marker.getLngLat().lng, element.marker.getLngLat().lat])
        })
        handleMapboxDirectionsRQST(coordsT);
    }
    return true;
}

/*
--Method--
Function Input:
    marker ID
Function Output:
    Returns boolean for draggable of markerID
Function Description:   
    Checks for index of input markerID and if true allows it to be draggable (User has not confirmed)
  
*/
// allows user to drag a marker on the map

function markerSetDraggable(markerId, isDraggable) {
    let index = findMarkerIndex(markerId);
    if (index === false) {
        return false;
    }
    if (isDraggable == true || isDraggable == false) {
        mapMarkers[index].marker.setDraggable(isDraggable);
        return true;
    }
    return false;
}

/*
--Method--
Function Input:
    markerId
Function Output:
    Upadtes MapBox with coordinates 
Function Description:
    Upon confimring by user, this function get the coordinated of the markerID and allows output with address displayed for the user 
*/

// lets user confirm the a point that they selected
function confirmMarker(markerId, isConfirmed) {
    let index = findMarkerIndex(markerId);
    if (index === false) {
        return false;
    }
    if (isConfirmed != true && isConfirmed != false) {
        console.error(`Error: 2nd arg expected boolean`);
        return false;
    }
    mapMarkers[index].isSet = (isConfirmed == true);
    mapMarkers[index].marker.getPopup()
        ._content
        .getElementsByClassName("mdl-button")[0]
        .disabled = isConfirmed ? true : false;
    mapMarkers[index].marker.getPopup()
        ._content
        .getElementsByClassName("mdl-button")[0]
        .innerText = `${isConfirmed ? "Confirmed" : "Confirm"}`;
    let lon = mapMarkers[index].marker.getLngLat().lng;
    let lat = mapMarkers[index].marker.getLngLat().lat;
    if (isConfirmed) {
        makeGeocodingRqst(index, lon, lat);
        if (mapMarkers.findIndex(element => element.isSet == false) == -1) {
            let coordsT = [];
            mapMarkers.forEach(element => {
                coordsT.push([element.marker.getLngLat().lng, element.marker.getLngLat().lat])
            })
            handleMapboxDirectionsRQST(coordsT);
        }
    } else {
        updatePointsList();
    }
    return true;
}

/*
--Method--
Function Input:
    markerID
Function Output:
    Deletes marker upon confirmation
Function Description:
    This function deletes the marker with respect to the markerID selected and validates with user
*/

//allows user to delete a point on the route
function markerDeleteButtonClick(markerId) {
    let index = findMarkerIndex(markerId);
    if (index === false) {
        return false;
    }
    if (confirm("Are you sure you want to delete this marker?")) {
        deleteMarker(markerId);
        return updatePointsList();
    }
    return false;
}

/*
--Method--
Function Input:
    None
Function Output:
    Marker in Map
Function Description:
    This function allows user to add points in map
*/

//adds a point on the map, centred point, which user can drag to their preferred location
function addPointButton() {
    let currentNumPoints = mapMarkers.length;
    let currentVehicle = getVehicleType();
    let data;
    let snackbarContainer = document.getElementById('snackbar-toast');
    if (currentNumPoints >= 5 && currentVehicle != "minibus") {
        data = { message: `You've reached the maximum number of points for this vehicle type. Upgrade to the Minibus for 8 points!` };
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
        return false;
    } else if (currentNumPoints == 8) {
        data = { message: `You've reached the maximum number of points for this trip!` };
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
        return false;
    }
    let locationArray = map.getCenter();
    createNewMarker([locationArray.lng, locationArray.lat])
    return true;
}

/*
--Method--
Function Input:
    Default value of false
Function Output:
    Points on map being pushed to array 
Function Description:   
    This function allows exporting of points from the map which user selected for directions
*/
// 

function exportPoints(flip = false) {
    let pointsToExport = [];
    mapMarkers.forEach(element => {
        let markerLocation = element.locationData;
        let lng = element.marker.getLngLat().lng;
        let lat = element.marker.getLngLat().lat;
        if (flip) {
            pointsToExport.push([lng, lat, [markerLocation.part1, markerLocation.part2]])
        } else {
            pointsToExport.push([lat, lng, [markerLocation.part1, markerLocation.part2]])
        }
    });
    return pointsToExport;
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

// when clicked, user screen is dragged to the spefic marker that they selected
function flyToPoint(markerId) {
    let mapMarker = mapMarkers[markerId].marker;
    map.flyTo({
        center: [mapMarker.getLngLat().lng, mapMarker.getLngLat().lat],
        zoom: 17
    })
}


// The following code handles updating the route on the side of the page
let allowNewGeocodingRqst = true;
let currentlyProcessingIndex = 0;
let addressFromRqst = [];
function makeGeocodingRqst(index, lon, lat) {
    webServiceRequest("https://api.opencagedata.com/geocode/v1/json", {
        key: "97800ef9893843ccab33badcc534ff0e",
        q: `${lat}+${lon}`,
        jsonp: "parseGeocodingRqst"
    })
    allowNewGeocodingRqst = false;
    currentlyProcessingIndex = index;
    return;
}

/*
--Method--
Function Input:
    data
Function Output:
    Gets coordinates and updates the parsed value 
Function Description:   
    This function updates the points list from input data which are coordinates and allocate them into lat and lon
  
*/
//

function parseGeocodingRqst(data) {
    let dividedAddress = data.results[0].formatted.split(",");
    allowNewGeocodingRqst = true;
    let markerLocation = mapMarkers[currentlyProcessingIndex].locationData;
    markerLocation.part1 = dividedAddress[0];
    markerLocation.part2 = dividedAddress[1];
    updatePointsList();
    return;
}

/*
--Method--
Function Input:
    None
Function Output:
    Updates Points List
Function Description:
    Function updates points list in HTML and checks different veh types and if not minibus it will alert the user
    for too many points
*/

function updatePointsList() {
    let pointsListRef = document.getElementById("pointsList");
    let output = "";
    // If there is no points, display "No points"
    if (mapMarkers.length == 0) {
        pointsListRef.innerHTML = `<h3 id="noPoints">No Points</h3>`;
        return;
    }
    // Else if there are points, display them
    if (getVehicleType() == "minibus" || mapMarkers.length <= 5) {
        mapMarkers.forEach((element, index) => {
            let markerLocation = element.locationData;
            output += mapObjectCreator(index, [markerLocation.part1, markerLocation.part2], element.isSet ? true : false);
        });
    } else {
        for (let index = 0; index < 5; index++) {
            let markerLocation = mapMarkers[index].locationData;
            output += mapObjectCreator(index, [markerLocation.part1, markerLocation.part2], mapMarkers[index].isSet ? true : false);
        }
        for (let index = 5; index < mapMarkers.length; index++) {
            output += mapObjectCreator(index, ["Too many points", "Delete this point or select minibus for more"], "invalid");
        }
    }
    if (mapMarkers.findIndex(element => !element.isSet) != -1 || mapMarkers.length < 2) {
        bookingSummaryTimeRef.innerHTML = "<i>Confirm all points for a duration</i>";
        document.getElementById("bs-fareTotal").innerHTML = "<i>Confirm all points for trip cost</i>"
    }
    blockCreateBookingBt();
    pointsListRef.innerHTML = output;
}

/*
--Method--
Function Input:
    markerId, addressArray
Function Output:
    Displays user the address
Function Description:
    The function updates the selected points and displays the confirmed points to the user.
*/

//displays the points that user confirmed

function mapObjectCreator(markerId, addressArray, display = true) {
    let icon = "multiple_stop";
    let addressesToDisplay = addressArray;
    if (!display && display != "invalid") {
        addressesToDisplay = ["Point not confirmed", ""]
    }
    if (markerId == mapMarkers.length - 1) {
        icon = "flag";
    }
    if (markerId == 0) {
        icon = "trip_origin";
    }
    if (display == "invalid") {
        icon = "error";
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
    None
Function Output:
    Button gets disabled
Function Description:
    Function limts the amount of points the user can create
*/

function blockCreateBookingBt() {
    if (mapMarkers.length <= 1) {
        document.getElementById('confirmBooking').disabled = true;
    }
    else {
        document.getElementById('confirmBooking').disabled = false;
    }
}


//--------------------
// Directions API
//--------------------

/*
--Method--
Function Input:
    Coordinates
Function Output:
    Returns direction 
Function Description:
    Displays user with polylines for given points via mapBox API directions.
    Runs a request and returns from the MapBox API
*/

let request = new XMLHttpRequest();
let tripDuration = 0;
let tripDistanceActual = 0;

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
            tripDistanceActual = json.routes[0].distance;
            tripDuration = json.routes[0].duration;
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
            //let bookingSummaryTripFare = document.getElementById("bs-fareTotal").innerText;
            let outputTime = "";
            let bookingDuration = [Math.floor(tripDuration / Math.pow(60, 2)) % 100, Math.floor(tripDuration / 60) % 60, Math.floor(tripDuration) % 60]
            if (bookingDuration[0] > 0) {
                outputTime += `${bookingDuration[0]} hrs `
            }
            if (bookingDuration[1] > 0) {
                outputTime += `${bookingDuration[1]} mins `
            }
            outputTime += `${bookingDuration[2]} secs`
            bookingSummaryTimeRef.innerText = outputTime;
            map.setLayoutProperty("directionRoute", "visibility", "visible");
            map.setLayoutProperty("route", "visibility", "none");
            let cost = tripCost(getVehicleType(), getTime(),tripDistanceActual/1000);
            document.getElementById("bs-fareTotal").innerText = "$" + cost.toFixed(2);
        }
    }
    request.send();
};

//--------------------
// End Directions API
//--------------------

//--------------------
// MapBox Token and setting of boundaries in Map
//--------------------

mapboxgl.accessToken = 'pk.eyJ1IjoiZ3JvdXAwMzMiLCJhIjoiY2ttdmd2dXJsMDUxbDJwbWtzd2JzaGQ2MSJ9.7Q1Z7XBU1PSebyo5S3HSuA';
let map = new mapboxgl.Map({
    container: 'map-content',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [144.9631, -37.8136], // starting position
    zoom: 10, // starting zoom
    maxBounds: [
        [140.98172985945615, -39.114684159633455],
        [150.15301996882192, -34.02682894890615]
    ]
});


// Search Bar
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        // Limit seach results to Australia.
        countries: 'au',

        // Use a bounding box to further limit results
        // to the geographic bounds representing the
        // region of Victoria.
        bbox: [140.98172985945615, -39.114684159633455, 150.15301996882192, -34.02682894890615],

        // Apply a client-side filter to further limit results
        // to those strictly within the Victoria region.
        filter: function (item) {
            // returns true if item contains Victoria region
            return item.context
                .map(function (i) {
                    // ID is in the form {index}.{id} per https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
                    // This example searches for the `region`
                    // named `Victoria`.
                    return (
                        i.id.split('.').shift() === 'region' &&
                        i.text === 'Victoria'
                    );
                })
                .reduce(function (acc, cur) {
                    return acc || cur;
                });
        },
        mapboxgl: mapboxgl
    })
);
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
    map.addSource('route', {
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
    // Adds between points line
    map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#888',
            'line-width': 8
        }
    });
    // Adds route line 
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
    document.getElementById("addPointButton").disabled = false;
});

/*
Adds an event listener to the radio buttons for enforcing the 8 point limit for all vehicles except Minibus
*/
// Cycles through each R button
document.getElementsByName("vehicle-options").forEach(element => {
    if (element.value != "minibus") {
        // The non minibus crew
        element.addEventListener('change', function () {
            let bookingSummaryVehicle = document.getElementById("bs-vehicle");  // gets the element to edit
            let capitalisedVehicle = getVehicleType();
            capitalisedVehicle = capitalisedVehicle.charAt(0).toUpperCase() + getVehicleType().slice(1);
            bookingSummaryVehicle.innerText = capitalisedVehicle; //Updates BS vehicle

            // Enforcing 5 point limit
            let currentNumPoints = mapMarkers.length;
            if (currentNumPoints > 5) {
                for (let index = 5; index < currentNumPoints; index++) {
                    let currentMarker = mapMarkers[index].marker;
                    currentMarker.getPopup()
                        ._content
                        .getElementsByClassName("mdl-button")[0]
                        .disabled = true;
                    currentMarker.getElement().innerText = "!";
                    mapMarkers[index].marker.getPopup()
                        ._content
                        .getElementsByClassName("mdl-button")[0]
                        .innerText = `Too Many Points`;
                    // Needs to unconfirm the marker
                }
                updatePointsList();
            }
            let dbVehicle = document.getElementById("db-vehicle")
            dbVehicle.innerText = capitalisedVehicle;
        });
    } else {
        // The mini bus
        element.addEventListener('change', function () {
            let bookingSummaryVehicle = document.getElementById("bs-vehicle");
            bookingSummaryVehicle.innerText = "Minibus"
            mapMarkers.forEach((element, index) => {
                let currentMarker = element.marker;
                currentMarker.getPopup()
                    ._content
                    .getElementsByClassName("mdl-button")[0]
                    .disabled = (element.isSet) ? true : false;;
                currentMarker.getElement().innerText = `${index + 1}`;
                currentMarker.getPopup()._content
                    .getElementsByClassName("mdl-button")[0]
                    .innerText = (element.isSet) ? "Confirmed" : "Confirm";
            });
            updatePointsList();
            let dbVehicle = document.getElementById("db-vehicle")
            dbVehicle.innerText = "Minibus";
        })
    }
})

// Runs on load or refersh 

window.onload = function () {
    setMinDate();
    setMinTime();
    updatePointsList();
    blockCreateBookingBt();

    // Update Selected vehicle on load 
    let capitalisedVehicle = getVehicleType();
    capitalisedVehicle = capitalisedVehicle.charAt(0).toUpperCase() + getVehicleType().slice(1);
    let bookingSummaryVehicle = document.getElementById("bs-vehicle");
    let dbVehicle = document.getElementById("db-vehicle")
    dbVehicle.innerText = capitalisedVehicle;
    bookingSummaryVehicle.innerText = capitalisedVehicle;

}

// Create booking instance

/*
--Method--
Function Input:
    None
Function Output:
    Stores data 
Function Description:
    This function is important for implementing the booking itself and storing the data in storage
*/

function createBooking() {
    if (mapMarkers.length < 2) {
        return false
    }
    let booking = new Booking();
    let taxi = getTaxiByType(getVehicleType());
    exportPoints().forEach(element => {
        booking.addPoint(element[0], element[1], element[2]);
    })
    //
    booking.bookingTime = convertTime();
    booking.tripDuration = tripDuration;
    booking.tripDistance = tripDistanceActual;
    booking.tripCost = tripCost(getVehicleType(), getTime(),tripDistanceActual/1000);
    booking.assignedTaxi = taxi;
    bookingList.addBooking(booking);
    storeData(BOOKING_STORAGE_KEY, bookingList);
    return true;
}

/*
--Method--
Function Input:
    None
Function Output:
    Returns time and date into standard format
Function Description:
    Responsible for converting user input date and time into standardised format to display in HTML
*/

function convertTime() {
    let timeVar = getTime();
    let dateVar = getDate();
    let dateObj = new Date;
    dateObj.setFullYear(dateVar[0]);
    dateObj.setMonth(dateVar[1]-1);
    dateObj.setDate(dateVar[2]);
    dateObj.setHours(timeVar[0]);
    dateObj.setMinutes(timeVar[1]);
    dateObj.setMilliseconds(0);
    return dateObj.valueOf();
}



/*
--Method--
Function Input:
    Number
Function Output:
    Estimated Time
Function Description:
    Function is responsible for calculating estimated arrival time for a trip
*/

// Converts mins to hour and mins

function eta(Number) {
    let minToAdd = Math.ceil(Number / 60)

    let splittedTime = [];
    userInputTimeme.value.split(":").forEach(element => {
        splittedTime.push(Number(element));
    });
    let etaTime = splittedTime[1] + minToAdd;
    etaTime.join(':')

    let etaHour = (etaTime.getHours() < 10 ? '0' : '') + etaTime.getHours();
    let etaMin = (etaTime.getMinutes() < 10 ? '0' : '') + etaTime.getMinutes();
    let estimatedTime = etaHour + ":" + etaMin
    return estimatedTime
}

/*
--Method--
Function Input:
    Vehicle, Time, Distance
Function Output:
    Cost
Function Description:
    Function responsible for calculating trip fare
*/

// Calculate Fare

function tripCost(vehicle, time, distance) {
    let flagRate = 4.20;
    let distanceBasedRate = 1.622;
    let nightLevy = 1.2;
    let commercialPassengerLevy = 1.1;
    let additionalLevyVType = {
        "sedan": 0,
        "suv": 3.5,
        "van": 6,
        "minibus": 10
    }
    let tripCost = flagRate;

    tripCost += distance * distanceBasedRate + commercialPassengerLevy + additionalLevyVType[vehicle];
    if (time[0] >= 17 || time[0] <= 9) {
        tripCost = tripCost * nightLevy;
    }
    return tripCost;
}





