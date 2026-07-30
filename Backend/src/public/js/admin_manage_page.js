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