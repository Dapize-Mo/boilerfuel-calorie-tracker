-- Retail menu seed data for Purdue Food Co locations
-- These are static menus (not date-specific) stored with source='retail'
-- Menu date uses sentinel value '2099-01-01' to distinguish from daily API menus

-- Clean up any existing retail data before re-seeding
DELETE FROM menu_snapshots WHERE source = 'retail';

-- ============================================================================
-- WALK ON'S SPORTS BISTREAUX (Atlas Family Marketplace)
-- Source: Campus menu PDF with calorie data
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
-- Starters
('2099-01-01', 'Boneless Wings (14)', 975, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Starters', 'Lunch', 'retail'),
('2099-01-01', 'Bone-In Wings (6 Piece)', 660, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Starters', 'Lunch', 'retail'),
('2099-01-01', 'Bone-In Wings (12 Piece)', 1320, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Starters', 'Lunch', 'retail'),
('2099-01-01', 'Waffle Cheese Fries (Full)', 2200, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Starters', 'Lunch', 'retail'),
('2099-01-01', 'Waffle Cheese Fries (Half)', 1210, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Starters', 'Lunch', 'retail'),
('2099-01-01', 'Pepper Jack Boudin', 900, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Starters', 'Lunch', 'retail'),
('2099-01-01', 'Spinach & Artichoke Dip', 1590, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Starters', 'Lunch', 'retail'),
('2099-01-01', 'Boom Boom Shrimp', 680, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Starters', 'Lunch', 'retail'),
('2099-01-01', 'Mozzarella Logs', 1100, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Starters', 'Lunch', 'retail'),

-- Cajun Classics
('2099-01-01', 'Crawfish Etouffee (Cup)', 185, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Cajun Classics', 'Lunch', 'retail'),
('2099-01-01', 'Crawfish Etouffee (Bowl)', 370, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Cajun Classics', 'Lunch', 'retail'),
('2099-01-01', 'Chicken & Sausage Gumbo (Cup)', 185, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Cajun Classics', 'Lunch', 'retail'),
('2099-01-01', 'Chicken & Sausage Gumbo (Bowl)', 370, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Cajun Classics', 'Lunch', 'retail'),
('2099-01-01', 'Cup & Side Salad', 270, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Cajun Classics', 'Lunch', 'retail'),

-- Salads
('2099-01-01', 'Cypress Cobb Salad', 900, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Salads', 'Lunch', 'retail'),
('2099-01-01', 'Caesar Salad', 300, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Salads', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Berry Pecan Salad', 570, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Salads', 'Lunch', 'retail'),

-- Signature Entrees
('2099-01-01', 'Pasta Alfredo', 930, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Signature Entrees', 'Lunch', 'retail'),
('2099-01-01', 'Uncle B''s Chicken Tenders (5)', 1270, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Signature Entrees', 'Lunch', 'retail'),
('2099-01-01', 'Lemon Butter Chicken', 1330, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Signature Entrees', 'Lunch', 'retail'),

-- Wraps
('2099-01-01', 'Cali Wrap', 1380, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Wraps', 'Lunch', 'retail'),
('2099-01-01', 'Buffalo Chicken Wrap', 1100, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Wraps', 'Lunch', 'retail'),
('2099-01-01', 'Caesar Wrap', 980, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Wraps', 'Lunch', 'retail'),

-- Sandwiches & Poboys
('2099-01-01', 'Sliders and Fries', 980, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Grown-Up Grilled Cheese', 1140, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Avocado Sandwich (Whole)', 1200, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Avocado Sandwich (Half)', 600, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Buffalo Chicken Sandwich (Whole)', 1150, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Buffalo Chicken Sandwich (Half)', 575, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Warm Turkey Melt', 1250, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Black Jack Chicken Sandwich (Whole)', 1210, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Black Jack Chicken Sandwich (Half)', 605, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Shrimp Poboy (Whole)', 1150, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Shrimp Poboy (Half)', 570, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Boom Boom Shrimp Poboy (Whole)', 1340, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Boom Boom Shrimp Poboy (Half)', 670, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sandwiches', 'Lunch', 'retail'),

-- Burgers
('2099-01-01', 'Scholarship Burger', 890, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Burgers', 'Lunch', 'retail'),
('2099-01-01', 'Hickory Burger', 1410, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Burgers', 'Lunch', 'retail'),
('2099-01-01', 'Double Bacon Cheese Burger', 1510, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Burgers', 'Lunch', 'retail'),
('2099-01-01', 'Jalapeno Jack Burger', 1400, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Burgers', 'Lunch', 'retail'),
('2099-01-01', 'Veggie Burger', 410, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Burgers', 'Lunch', 'retail'),

-- Seafood Specialties
('2099-01-01', 'Bayou Pasta', 1230, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Seafood', 'Lunch', 'retail'),
('2099-01-01', 'Catfish Orleans', 1200, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Seafood', 'Lunch', 'retail'),
('2099-01-01', 'Fried Catfish', 2210, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Seafood', 'Lunch', 'retail'),

-- Sides
('2099-01-01', 'Onion Rings', 670, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Waffle Fries', 480, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Hush Puppies', 360, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Side Salad', 70, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Cheddar Grits', 290, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Broccoli', 150, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Sides', 'Lunch', 'retail'),

-- Desserts
('2099-01-01', 'Beignet Bites', 760, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Desserts', 'Lunch', 'retail'),
('2099-01-01', 'Chocolate Chip Cookie Sundae', 1170, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Desserts', 'Lunch', 'retail'),
('2099-01-01', 'Pappy''s Shake', 580, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Desserts', 'Lunch', 'retail'),

-- Drinks
('2099-01-01', 'Raspberry Lemonade', 340, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),
('2099-01-01', 'Mad Mary', 300, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),
('2099-01-01', 'Blueberry Coconut Mojito', 210, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),
('2099-01-01', 'Tropical Rumbull', 140, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),
('2099-01-01', 'Pete''s Punch', 630, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),
('2099-01-01', 'Skinny Margarita', 180, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),
('2099-01-01', 'Spicy Jalapeno Margarita', 180, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),
('2099-01-01', 'Moonshine Swirl', 310, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),
('2099-01-01', 'Tennessee Mule', 240, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),
('2099-01-01', 'Top Shelf Margarita', 330, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),
('2099-01-01', 'Maker''s Old Fashioned', 230, '{"protein":0,"carbs":0,"fats":0}', 'Walk On''s Sports Bistreaux', 'Drinks', 'Lunch', 'retail'),

-- ============================================================================
-- CENTENNIAL STATION
-- Source: Campus menu PDF (no calorie data available, items + prices only)
-- ============================================================================

-- Breakfast
('2099-01-01', 'The Morning Express', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Breakfast', 'Breakfast', 'retail'),
('2099-01-01', 'Sunrise Special', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Breakfast', 'Breakfast', 'retail'),
('2099-01-01', 'Sunrise Special with Bacon', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Breakfast', 'Breakfast', 'retail'),
('2099-01-01', 'Sunrise Special with Sausage', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Breakfast', 'Breakfast', 'retail'),
('2099-01-01', 'Sunrise Special with Ham', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Breakfast', 'Breakfast', 'retail'),

-- Hot Signature Sandwiches
('2099-01-01', 'Pullman Stack', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Hot Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Roundhouse Melt', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Hot Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Double Bacon Boiler', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Hot Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Smokestack Veggie Burger', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Hot Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Old Gold Grilled Cheese', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Hot Sandwiches', 'Lunch', 'retail'),

-- Cold Signature Sandwiches
('2099-01-01', 'The Westbound Flyer', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Cold Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'The Conductor''s Club', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Cold Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'The Switch Track', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Cold Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'The Green Caboose', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Cold Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'The Golden Spike', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Cold Sandwiches', 'Lunch', 'retail'),

-- Coffee & Drinks
('2099-01-01', 'Caffe Latte', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Cappuccino', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Caffe Mocha', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Caramel Macchiato', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'White Chocolate Mocha', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Brown Sugar Shaken Espresso', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Chai Latte', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Hot Chocolate', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Frozen Caramel', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Frozen Mocha', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Smoothie', 0, '{"protein":0,"carbs":0,"fats":0}', 'Centennial Station', 'Coffee', 'Breakfast', 'retail'),

-- ============================================================================
-- FOODLAB (Atlas Family Marketplace)
-- Source: Campus menu PDF (no calorie data, items + prices only)
-- ============================================================================

('2099-01-01', 'Milkshake', 0, '{"protein":0,"carbs":0,"fats":0}', 'FoodLab', 'Ice Cream', 'Lunch', 'retail'),
('2099-01-01', 'Cookie Sandwich', 0, '{"protein":0,"carbs":0,"fats":0}', 'FoodLab', 'Ice Cream', 'Lunch', 'retail'),
('2099-01-01', 'Brownie Sundae', 0, '{"protein":0,"carbs":0,"fats":0}', 'FoodLab', 'Ice Cream', 'Lunch', 'retail'),
('2099-01-01', 'Ice Cream Float', 0, '{"protein":0,"carbs":0,"fats":0}', 'FoodLab', 'Ice Cream', 'Lunch', 'retail'),
('2099-01-01', 'Ice Cream (One Scoop)', 0, '{"protein":0,"carbs":0,"fats":0}', 'FoodLab', 'Ice Cream', 'Lunch', 'retail'),
('2099-01-01', 'Ice Cream (Two Scoops)', 0, '{"protein":0,"carbs":0,"fats":0}', 'FoodLab', 'Ice Cream', 'Lunch', 'retail'),
('2099-01-01', 'Sundae', 0, '{"protein":0,"carbs":0,"fats":0}', 'FoodLab', 'Ice Cream', 'Lunch', 'retail'),

-- ============================================================================
-- FRESHENS FRESH FOOD STUDIO
-- Source: freshens.com/nutrition (partial data - yogurt/shakes with calories)
-- ============================================================================

-- Frozen Yogurt & Shakes (with calorie data)
('2099-01-01', 'Fat Free Vanilla Yogurt (Small)', 190, '{"protein":7,"carbs":42,"fats":0}', 'Freshens Fresh Food Studio', 'Frozen Yogurt', 'Lunch', 'retail'),
('2099-01-01', 'Fat Free Vanilla Yogurt (Large)', 240, '{"protein":9,"carbs":54,"fats":0}', 'Freshens Fresh Food Studio', 'Frozen Yogurt', 'Lunch', 'retail'),
('2099-01-01', 'Cake Cone Vanilla', 160, '{"protein":5,"carbs":35,"fats":0}', 'Freshens Fresh Food Studio', 'Frozen Yogurt', 'Lunch', 'retail'),
('2099-01-01', 'Waffle Cone Vanilla', 250, '{"protein":8,"carbs":56,"fats":2}', 'Freshens Fresh Food Studio', 'Frozen Yogurt', 'Lunch', 'retail'),
('2099-01-01', 'Parfait with Granola', 400, '{"protein":12,"carbs":76,"fats":8}', 'Freshens Fresh Food Studio', 'Frozen Yogurt', 'Lunch', 'retail'),
('2099-01-01', 'Chocolate Milk Shake', 440, '{"protein":15,"carbs":95,"fats":3}', 'Freshens Fresh Food Studio', 'Shakes', 'Lunch', 'retail'),
('2099-01-01', 'Strawberry Milk Shake', 400, '{"protein":14,"carbs":86,"fats":2}', 'Freshens Fresh Food Studio', 'Shakes', 'Lunch', 'retail'),
('2099-01-01', 'Vanilla Milk Shake', 420, '{"protein":14,"carbs":91,"fats":2}', 'Freshens Fresh Food Studio', 'Shakes', 'Lunch', 'retail'),
('2099-01-01', 'Oreo Cream Milk Shake', 540, '{"protein":16,"carbs":110,"fats":7}', 'Freshens Fresh Food Studio', 'Shakes', 'Lunch', 'retail'),

-- FroYo Blasts (with calorie data)
('2099-01-01', 'FroYo Blast Cookie Dough', 490, '{"protein":11,"carbs":103,"fats":6}', 'Freshens Fresh Food Studio', 'FroYo Blasts', 'Lunch', 'retail'),
('2099-01-01', 'FroYo Blast Oreo Overload', 370, '{"protein":11,"carbs":78,"fats":5}', 'Freshens Fresh Food Studio', 'FroYo Blasts', 'Lunch', 'retail'),
('2099-01-01', 'FroYo Blast M&M''s', 460, '{"protein":11,"carbs":89,"fats":9}', 'Freshens Fresh Food Studio', 'FroYo Blasts', 'Lunch', 'retail'),
('2099-01-01', 'FroYo Blast Reese''s Pieces', 600, '{"protein":19,"carbs":96,"fats":19}', 'Freshens Fresh Food Studio', 'FroYo Blasts', 'Lunch', 'retail');
