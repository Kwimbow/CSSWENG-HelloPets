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
        elem.textContent = value;
    }
};

fetchData();