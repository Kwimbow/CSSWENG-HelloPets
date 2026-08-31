// rads --> group of radio buttons
// chks --> group of checkboxes
radsPetSelection = document.getElementsByName("pet-selection"); // dog or cat

// STEP 3 PET INFO (Dogs)
inpPetName = document.getElementById("pet-name");
inpPetWeight = document.getElementById("pet-weight");
inpPetBreed = document.getElementById("pet-breed");
petSizeBanner = document.getElementById("pet-size-banner");
petSizeValue = document.getElementById("pet-size-value");
petSizeRate = document.getElementById("pet-size-rate");

// STEPm 3 PET INFO (cats)
inpPetNameCat = document.getElementById("pet-name-cat");
inpPetWeightCat = document.getElementById("pet-weight-cat");
catFlatRateDisplay = document.getElementById("cat-flat-rate");

// STEP 5 CUSTOMER INFO
inpFirstName = document.getElementById("first-name");
inpLastName = document.getElementById("last-name");
inpEmail = document.getElementById("email");
inpMobileNumber = document.getElementById("mobile");
inpNotes = document.getElementById("optional-notes");

btnConfirmBooking = document.getElementById("confirm-boarding"); // actually a span

// Below is for dog and cat field selection, the rest of the steps are hidden until a pet type is selected
// steps 3 & 4 swap between the dog layout and the cat layout
sectionPostPetType = document.getElementById("post-pet-type");
elsDogOnly = document.querySelectorAll(".dog-only");
elsCatOnly = document.querySelectorAll(".cat-only");
// only the fields belonging to the active pet type should ever be required,
// otherwise the hidden set for the *other* pet type blocks submission
inpsDogRequired = [inpPetName, inpPetWeight, inpPetBreed];
inpsCatRequired = [inpPetNameCat, inpPetWeightCat];

allInputs = document.querySelectorAll("input");
allTextInputs = document.querySelectorAll("input[type='text'], input[type='email']");
allCheckboxInputs = document.querySelectorAll("input[type='checkbox']");

petSizeTiers = [
	{ minWeight: 0, maxWeight: 7, letter: "S", label: "Small" },
	{ minWeight: 7, maxWeight: 15, letter: "M", label: "Medium" },
	{ minWeight: 15, maxWeight: 25, letter: "L", label: "Large" },
	{ minWeight: 25, maxWeight: 35, letter: "XL", label: "Extra Large" },
	{ minWeight: 35, maxWeight: Infinity, letter: "XXL", label: "Extra Extra Large" },
];

// boarding rate per night
boardingRatesPerNight = { S: 700, M: 750, L: 850, XL: 1000, XXL: 1100 };

// summary modal elements
summaryModalOverlay = document.getElementById("summary-modal-overlay");
btnSummaryModalClose = document.getElementById("summary-modal-close");
btnSummaryCancel = document.getElementById("summary-cancel-btn");
btnSummaryConfirm = document.getElementById("summary-confirm-btn");

// accepts a collection of radio buttons and returns the value of the selected one
const getRadioButtonsValue = function(radButtons) {
	for (const btn of radButtons) {
		if (btn.checked) {
			return btn.value;
		}
	}
	return null;
}

// accepts a collection of checkboxes and returns an array containing the ones checked
const getCheckboxesValue = function(chkButtons) {
	checkedArr = []
	for (const btn of chkButtons) {
		if (btn.checked) {
			checkedArr.push(btn.name);
		}
	}
	return checkedArr;
}

