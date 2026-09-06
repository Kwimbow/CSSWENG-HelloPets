const saveChangesButton = document.getElementById("save-changes");

// maps each pricing id to its key in the pricing db
const pricingFieldMap = [
    ["price-dog-essential-bath-S", "dog:essential-bath:S"],
    ["price-dog-essential-bath-M", "dog:essential-bath:M"],
    ["price-dog-essential-bath-L", "dog:essential-bath:L"],
    ["price-dog-essential-bath-XL", "dog:essential-bath:XL"],
    ["price-dog-essential-bath-XXL", "dog:essential-bath:XXL"],

    ["price-dog-premium-bath-S", "dog:premium-bath:S"],
    ["price-dog-premium-bath-M", "dog:premium-bath:M"],
    ["price-dog-premium-bath-L", "dog:premium-bath:L"],
    ["price-dog-premium-bath-XL", "dog:premium-bath:XL"],
    ["price-dog-premium-bath-XXL", "dog:premium-bath:XXL"],

    ["price-dog-classic-grooming-S", "dog:classic-grooming:S"],
    ["price-dog-classic-grooming-M", "dog:classic-grooming:M"],
    ["price-dog-classic-grooming-L", "dog:classic-grooming:L"],
    ["price-dog-classic-grooming-XL", "dog:classic-grooming:XL"],
    ["price-dog-classic-grooming-XXL", "dog:classic-grooming:XXL"],

    ["price-dog-luxe-grooming-S", "dog:luxe-grooming:S"],
    ["price-dog-luxe-grooming-M", "dog:luxe-grooming:M"],
    ["price-dog-luxe-grooming-L", "dog:luxe-grooming:L"],
    ["price-dog-luxe-grooming-XL", "dog:luxe-grooming:XL"],
    ["price-dog-luxe-grooming-XXL", "dog:luxe-grooming:XXL"],

    ["price-dog-special-cut-S", "dog:special-cut:S"],
    ["price-dog-special-cut-M", "dog:special-cut:M"],
    ["price-dog-special-cut-L", "dog:special-cut:L"],
    ["price-dog-special-cut-XL", "dog:special-cut:XL"],
    ["price-dog-special-cut-XXL", "dog:special-cut:XXL"],

    ["price-cat-kitty-grooming", "cat:kitty-grooming"],
    ["price-cat-kitty-special-cut", "cat:kitty-special-cut"],

    ["price-addon-light", "addon:light"],
    ["price-addon-medium", "addon:medium"],
    ["price-addon-heavy", "addon:heavy"],

    ["price-alac-face-trim", "alac:face-trim"],
    ["price-alac-poodle-feet", "alac:poodle-feet"],
    ["price-alac-nail-trim", "alac:nail-trim"],
    ["price-alac-ear-clean", "alac:ear-clean"],
    ["price-alac-teeth-brushing", "alac:teeth-brushing"],
    ["price-alac-anal-sac-draining", "alac:anal-sac-draining"],
    ["price-alac-cologne", "alac:cologne"],

    ["price-boarding-S", "boarding:S"],
    ["price-boarding-M", "boarding:M"],
    ["price-boarding-L", "boarding:L"],
    ["price-boarding-XL", "boarding:XL"],
    ["price-boarding-XXL", "boarding:XXL"],
];

// getting existing prices from server
{
    const fetchPricing = async () => {
        const response = await fetch("/api/pricing");

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const { pricing } = await response.json();

        for (const [elementId, key] of pricingFieldMap) {
            const elem = document.getElementById(elementId);
            if (elem && Object.hasOwn(pricing, key)) {
                elem.value = pricing[key];
            }
        }
    };

    fetchPricing();
}

/* SENDING DATA TO SERVER */
{
    const submitForm = async () => {
        const payload = {};

        for (const [elementId, key] of pricingFieldMap) {
            const elem = document.getElementById(elementId);
            if (elem && elem.value !== "") {
                payload[key] = elem.value;
            }
        }

        let success = false;

        const response = await fetch("/admin/pricing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const message = await response.json();
            if (message.success) {
                success = true;
            }
        }

        if (success) {
            alert("Your changes have been saved successfully.");
        } else {
            alert("Something went wrong.");
        }
    };

    saveChangesButton.addEventListener("click", submitForm);
}