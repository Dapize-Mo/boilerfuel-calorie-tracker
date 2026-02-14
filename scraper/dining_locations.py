"""Shared listing of Purdue dining locations used by the scraper and verification scripts."""

# ── All Purdue (HFS residential dining) ──
DINING_LOCATIONS = [
    {"code": "ERHT", "api_name": "Earhart", "display_name": "Earhart"},
    {"code": "FORD", "api_name": "Ford", "display_name": "Ford"},
    {"code": "HILL", "api_name": "Hillenbrand", "display_name": "Hillenbrand"},
    {"code": "WILY", "api_name": "Wiley", "display_name": "Wiley"},
    {"code": "WIND", "api_name": "Windsor", "display_name": "Windsor"},
    {"code": "BOWL", "api_name": "1bowl at Meredith Hall", "display_name": "1bowl at Meredith Hall"},
    {"code": "PZZA", "api_name": "Pete's Za at Tarkington Hall", "display_name": "Pete's Za at Tarkington Hall"},
    {"code": "@TGP", "api_name": "Sushi Boss at Meredith Hall", "display_name": "Sushi Boss at Meredith Hall"},
    {"code": "EOTG", "api_name": "Earhart On-the-GO!", "display_name": "Earhart On-the-GO!"},
    {"code": "FOTG", "api_name": "Ford On-the-GO!", "display_name": "Ford On-the-GO!"},
    {"code": "LWSN", "api_name": "Lawson On-the-GO!", "display_name": "Lawson On-the-GO!"},
    {"code": "WOTG", "api_name": "Windsor On-the-GO!", "display_name": "Windsor On-the-GO!"},
]

# ── Purdue Food Co (retail dining via CampusDish) ──
# has_nutrition: True = Complete nutritional data available
# has_nutrition: False = Placeholder data only (calories=0 or incomplete)
RETAIL_LOCATIONS = [
    {"id": "15093", "name": "Atlas Family Marketplace", "has_nutrition": False},
    {"id": "87119", "name": "Boilermaker Market @ Burton-Morgan", "has_nutrition": False},
    {"id": "90976", "name": "Boilermaker Market @ Dudley", "has_nutrition": False},
    {"id": "14432", "name": "Boilermaker Market - Harrison", "has_nutrition": False},
    {"id": "16595", "name": "Boilermaker Market @ Niswonger Hall", "has_nutrition": False},
    {"id": "14434", "name": "Boilermaker Market - 3rd Street", "has_nutrition": False},
    {"id": "14601", "name": "Famous Frank's @ Cary Knight Spot", "has_nutrition": False},
    {"id": "14441", "name": "Catalyst Café", "has_nutrition": False},
    {"id": "90977", "name": "Centennial Station", "has_nutrition": False},  # Items without calories
    {"id": "14439", "name": "Continuum Café", "has_nutrition": False},
    {"id": "83773", "name": "Java House", "has_nutrition": False},
    {"id": "92017", "name": "KNOW Eatery", "has_nutrition": False},
    {"id": "14425", "name": "Freshens Fresh Food Studio", "has_nutrition": True},  # Partial data
    {"id": "14438", "name": "Shenye @ Harrison Grill", "has_nutrition": False},
    {"id": "14426", "name": "Jersey Mike's", "has_nutrition": True},  # Chain data added
    {"id": "14423", "name": "Panera", "has_nutrition": True},  # Chain data added
    {"id": "14424", "name": "Qdoba", "has_nutrition": True},  # Chain data added
    {"id": "84743", "name": "Saxbys", "has_nutrition": False},
    {"id": "14421", "name": "Starbucks @ MSEE", "has_nutrition": True},  # Chain data added
    {"id": "14435", "name": "Starbucks @ Winifred Parker Hall", "has_nutrition": True},  # Chain data added
]

# Special locations with complete nutrition data
FOOD_CO_COMPLETE_NUTRITION = [
    "Walk On's Sports Bistreaux",  # Complete data in seed
    "Panera",  # Chain restaurant data
    "Qdoba",  # Chain restaurant data
    "Jersey Mike's",  # Chain restaurant data
    "Starbucks @ MSEE",  # Chain restaurant data
    "Starbucks @ Winifred Parker Hall",  # Chain restaurant data
    "Freshens Fresh Food Studio",  # Partial data
]