// verifies form elements (like required inputs, as well as email formatting)
// returns true if form inputs are valid
const verifyForm = function() {
	const boardingRange = window.boardingDateRange || { startDate: null, startTime: null, endDate: null, endTime: null };
	const startDate = boardingRange.startDate;
	const startTime = boardingRange.startTime;
	const endDate = boardingRange.endDate;
	const endTime = boardingRange.endTime;

	const startDateTime = startDate && startTime ? new Date(`${startDate}T${startTime}:00`) : null;
	const endDateTime = endDate && endTime ? new Date(`${endDate}T${endTime}:00`) : null;
	const minStayMs = 24 * 60 * 60 * 1000;

	if (!startDate || !startTime || !endDate || !endTime) {
		document.getElementById("start-appointment-error").style.display = "";
		document.getElementById("end-appointment-error").style.display = "";
		return false;
	}

	if (!startDateTime || !endDateTime || endDateTime <= startDateTime || (endDateTime - startDateTime) < minStayMs) {
		document.getElementById("end-appointment-error").textContent = "End date must be at least 24 hours after the start date and time.";
		document.getElementById("end-appointment-error").style.display = "";
		return false;
	}

	document.getElementById("start-appointment-error").style.display = "none";
	document.getElementById("end-appointment-error").style.display = "none";

	for (const btn of allInputs) {
		// informs the user of the first invalid form input
		isValid = btn.reportValidity();
		if (!isValid) {
			return false;
		}
	}
	return true;
}

// returns the size for a given weight
const getPetSizeFromWeight = function(weightStr) {
	weightNum = parseFloat(weightStr);
	if (isNaN(weightNum) || weightNum <= 0) {
		return null;
	}
	for (const tier of petSizeTiers) {
		if (weightNum >= tier.minWeight && weightNum < tier.maxWeight) {
			return tier;
		}
	}
	return petSizeTiers[petSizeTiers.length - 1];
}

// updates the small "Estimated size" banner in the dog pet-info card
const updatePetSizeBanner = function() {
	if (!petSizeBanner) return;
	tier = getPetSizeFromWeight(inpPetWeight.value);
	if (!tier) {
		petSizeBanner.style.display = "none";
		return;
	}
	petSizeValue.textContent = `${tier.label} (${tier.letter})`;
	petSizeRate.textContent = `₱${boardingRatesPerNight[tier.letter].toLocaleString()}/night`;
	petSizeBanner.style.display = "";
}

if (inpPetWeight) {
	inpPetWeight.addEventListener("input", updatePetSizeBanner);
	updatePetSizeBanner();
}

// cats are always billed at the flat Small rate
if (catFlatRateDisplay) {
	catFlatRateDisplay.textContent = `₱${boardingRatesPerNight[petSizeTiers[0].letter].toLocaleString()}`;
}

const loadPricingOverrides = async function() {
	try {
		const response = await fetch("/api/pricing");
		if (!response.ok) return;

		const { pricing } = await response.json();
		if (!pricing) return;

		for (const size of Object.keys(boardingRatesPerNight)) {
			key = `boarding:${size}`;
			if (Object.hasOwn(pricing, key)) {
				boardingRatesPerNight[size] = pricing[key];
			}
		}

		updatePetSizeBanner();
		if (catFlatRateDisplay) {
			catFlatRateDisplay.textContent = `₱${boardingRatesPerNight[petSizeTiers[0].letter].toLocaleString()}`;
		}
	} catch (error) {
		console.error("Could not load current pricing, using defaults.", error);
	}
}

loadPricingOverrides();

// calendar-day difference between two "YYYY-MM-DD" strings (not lookign at actual time diff, just days)
const computeNights = function(startDateStr, endDateStr) {
	startDay = new Date(`${startDateStr}T00:00:00`);
	endDay = new Date(`${endDateStr}T00:00:00`);
	return Math.round((endDay - startDay) / (24 * 60 * 60 * 1000));
}

// accepts a group of radio buttons and a value
// and checks the one with that value
const checkRadioButton = function(radButtons, value) {
	for (const btn of radButtons) {
		if (btn.value === value) {
			btn.checked = true;
			return;
		}
	}
}

