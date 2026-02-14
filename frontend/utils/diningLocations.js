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

// ── All Purdue (HFS) sub-categories ──
export const ALL_PURDUE_CATEGORIES = [
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

// ── Purdue Food Co (retail dining) ──
export const FOOD_CO_LOCATIONS = [
  // Atlas Family Marketplace sub-restaurants
  { id: '47988', name: 'Burgers + Fries' },
  { id: '89899', name: 'Choolaah Indian BBQ' },
  { id: '37757', name: 'DSJ Asian Grill' },
  { id: '47986', name: 'FoodLab' },
  { id: '15087', name: 'Sushi Boss @ PMU' },
  { id: '37761', name: 'Tenders, Love & Chicken' },
  { id: '15089', name: "Walk On's Sports Bistreaux" },
  { id: '15091', name: 'Zen' },
  // Other Purdue Food Co locations
  { id: '87119', name: 'Boilermaker Market @ Burton-Morgan' },
  { id: '90976', name: 'Boilermaker Market @ Dudley' },
  { id: '14432', name: 'Boilermaker Market - Harrison' },
  { id: '16595', name: 'Boilermaker Market @ Niswonger Hall' },
  { id: '14434', name: 'Boilermaker Market - 3rd Street' },
  { id: '14441', name: 'Catalyst Café' },
  { id: '90977', name: 'Centennial Station' },
  { id: '14439', name: 'Continuum Café' },
  { id: '14601', name: "Famous Frank's @ Cary Knight Spot" },
  { id: '14425', name: 'Freshens Fresh Food Studio' },
  { id: '83773', name: 'Java House' },
  { id: '92017', name: 'KNOW Eatery' },
  { id: '14438', name: 'Shenye @ Harrison Grill' },
  { id: '14426', name: "Jersey Mike's" },
  { id: '14423', name: 'Panera' },
  { id: '14424', name: 'Qdoba' },
  { id: '84743', name: 'Saxbys' },
  { id: '14421', name: 'Starbucks @ MSEE' },
  { id: '14435', name: 'Starbucks @ Winifred Parker Hall' },
];

// Backwards compat
export const LOCATION_CATEGORIES = ALL_PURDUE_CATEGORIES;
