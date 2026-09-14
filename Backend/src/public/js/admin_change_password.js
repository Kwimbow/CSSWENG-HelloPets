const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");
const confirmNewPasswordInput = document.getElementById("confirm-new-password");
const changePasswordBtn = document.getElementById("change-password-btn");
const messageEl = document.getElementById("password-change-message");

const openModalBtn = document.getElementById("open-password-modal-btn");
const modalOverlay = document.getElementById("password-modal-overlay");
const modalCloseBtn = document.getElementById("password-modal-close");
const modalCancelBtn = document.getElementById("password-modal-cancel-btn");

const showMessage = (text, isError) => {
    messageEl.textContent = text;
    messageEl.classList.toggle("error", isError);
    messageEl.classList.toggle("success", !isError);
};

const clearForm = () => {
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmNewPasswordInput.value = "";
    messageEl.textContent = "";
    messageEl.classList.remove("error", "success");
};

const openModal = () => {
    clearForm();
    modalOverlay.classList.add("visible");
};

const closeModal = () => {
    modalOverlay.classList.remove("visible");
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

openModalBtn.addEventListener("click", openModal);
modalCloseBtn.addEventListener("click", closeModal);
modalCancelBtn.addEventListener("click", closeModal);
changePasswordBtn.addEventListener("click", submitPasswordChange);

const openMailerModalBtn = document.getElementById("open-mailer-modal-btn");
const mailerModalOverlay = document.getElementById("mailer-modal-overlay");
const mailerModalCloseBtn = document.getElementById("mailer-modal-close");
const mailerModalCancelBtn = document.getElementById("mailer-modal-cancel-btn");
const saveMailerBtn = document.getElementById("save-mailer-btn");
const mailerGmailUserInput = document.getElementById("mailer-gmail-user");
const mailerGmailAppPasswordInput = document.getElementById("mailer-gmail-app-password");
const mailerMessageEl = document.getElementById("mailer-change-message");
const mailerStatusText = document.getElementById("mailer-status-text");

const showMailerMessage = (text, isError) => {
    mailerMessageEl.textContent = text;
    mailerMessageEl.classList.toggle("error", isError);
    mailerMessageEl.classList.toggle("success", !isError);
};

const loadMailerStatus = async () => {
    try {
        const response = await fetch("/admin/mailer-credentials");
        const result = await response.json();
        if (result.gmailUser) {
            mailerStatusText.textContent = `Currently sending from: ${result.gmailUser}`;
            mailerGmailUserInput.value = result.gmailUser;
        } else {
            mailerStatusText.textContent = "Not set up yet - confirmation emails won't send until this is configured.";
        }
    } catch (error) {
        mailerStatusText.textContent = "Could not load mailer status.";
    }
};

loadMailerStatus();

const openMailerModal = () => {
    mailerGmailAppPasswordInput.value = "";
    mailerMessageEl.textContent = "";
    mailerMessageEl.classList.remove("error", "success");
    mailerModalOverlay.classList.add("visible");
};

const closeMailerModal = () => {
    mailerModalOverlay.classList.remove("visible");
};

const submitMailerCredentials = async () => {
    const gmailUser = mailerGmailUserInput.value.trim();
    const gmailAppPassword = mailerGmailAppPasswordInput.value;

    if (!gmailUser || !gmailAppPassword) {
        showMailerMessage("Both fields are required.", true);
        return;
    }

    const response = await fetch("/admin/mailer-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailUser, gmailAppPassword })
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok && result.success) {
        showMailerMessage("Mailer settings updated successfully.", false);
        mailerGmailAppPasswordInput.value = "";
        loadMailerStatus();
    } else {
        showMailerMessage(result.error || "Something went wrong.", true);
    }
};

openMailerModalBtn.addEventListener("click", openMailerModal);
mailerModalCloseBtn.addEventListener("click", closeMailerModal);
mailerModalCancelBtn.addEventListener("click", closeMailerModal);
saveMailerBtn.addEventListener("click", submitMailerCredentials);