// shows/hides steps 3-7 based on whether a pet type has been picked yet,
// and swaps steps 3 & 4 between the dog layout and the cat layout
const updatePetTypeSections = function() {
	selectedPetType = getRadioButtonsValue(radsPetSelection);

	if (!selectedPetType) {
		// nothing picked yet
		sectionPostPetType.classList.remove("visible");
		for (const inp of inpsDogRequired) { inp.required = false; }
		for (const inp of inpsCatRequired) { inp.required = false; }
		return;
	}

	// somethign is selected
	sectionPostPetType.classList.add("visible");

	isDogSelected = selectedPetType === "dog";

	for (const el of elsDogOnly) {
		el.style.display = isDogSelected ? "" : "none";
	}
	for (const el of elsCatOnly) {
		el.style.display = isDogSelected ? "none" : "";
	}

	// only the active pet type's fields should be required
	for (const inp of inpsDogRequired) { inp.required = isDogSelected; }
	for (const inp of inpsCatRequired) { inp.required = !isDogSelected; }
}

for (const rad of radsPetSelection) {
	rad.addEventListener("change", updatePetTypeSections);
}

// run once on load in
// case the browser restored a previous selection via back/forward cache
updatePetTypeSections();

// clearing/resetting the form after submitting
const clearForm = function() {
	for (const btn of allTextInputs) {
		btn.value = "";
	}

	for (const btn of allCheckboxInputs) {
		btn.checked = false;
	}

	// uncheck pet type entirely so the form goes back to its initial
	// state (only steps 1 & 2 visible) instead of defaulting to dog
	for (const rad of radsPetSelection) {
		rad.checked = false;
	}
	updatePetTypeSections();

	// checking the default option for radio buttons
	checkRadioButton(radsPetSelection, "dog")
	updatePetSizeBanner();
	if (window.boardingDateRange && typeof window.boardingDateRange.reset === "function") {
		window.boardingDateRange.reset();
	} else {
		resetCalendarSelection();
	}
}

function goBackHome(){
	window.location.replace("/")
}


const buildBookingObj = function() {
	petSelection = getRadioButtonsValue(radsPetSelection);
    
    isDogSelected = petSelection === "dog";

    return {
        startDate: window.boardingDateRange.startDate,
        startTime: window.boardingDateRange.startTime,
		endDate: window.boardingDateRange.endDate,
        endTime: window.boardingDateRange.endTime,
        petSelection: petSelection,
        petName: isDogSelected ? inpPetName.value : inpPetNameCat.value,
        petWeight: isDogSelected ? inpPetWeight.value : inpPetWeightCat.value,
        petBreed: isDogSelected ? inpPetBreed.value : null,
        customer: {
			firstName: inpFirstName.value,
			lastName: inpLastName.value,
			email: inpEmail.value,
			mobileNumber: inpMobileNumber.value,
        },
        optionalNotes: inpNotes.value,
        createdAt: new Date().toISOString(),
	};
}


const submitForm = async function() {
	isValid = verifyForm();
	if (!isValid) {
		closeSummaryModal();
		return;
	}

	payloadObj = buildBookingObj();
	console.log(payloadObj);

	const response = await fetch("/submit-boarding-booking", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(payloadObj)
	});

	const responseObj = await response.json();
	const success = responseObj.success;

	if (success) {
		alert("Form successfully submitted.");
		closeSummaryModal();
		clearForm();
		goBackHome();
	} else {
		alert("There was an error submitting the form.");
	}
}

const openSummaryModal = function() {
	summaryModalOverlay.classList.add("visible");
}

const closeSummaryModal = function() {
	summaryModalOverlay.classList.remove("visible");
}

