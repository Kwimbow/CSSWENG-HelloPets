// rads --> group of radio buttons
// chks --> group of checkboxes
radsPetSelection = document.getElementsByName("pet-selection"); // dog or cat
inpPetName = document.getElementById("pet-name");
inpPetWeight = document.getElementById("pet-weight");
inpPetBreed = document.getElementById("pet-breed");
radsSelectedService = document.getElementsByName("pet-service");
// checkboxes for add-ons (dematting, deshedding)
chksAddOn = document.querySelectorAll(".addon-list input");
// checkboxes for a la carte services
chksALaCarte = document.querySelectorAll(".alac-list input");
inpFirstName = document.getElementById("first-name");
inpLastName = document.getElementById("last-name");
inpEmail = document.getElementById("email");
inpMobileNumber = document.getElementById("mobile");
inpNotes = document.getElementById("optional-notes");
btnConfirmBooking = document.getElementById("confirm-booking"); // actually a span

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

// clearing/resetting the form after submitting
const clearForm = function() {
    for (const btn of allTextInputs) {
        btn.value = "";
    }

    for (const btn of allCheckboxInputs) {
        btn.checked = false;
    }

    // checking the default option for radio buttons
    checkRadioButton(radsPetSelection, "dog")
    checkRadioButton(radsSelectedService, "essential-bath");
}

const submitForm = async function() {
    isValid = verifyForm();
    if (!isValid) {
        return;
    }

    payloadObj = {
        "petSelection": getRadioButtonsValue(radsPetSelection),
        "petName": inpPetName.value,
        "petWeight": inpPetWeight.value,
        "petBreed": inpPetBreed.value,
        "selectedService": getRadioButtonsValue(radsSelectedService),
        "addOnServices": getCheckboxesValue(chksAddOn),
        "aLaCarteServices": getCheckboxesValue(chksALaCarte),
        "firstName": inpFirstName.value,
        "lastName": inpLastName.value,
        "email": inpEmail.value,
        "mobileNumber": inpMobileNumber.value,
        "optionalNotes": inpNotes.value
    };

    const response = await fetch("/submit-booking", {
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
    } else {
        alert("There was an error submitting the form.");
    }
}

btnConfirmBooking.addEventListener("click", submitForm);