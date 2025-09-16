export const flags = {
  es: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16">
    <rect width="24" height="16" fill="#c60b1e"/>
    <rect width="24" height="11" y="2.5" fill="#ffc400"/>
    <rect width="24" height="5" fill="#c60b1e"/>
  </svg>`,

  en: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16">
    <rect width="24" height="16" fill="#012169"/>
    <path d="M0 0l24 16M24 0l-24 16" stroke="#fff" stroke-width="2"/>
    <path d="M12 0v16M0 8h24" stroke="#fff" stroke-width="3"/>
    <path d="M12 0v16M0 8h24" stroke="#c8102e" stroke-width="1.5"/>
  </svg>`
};

export const getFlagSVG = (language) => {
  return flags[language] || flags.es;
};