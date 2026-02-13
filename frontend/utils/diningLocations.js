export const DINING_LOCATIONS = [
  { code: 'ERHT', api_name: 'Earhart', display_name: 'Earhart' },
  { code: 'FORD', api_name: 'Ford', display_name: 'Ford' },
  { code: 'HILL', api_name: 'Hillenbrand', display_name: 'Hillenbrand' },
  { code: 'WILY', api_name: 'Wiley', display_name: 'Wiley' },
  { code: 'WIND', api_name: 'Windsor', display_name: 'Windsor' },
  { code: 'BOWL', api_name: '1bowl at Meredith Hall', display_name: '1bowl at Meredith Hall' },
  { code: 'PZZA', api_name: "Pete's Za at Tarkington Hall", display_name: "Pete's Za at Tarkington Hall" },
  { code: '@TGP', api_name: 'Sushi Boss at Meredith Hall', display_name: 'Sushi Boss at Meredith Hall' },
  { code: 'EOTG', api_name: 'Earhart On-the-GO!', display_name: 'Earhart On-the-GO!' },
  { code: 'FOTG', api_name: 'Ford On-the-GO!', display_name: 'Ford On-the-GO!' },
  { code: 'LWSN', api_name: 'Lawson On-the-GO!', display_name: 'Lawson On-the-GO!' },
  { code: 'WOTG', api_name: 'Windsor On-the-GO!', display_name: 'Windsor On-the-GO!' }
];

// Location categories for grouped dropdown
export const LOCATION_CATEGORIES = [
  {
    label: 'Dining Courts',
    locations: ['Earhart', 'Ford', 'Hillenbrand', 'Wiley', 'Windsor'],
  },
  {
    label: 'Quick Bites',
    locations: ['1bowl at Meredith Hall', "Pete's Za at Tarkington Hall", 'Sushi Boss at Meredith Hall'],
  },
  {
    label: 'On-the-GO!',
    locations: ['Earhart On-the-GO!', 'Ford On-the-GO!', 'Lawson On-the-GO!', 'Windsor On-the-GO!'],
  },
];
