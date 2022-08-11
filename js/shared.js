"use strict"

const VEHICLE_STORAGE_KEY = "vehicle_storage";
const BOOKING_STORAGE_KEY = "booking_storage";
const CURRENT_BOOKING_KEY = "current_booking";

// -- Begin Class Definitions --
class Point {
    constructor(lat,lon,address) {
        if (!Array.isArray(address) && address.length != 2) {
            throw "ERROR: Cannot create point instance. Address array is invalid (req. 2 items)!"
        }
        this._lat = lat;
        this._lon = lon;
        this._address = address;
    }
    get lat() {
        return this._lat;
    }
    get lon() {
        return this._lon;
    }
    get address() {
        return this._address;
    }
    set lat(newLat) {
        if (isNaN(newLat)) {
            throw  `Invalid Input: Expected number but got ${typeof newLat} (variable lat can not be set to have a non-numeric value)`;
        }
        this._lat = newLat;
        return true;
    }
    set lon(newlon) {
        if (isNaN(newlon)) {
            throw  `Invalid Input: Expected number but got ${typeof newlon} (variable lon can not be set to have a non-numeric value)`;
        }
        this._lat = newLat;
        return true;
    }
    set address(newAddress) {
        if (!Array.isArray(newAddress) && newAddress.length != 2) {
            throw "ERROR: Cannot edit point instance. Address array is invalid (req. 2 items)!";
        }
        this._address = newAddress;
        return true;
    }
}

class Booking {
    constructor() {
        this._bookingID = Math.floor(Math.random()*1000000);
        this._bookingTime = Date.now();
        this._bookingPoints = [];
        this._tripDistance = 0;
        this._tripDuration = 0;
        this._tripCost = 0;
        this._assignedTaxi = -1;
    }
    get bookingId() {
        return this._bookingID;
    }
    get bookingTime() {
        return this._bookingTime;
    }
    set bookingTime(newTime) {
        if (isNaN(newTime)) {
            throw "Error: Expected numerical argument!";
        }
        this._bookingTime = newTime;
    }
    get bookingPoints() {
        return this._bookingPoints;
    }
    get tripDistance() {
        return this._tripDistance;
    }
    set tripDistance(newDistance) {
        if (isNaN(newDistance)) {
            throw "Error: Expected numerical argument!";
        }
        this._tripDistance = newDistance;
    }
    get tripDuration() {
        return this._tripDuration;
    }
    set tripDuration(newDuration) {
        if (isNaN(newDuration)) {
            throw "Error: Expected numerical argument!";
        }
        this._tripDuration = newDuration;
    }
    get tripCost() {
        return this._tripCost;
    }
    set tripCost(newCost) {
        if (isNaN(newCost)) {
            throw "Error: Expected numerical argument!";
        }
        this._tripCost = newCost;
    }
    get assignedTaxi() {
        return this._assignedTaxi;
    }
    set assignedTaxi(newTaxi) {
        this._assignedTaxi = newTaxi;
    }
    get numPoints() {
        return this._bookingPoints.length;
    }
    addPoint(lat,lon,addressArray) {
        if (isNaN(lat) || isNaN(lon)) {
            console.error("Error: Expected numeric parameters")
            return false;
        }
        let newPoint = new Point(lat,lon,addressArray);
        this._bookingPoints.push(newPoint);
    }
    deletePoint(pointIndex) {
        if (isNaN(pointIndex) || pointIndex < 0) {
            console.error(`Error: Expected non-negative integer, got ${pointIndex}`);
            return false;
        }
        if (pointIndex < this._bookingPoints.length) {
            return -1;
        }
        this._bookingTripSegments.splice(pointIndex,1);
        return true;
    }
    getPoint(pointIndex) {
        if (isNaN(pointIndex) || pointIndex < 0) {
            console.error(`Error: Expected non-negative integer, got ${pointIndex}`);
            return false;
        }
        if (pointIndex >= this._bookingPoints.length) {
            return -1;
        }
        return this._bookingPoints[pointIndex];
    }
    setTime(otherTime = undefined) {
        let newBookingTime;
        if (otherTime === undefined) {
            newBookingTime = new Date;
        } else {
            newBookingTime = new Date(otherTime);
        }
        this._bookingTime = newBookingTime;
    }
    /* -- TODO --
     - Create a method that calculates the cost based on the various levys imposed
     - Create a method that uses the TripSegment.distanceACF() to get the linear distance of the route
     - Create a method that uses the MapBox API to get the true distance of the route
     - 
    
    */
    fromData(data) {
        this._bookingID = data._bookingID;
        this._bookingTime = data._bookingTime;
        this._tripDistance = data._tripDistance;
        this._tripDuration = data._tripDuration;
        this._tripCost = data._tripCost;
        this._assignedTaxi = data._assignedTaxi;
        data._bookingPoints.forEach(element => {
            let newPoint = new Point(element._lat,element._lon,element._address);
            this._bookingPoints.push(newPoint);
        });
        return this;
    }
}

