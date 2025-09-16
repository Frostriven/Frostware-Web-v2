// Global countries configuration and utilities
export const countries = [
  { code: '', name: 'Selecciona tu país' },
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Perú' },
  { code: 'CL', name: 'Chile' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panamá' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'CU', name: 'Cuba' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CA', name: 'Canadá' },
  { code: 'BR', name: 'Brasil' },
  { code: 'OTHER', name: 'Otro' }
];

// Store and retrieve selected country globally
export function setGlobalCountry(countryCode) {
  localStorage.setItem('selectedCountry', countryCode);
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('countryChanged', { detail: countryCode }));
}

export function getGlobalCountry() {
  return localStorage.getItem('selectedCountry') || '';
}

// Populate a select element with countries
export function populateCountrySelect(selectElement, selectedCountry = null) {
  if (!selectElement) return;

  const currentCountry = selectedCountry || getGlobalCountry();

  selectElement.innerHTML = countries.map(country =>
    `<option value="${country.code}" ${country.code === currentCountry ? 'selected' : ''}>
      ${country.name}
    </option>`
  ).join('');
}

// Initialize country selection for forms
export function initializeCountrySelect(selectElement) {
  if (!selectElement) return;

  populateCountrySelect(selectElement);

  selectElement.addEventListener('change', (e) => {
    setGlobalCountry(e.target.value);
  });

  // Listen for global country changes
  window.addEventListener('countryChanged', (e) => {
    if (selectElement.value !== e.detail) {
      selectElement.value = e.detail;
    }
  });
}

// Get country name by code
export function getCountryName(countryCode) {
  const country = countries.find(c => c.code === countryCode);
  return country ? country.name : countryCode;
}