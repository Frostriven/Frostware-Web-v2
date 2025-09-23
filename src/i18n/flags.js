export const flags = {
  es: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16">
    <rect width="24" height="16" fill="#c60b1e"/>
    <rect width="24" height="11" y="2.5" fill="#ffc400"/>
    <rect width="24" height="5" fill="#c60b1e"/>
  </svg>`,

  en: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16">
    <rect width="24" height="16" fill="#B22234"/>
    <rect width="24" height="1.23" y="1.23" fill="#fff"/>
    <rect width="24" height="1.23" y="3.69" fill="#fff"/>
    <rect width="24" height="1.23" y="6.15" fill="#fff"/>
    <rect width="24" height="1.23" y="8.62" fill="#fff"/>
    <rect width="24" height="1.23" y="11.08" fill="#fff"/>
    <rect width="24" height="1.23" y="13.54" fill="#fff"/>
    <rect width="9.6" height="8.62" fill="#3C3B6E"/>
    <g fill="#fff">
      <circle r="0.3" cx="1.2" cy="1.2"/>
      <circle r="0.3" cx="2.4" cy="1.2"/>
      <circle r="0.3" cx="3.6" cy="1.2"/>
      <circle r="0.3" cx="4.8" cy="1.2"/>
      <circle r="0.3" cx="6" cy="1.2"/>
      <circle r="0.3" cx="7.2" cy="1.2"/>
      <circle r="0.3" cx="8.4" cy="1.2"/>
      <circle r="0.3" cx="1.8" cy="2.4"/>
      <circle r="0.3" cx="3" cy="2.4"/>
      <circle r="0.3" cx="4.2" cy="2.4"/>
      <circle r="0.3" cx="5.4" cy="2.4"/>
      <circle r="0.3" cx="6.6" cy="2.4"/>
      <circle r="0.3" cx="7.8" cy="2.4"/>
      <circle r="0.3" cx="1.2" cy="3.6"/>
      <circle r="0.3" cx="2.4" cy="3.6"/>
      <circle r="0.3" cx="3.6" cy="3.6"/>
      <circle r="0.3" cx="4.8" cy="3.6"/>
      <circle r="0.3" cx="6" cy="3.6"/>
      <circle r="0.3" cx="7.2" cy="3.6"/>
      <circle r="0.3" cx="8.4" cy="3.6"/>
      <circle r="0.3" cx="1.8" cy="4.8"/>
      <circle r="0.3" cx="3" cy="4.8"/>
      <circle r="0.3" cx="4.2" cy="4.8"/>
      <circle r="0.3" cx="5.4" cy="4.8"/>
      <circle r="0.3" cx="6.6" cy="4.8"/>
      <circle r="0.3" cx="7.8" cy="4.8"/>
      <circle r="0.3" cx="1.2" cy="6"/>
      <circle r="0.3" cx="2.4" cy="6"/>
      <circle r="0.3" cx="3.6" cy="6"/>
      <circle r="0.3" cx="4.8" cy="6"/>
      <circle r="0.3" cx="6" cy="6"/>
      <circle r="0.3" cx="7.2" cy="6"/>
      <circle r="0.3" cx="8.4" cy="6"/>
      <circle r="0.3" cx="1.8" cy="7.2"/>
      <circle r="0.3" cx="3" cy="7.2"/>
      <circle r="0.3" cx="4.2" cy="7.2"/>
      <circle r="0.3" cx="5.4" cy="7.2"/>
      <circle r="0.3" cx="6.6" cy="7.2"/>
      <circle r="0.3" cx="7.8" cy="7.2"/>
      <circle r="0.3" cx="1.2" cy="8.4"/>
      <circle r="0.3" cx="2.4" cy="8.4"/>
      <circle r="0.3" cx="3.6" cy="8.4"/>
      <circle r="0.3" cx="4.8" cy="8.4"/>
      <circle r="0.3" cx="6" cy="8.4"/>
      <circle r="0.3" cx="7.2" cy="8.4"/>
      <circle r="0.3" cx="8.4" cy="8.4"/>
    </g>
  </svg>`
};

export const getFlagSVG = (language) => {
  return flags[language] || flags.es;
};