class BookingList {
    constructor() {
        this._bookingList = [];
    }
    get bookingList() {
        return this._bookingList;
    }
    addBooking(bookingInstance) {
        this._bookingList.push(bookingInstance);
        return this._bookingList;
    }
    getBooking(bookingIndex) {
        if (isNaN(bookingIndex) || bookingIndex < 0) {
            console.error(`Error: Expected non-negative integer, got ${bookingIndex}`);
            return false;
        }
        if (bookingIndex >= this._bookingList.length) {
            return -1;
        }
        return this._bookingList[bookingIndex];
    }
    removeBooking(bookingIndex) {
        if (isNaN(bookingIndex) || bookingIndex < 0) {
            console.error(`Error: Expected non-negative integer, got ${bookingIndex}`);
            return false;
        }
        if (bookingIndex >= this._bookingList.length) {
            return -1;
        }
        this._bookingList.splice(bookingIndex,1);
        return true;
    }
    fromData(data) {
        data._bookingList.forEach(element => {
            let restoredBooking = new Booking();
            restoredBooking.fromData(element);
            this._bookingList.push(restoredBooking);
        });
        return this;
    }
}

// -- End Class Definitions --

// --- Start of core functions ---

/*
reverseArray(array)

This function takes one argument as an array and then outputs the same array
but in reverse order (used for sorting additional students into queues). This
is a non-destructive method of the Array.prototype.reverse() method.

**Arguments**
- array: Any one dimensional array

**Outputs:**
- reversedArrayOutput: The reverse of the input array
*/
function reverseArray(array) {
    let maxIndex = array.length - 1;
    let reversedArrayInitial = [];
    let reversedArrayOutput = [];
    array.forEach((element, index) => {
        reversedArrayInitial[maxIndex - index] = element;
    })
    reversedArrayInitial.forEach(element => {
        reversedArrayOutput.push(element);
    })
    return reversedArrayOutput;
}

/*
checkForStoredData(key)

This function takes a key (string) as a parameter checks to see local storage has data
associated with the supplied key. If data is present the function returns true, otherwise,
it returns false.

**Arguments**
 - key: the key at which to check for stored data in localStorage

**Outputs:**
- true: Stored data is present
- false: Stored data is not present
*/
function checkForStoredData(key) {
    let rawValue = localStorage.getItem(key);
    if (rawValue === null) {
        return false;
    } else {
        return true;
    }
}

/*
storeData(key,value)

This function takes a key (string) and data (an object or string to store) as parameters
and stores the data in local storage with the supplied key.

**Arguments**
- key: a string to act as the key in localStorage that allows for the retrival of the supplied data
- data: an object that is to be stored in localStorage along with the associated key

**Outputs:**
*None*
*/
function storeData(key, value) {
    if (typeof value == "object") {
        value = JSON.stringify(value);
    }
    localStorage.setItem(key, value);
}

/*
getData(key)

This function takes a key (string) as a parameter retrieves any data associated with
the supplied key from local storage. The function returns the retrieved data.

**Arguments**
 - key: the key at which to retrieve data stored in localStorage

**Outputs:**
- data: the data retrieved from localStorage
*/
function getData(key) {
    let rawData = localStorage.getItem(key);
    let data;
    try {
        data = JSON.parse(rawData);
    } catch (error) {
        console.warn(`Error in retrieving value: JSON.parse failed (${error})\n`);
        data = rawData;
    }
    return data;
}


let bookingList = new BookingList();   // Create a new instace of the BookingList class
if (checkForStoredData(BOOKING_STORAGE_KEY)) { // Check to see if data already exists in local storage
    // -- If data already exists --
    let oldData = getData(BOOKING_STORAGE_KEY);
    bookingList.fromData(oldData);   // Restore the old booking list from the data
} else {
    // -- If data doesn't exist --
    // TODO * Create new booking list *
    storeData(BOOKING_STORAGE_KEY, bookingList)  // Store the new session in localStorage
}

// -- End Global Class Instances --
