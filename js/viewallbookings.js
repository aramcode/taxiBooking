"use strict"

/*
Other table
<div class="card">
    <div style="width: 50%; height: 100px;float: left;">
        <Div style="margin-left: -150px;margin-top: 10px;">
            From
        </Div>
    </div>
    <div style="margin-left: 50%; height: 100px;">
        <Div style="margin-right: 150px;margin-top: 10px;">
            Date:
        </Div>
    </div>
</div>
*/
function createTableElement(from,to,stopCount,date,cost,index) {
    let output = `<table class="b" class="center" class="ex1">
                        <tr>
                            <td style="text-align:justify;">
                                <p>
                                    Number of stops: ${stopCount}<br>
                                    From: ${from}<br>
                                    To: ${to}<br>
                                    Date: ${date}<br>
                                    Cost: ${cost}<br>
                                </p>
                            </td>
                        </tr>
                    <tfoot>
                        <tr>
                            <th colspan="2">
                                <button onclick="moreDetails(${index})">More
                                    Details</button>
                            </th>
                        </tr>
                    </tfoot>
                </table>`;
    return output;
}

function moreDetails(index) {
    storeData(CURRENT_BOOKING_KEY,index);
    window.location.href= 'detailedBooking.html';
}

let pastBookings = [];
let futureBookings = [];
let currentTime = new Date().valueOf();
bookingList.bookingList.forEach((element,index) => {
    if (element.bookingTime < currentTime) {
        pastBookings.push({
            index: index,
            booking: element
        });
    } else {
        futureBookings.push({
            index: index,
            booking: element
        });
    }
});

futureBookings.sort(function(a, b) {
    return a.booking.bookingTime - b.booking.bookingTime;
});

pastBookings.sort(function(a, b) {
    return a.booking.bookingTime - b.booking.bookingTime;
});

// Create references to past and future booking spots
let pastBookingEntriesRef = document.getElementById("pastBookingEntries");
let futureBookingEntriesRef = document.getElementById("futureBookingEntries");

// Display past bookings
let output = "";
pastBookings.forEach(mainElement => {
    let numberPoints = mainElement.booking.numPoints;
    let fromAddress = mainElement.booking.bookingPoints[0].address.join(", ");
    let toAddress = mainElement.booking.bookingPoints[numberPoints-1].address.join(", ");
    let date = new Date();
    date.setTime(mainElement.booking.bookingTime);
    date = date.toString().split(" GMT")[0];
    let cost = "$" + mainElement.booking.tripCost.toFixed(2);
    let index = mainElement.index;
    output += createTableElement(fromAddress,toAddress,numberPoints,date,cost,index)
})
pastBookingEntriesRef.innerHTML = output;

// Display future bookings
output = "";
futureBookings.forEach(mainElement => {
    let numberPoints = mainElement.booking.numPoints;
    let fromAddress = mainElement.booking.bookingPoints[0].address.join(", ");
    let toAddress = mainElement.booking.bookingPoints[numberPoints-1].address.join(", ");
    let date = new Date();
    date.setTime(mainElement.booking.bookingTime);
    date = date.toString().split(" GMT")[0];
    let cost = "$" + mainElement.booking.tripCost.toFixed(2);
    let index = mainElement.index;
    output += createTableElement(fromAddress,toAddress,numberPoints,date,cost,index)
})
futureBookingEntriesRef.innerHTML = output;