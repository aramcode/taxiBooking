"use strict"

let taxiList = [
	{"rego":"VOV-887","type":"sedan"},
	{"rego":"OZS-293","type":"van"},
	{"rego":"WRE-188","type":"suv"},
	{"rego":"FWZ-490","type":"sedan"},
	{"rego":"NYE-874","type":"suv"},
	{"rego":"TES-277","type":"sedan"},
	{"rego":"GSP-874","type":"suv"},
	{"rego":"UAH-328","type":"minibus"},
	{"rego":"RJQ-001","type":"suv"},
	{"rego":"AGD-793","type":"minibus"}
];

function getTaxiByType(vehicle) {
	let taxiTypeList = [];
	taxiList.forEach(element => {
		if (element.type == vehicle){
			taxiTypeList.push(element.rego);
		}
	})
	let indexOfTaxi = randomTaxiPicker(taxiTypeList.length-1);
	let output = taxiTypeList[indexOfTaxi];
	return output;
}

function getTaxiByRego(rego) {
	for (let i = 0;i < taxiList.length;i++){
		if (taxiList[i].rego == rego){
			return taxiList[i].type;
		}
	}
	return -1;
}

function randomTaxiPicker(numberOfTaxis) {
	return Math.round(Math.random()*numberOfTaxis)
}