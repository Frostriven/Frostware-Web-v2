// Remember Me functionality utility

const REMEMBER_KEY = 'rememberMe';
const SAVED_EMAIL_KEY = 'savedEmail';

// Save user credentials if remember me is checked
export function saveCredentials(email, remember) {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, 'true');
    localStorage.setItem(SAVED_EMAIL_KEY, email);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(SAVED_EMAIL_KEY);
  }
}

// Get saved credentials
export function getSavedCredentials() {
  const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
  const email = localStorage.getItem(SAVED_EMAIL_KEY) || '';
  return { remember, email };
}

// Clear saved credentials
export function clearSavedCredentials() {
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(SAVED_EMAIL_KEY);
}

// Initialize login form with saved credentials
export function initializeRememberMe(emailInput, rememberCheckbox) {
  const { remember, email } = getSavedCredentials();

  if (emailInput && email) {
    emailInput.value = email;
  }

  if (rememberCheckbox) {
    rememberCheckbox.checked = remember;
  }
}