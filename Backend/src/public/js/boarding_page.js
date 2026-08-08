// rads --> group of radio buttons
// chks --> group of checkboxes
radsPetSelection = document.getElementsByName("pet-selection"); // dog or cat

// STEP 3 PET INFO (Dogs)
inpPetName = document.getElementById("pet-name");
inpPetWeight = document.getElementById("pet-weight");
inpPetBreed = document.getElementById("pet-breed");

// STEPm 3 PET INFO (cats)
inpPetNameCat = document.getElementById("pet-name-cat");
inpPetWeightCat = document.getElementById("pet-weight-cat");

// STEP 4 SELECTED SERVICE (Dog layout 5 options, cat 2)
radsSelectedService = document.getElementsByName("pet-service");
radsSelectedServiceCat = document.getElementsByName("pet-service-cat");

// STEP 5-6
// checkboxes for add-ons (dematting, deshedding)
chksAddOn = document.querySelectorAll(".addon-list input");
// checkboxes for a la carte services
chksALaCarte = document.querySelectorAll(".alac-list input");

// STEP 7 CUSTOMER INFO
inpFirstName = document.getElementById("first-name");
inpLastName = document.getElementById("last-name");
inpEmail = document.getElementById("email");
inpMobileNumber = document.getElementById("mobile");
inpNotes = document.getElementById("optional-notes");

btnConfirmBooking = document.getElementById("confirm-booking"); // actually a span

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
	checkRadioButton(radsSelectedService, "essential-bath");
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
		return;
	}

	payloadObj = buildBookingObj();

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
		clearForm();
		goBackHome();
	} else {
		alert("There was an error submitting the form.");
	}
}

btnConfirmBooking.addEventListener("click", submitForm);


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