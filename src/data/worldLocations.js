import { Country, State } from 'country-state-city';

const AFRICAN_COUNTRY_CODES = [
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG',
  'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN',
  'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ',
  'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD',
  'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW',
];

const allCountries = Country.getAllCountries();

export const WORLD_COUNTRIES = allCountries
  .map((country) => ({ code: country.isoCode, label: country.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const AFRICAN_COUNTRIES = AFRICAN_COUNTRY_CODES
  .map((code) => WORLD_COUNTRIES.find((country) => country.code === code))
  .filter(Boolean)
  .sort((a, b) => a.label.localeCompare(b.label));

export const getSubdivisionsForCountry = (countryCode) =>
  State.getStatesOfCountry(countryCode)
    .map((state) => ({ value: state.name, label: state.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const getCountryName = (code) =>
  WORLD_COUNTRIES.find((country) => country.code === code)?.label || code;
