const fpImgInput = document.getElementById("featured-pet-img-input");
const fpNameBreed = document.getElementById("featured-pet-name-breed");
const fpDescription = document.getElementById("featured-pet-description");
const videoImgInput1 = document.getElementById("video-img-input-1");
const videoImgInput2 = document.getElementById("video-img-input-2");
const videoImgInput3 = document.getElementById("video-img-input-3");
const videoText1 = document.getElementById("video-text-1");
const videoText2 = document.getElementById("video-text-2");
const videoText3 = document.getElementById("video-text-3");
const contactAddress = document.getElementById("contact-address");
const contactPhone = document.getElementById("contact-phone");
const saveChangesButton = document.getElementById("save-changes");

// braces are for preventing name collision between variables (due to block scope)
// getting existing data from server
{
    const fetchData = async () => {
        const response = await fetch("/landing-page-edits");

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const { media, text } = await response.json();

        for (const [key, value] of Object.entries(media)) {
            const elem = document.getElementById(key);
            elem.src = value;
        }

        for (const [key, value] of Object.entries(text)) {
            const elem = document.getElementById(key);
            elem.value = value;
        }
    };

    fetchData();
}

{
    const featuredFileInput = document.getElementById('featured-pet-img-input');
    const displayImage = document.getElementById('featured-pet-img');

    featuredFileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                displayImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    const videoInputs = [
        document.getElementById('video-img-input-1'),
        document.getElementById('video-img-input-2'),
        document.getElementById('video-img-input-3')
    ];

    const videoPreviews = [
        document.getElementById('video-img-1'),
        document.getElementById('video-img-2'),
        document.getElementById('video-img-3')
    ];

    videoInputs.forEach((input, index) => {
        input.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    videoPreviews[index].src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    });

    const maxChars = 20;
    const textareas = document.querySelectorAll('.video-text');
    textareas.forEach((textarea) => {
        textarea.addEventListener('input', function() {
            if (textarea.value.length > maxChars) {
                textarea.value = textarea.value.slice(0, maxChars);
            }
        });
    });

    const autoResizeTextareas = document.querySelectorAll('.video-container .video-text');
    function resizeTextarea(textarea){
        textarea.style.height = '5rem';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
    autoResizeTextareas.forEach((textarea) => {
        resizeTextarea(textarea);
        textarea.addEventListener('input', () => resizeTextarea(textarea));
    });
}

/* SENDING DATA TO SERVER */
{
    const submitForm = async () => {
        const formData = new FormData();

        formData.append("fpImgInput", fpImgInput.files[0]);
        formData.append("fpNameBreed", fpNameBreed.value);
        formData.append("fpDescription", fpDescription.value);
        formData.append("videoImgInput1", videoImgInput1.files[0]);
        formData.append("videoImgInput2", videoImgInput2.files[0]);
        formData.append("videoImgInput3", videoImgInput3.files[0]);
        formData.append("videoText1", videoText1.value);
        formData.append("videoText2", videoText2.value);
        formData.append("videoText3", videoText3.value);
        formData.append("contactAddress", contactAddress.value);
        formData.append("contactPhone", contactPhone.value);

        let success = false;
        let errorMessages = [];

        const response = await fetch("/admin/manage_page", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const message = await response.json();
            if (message.success) {
                success = true;
            } else if (Array.isArray(message.errors)) {
                errorMessages = message.errors;
            }
        }

        if (success) {
            alert("Your changes have been saved successfully.");
        } else if (errorMessages.length > 0) {
            alert("Some changes could not be saved:\n" + errorMessages.join("\n"));
        } else {
            alert("Something went wrong.");
        }
    };
    
    saveChangesButton.addEventListener("click", submitForm);
}