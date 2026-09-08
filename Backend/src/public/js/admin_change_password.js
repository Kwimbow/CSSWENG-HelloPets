const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");
const confirmNewPasswordInput = document.getElementById("confirm-new-password");
const changePasswordBtn = document.getElementById("change-password-btn");
const messageEl = document.getElementById("password-change-message");

const showMessage = (text, isError) => {
    messageEl.textContent = text;
    messageEl.classList.toggle("error", isError);
    messageEl.classList.toggle("success", !isError);
};

const submitPasswordChange = async () => {
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showMessage("Please fill in all three fields.", true);
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showMessage("New password and confirmation do not match.", true);
        return;
    }

    if (newPassword.length < 6) {
        showMessage("New password must be at least 6 characters.", true);
        return;
    }

    const response = await fetch("/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok && result.success) {
        showMessage("Password updated successfully.", false);
        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmNewPasswordInput.value = "";
    } else {
        showMessage(result.error || "Something went wrong.", true);
    }
};

changePasswordBtn.addEventListener("click", submitPasswordChange);