// fills in the summary modal from the current form state and totals up the price
const renderBookingSummary = function() {
	petSelection = getRadioButtonsValue(radsPetSelection);
	isDogSelected = petSelection === "dog";

	document.getElementById("summary-customer-name").textContent = `${inpFirstName.value} ${inpLastName.value}`;
	document.getElementById("summary-customer-email").textContent = inpEmail.value;
	document.getElementById("summary-customer-mobile").textContent = inpMobileNumber.value;

	document.getElementById("summary-pet-type").textContent = isDogSelected ? "Dog" : "Cat";
	document.getElementById("summary-pet-name").textContent = isDogSelected ? inpPetName.value : inpPetNameCat.value;

	weightVal = isDogSelected ? inpPetWeight.value : inpPetWeightCat.value;
	document.getElementById("summary-pet-weight").textContent = `${weightVal} kg`;

	breedRow = document.getElementById("summary-pet-breed-row");
	if (isDogSelected) {
		breedRow.style.display = "";
		document.getElementById("summary-pet-breed").textContent = inpPetBreed.value;
	} else {
		breedRow.style.display = "none";
	}

	sizeRow = document.getElementById("summary-pet-size-row");
	if (isDogSelected) {
		sizeRow.style.display = "";
		tier = getPetSizeFromWeight(weightVal);
		document.getElementById("summary-pet-size").textContent = tier ? `${tier.label} (${tier.letter})` : "Not yet determined";
	} else {
		// cats are always charged the flat "Small" boarding rate, regardless of weight
		sizeRow.style.display = "none";
		tier = petSizeTiers[0];
	}

	const boardingRange = window.boardingDateRange;
	document.getElementById("summary-checkin").textContent =
		(boardingRange.startDate && boardingRange.startTime) ? `${boardingRange.startDate} at ${boardingRange.startTime}` : "Not selected";
	document.getElementById("summary-checkout").textContent =
		(boardingRange.endDate && boardingRange.endTime) ? `${boardingRange.endDate} at ${boardingRange.endTime}` : "Not selected";

	nights = (boardingRange.startDate && boardingRange.endDate) ? computeNights(boardingRange.startDate, boardingRange.endDate) : 0;
	document.getElementById("summary-nights").textContent = nights > 0 ? `${nights}` : "Not yet determined";

	servicesListEl = document.getElementById("summary-services-list");
	servicesListEl.innerHTML = "";
	totalAmount = 0;

	const addSummaryLine = function(label, amount) {
		row = document.createElement("div");
		row.className = "summary-row";

		nameSpan = document.createElement("span");
		nameSpan.textContent = label;

		priceSpan = document.createElement("span");
		priceSpan.textContent = (amount === null) ? "TBD" : `₱${amount.toLocaleString()}`;

		row.appendChild(nameSpan);
		row.appendChild(priceSpan);
		servicesListEl.appendChild(row);

		if (amount !== null) {
			totalAmount += amount;
		}
	}

	ratePerNight = tier ? boardingRatesPerNight[tier.letter] : null;
	addSummaryLine(tier ? `Rate (${tier.letter}) x ${nights} night${nights === 1 ? "" : "s"}` : "Boarding rate", (ratePerNight && nights > 0) ? ratePerNight * nights : null);

	document.getElementById("summary-total-amount").textContent = `₱${totalAmount.toLocaleString()}`;
}

btnConfirmBooking.addEventListener("click", function() {
	isValid = verifyForm();
	if (!isValid) {
		return;
	}
	renderBookingSummary();
	openSummaryModal();
});

btnSummaryModalClose.addEventListener("click", closeSummaryModal);
btnSummaryCancel.addEventListener("click", closeSummaryModal);
btnSummaryConfirm.addEventListener("click", submitForm);


// This file handles form submission only. The boarding date-range UI and validation
// are managed in /js/boarding_date_range.js so the start and end selections remain separate.
const resetCalendarSelection = function() {
	if (window.resetBoardingDateRange && typeof window.resetBoardingDateRange === "function") {
		window.resetBoardingDateRange();
	}

	const startError = document.getElementById("start-appointment-error");
	const endError = document.getElementById("end-appointment-error");
	if (startError) startError.style.display = "none";
	if (endError) endError.style.display = "none";
};