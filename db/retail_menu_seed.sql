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
-- ============================================================================
-- PANERA BREAD
-- Source: Panera nutrition data (panerabread.com)
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
('2099-01-01', 'Bacon, Egg & Cheese on Brioche', 560, '{"protein":28,"carbs":42,"fats":28}', 'Panera', 'Breakfast', 'Breakfast', 'retail'),
('2099-01-01', 'Avocado, Egg White & Spinach Power Sandwich', 410, '{"protein":24,"carbs":38,"fats":17}', 'Panera', 'Breakfast', 'Breakfast', 'retail'),
('2099-01-01', 'Steel Cut Oatmeal with Strawberries', 340, '{"protein":9,"carbs":67,"fats":4}', 'Panera', 'Breakfast', 'Breakfast', 'retail'),
('2099-01-01', 'Blueberry Muffin', 420, '{"protein":6,"carbs":64,"fats":16}', 'Panera', 'Bakery', 'Breakfast', 'retail'),
('2099-01-01', 'Broccoli Cheddar Soup (Cup)', 360, '{"protein":13,"carbs":23,"fats":24}', 'Panera', 'Soups', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Noodle Soup (Cup)', 140, '{"protein":9,"carbs":18,"fats":3}', 'Panera', 'Soups', 'Lunch', 'retail'),
('2099-01-01', 'Cream of Chicken & Wild Rice Soup (Cup)', 260, '{"protein":10,"carbs":23,"fats":14}', 'Panera', 'Soups', 'Lunch', 'retail'),
('2099-01-01', 'Baked Potato Soup (Cup)', 290, '{"protein":8,"carbs":30,"fats":15}', 'Panera', 'Soups', 'Lunch', 'retail'),
('2099-01-01', 'Broccoli Cheddar Soup (Bowl)', 540, '{"protein":20,"carbs":34,"fats":36}', 'Panera', 'Soups', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Noodle Soup (Bowl)', 210, '{"protein":13,"carbs":27,"fats":5}', 'Panera', 'Soups', 'Lunch', 'retail'),
('2099-01-01', 'Cream of Chicken & Wild Rice Soup (Bowl)', 390, '{"protein":15,"carbs":34,"fats":21}', 'Panera', 'Soups', 'Lunch', 'retail'),
('2099-01-01', 'Baked Potato Soup (Bowl)', 440, '{"protein":12,"carbs":45,"fats":23}', 'Panera', 'Soups', 'Lunch', 'retail'),
('2099-01-01', 'Caesar Salad (Whole)', 330, '{"protein":11,"carbs":22,"fats":23}', 'Panera', 'Salads', 'Lunch', 'retail'),
('2099-01-01', 'Green Goddess Cobb Salad (Whole)', 560, '{"protein":37,"carbs":21,"fats":39}', 'Panera', 'Salads', 'Lunch', 'retail'),
('2099-01-01', 'Asian Sesame Salad with Chicken (Whole)', 420, '{"protein":31,"carbs":36,"fats":17}', 'Panera', 'Salads', 'Lunch', 'retail'),
('2099-01-01', 'Bacon Turkey Bravo on Tomato Basil', 800, '{"protein":50,"carbs":80,"fats":29}', 'Panera', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Frontega Chicken on Focaccia', 870, '{"protein":54,"carbs":81,"fats":35}', 'Panera', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Mediterranean Veggie on Tomato Basil', 590, '{"protein":21,"carbs":77,"fats":23}', 'Panera', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Tuna Salad Sandwich on Honey Wheat', 490, '{"protein":21,"carbs":63,"fats":17}', 'Panera', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Napa Almond Chicken Salad on Sesame Semolina', 680, '{"protein":31,"carbs":69,"fats":31}', 'Panera', 'Sandwiches', 'Lunch', 'retail'),
('2099-01-01', 'Margherita Flatbread', 820, '{"protein":32,"carbs":86,"fats":38}', 'Panera', 'Flatbreads', 'Lunch', 'retail'),
('2099-01-01', 'Chipotle Chicken & Bacon Flatbread', 970, '{"protein":48,"carbs":88,"fats":47}', 'Panera', 'Flatbreads', 'Lunch', 'retail'),
('2099-01-01', 'Baguette', 180, '{"protein":6,"carbs":34,"fats":2}', 'Panera', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Chips', 150, '{"protein":2,"carbs":19,"fats":8}', 'Panera', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Apple', 80, '{"protein":0,"carbs":21,"fats":0}', 'Panera', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Chocolate Chip Cookie', 390, '{"protein":4,"carbs":54,"fats":18}', 'Panera', 'Bakery', 'Lunch', 'retail'),
('2099-01-01', 'Chocolate Chipper Cookie', 440, '{"protein":5,"carbs":58,"fats":22}', 'Panera', 'Bakery', 'Lunch', 'retail'),
('2099-01-01', 'Kitchen Sink Cookie', 420, '{"protein":6,"carbs":55,"fats":20}', 'Panera', 'Bakery', 'Lunch', 'retail'),
('2099-01-01', 'Brownie', 470, '{"protein":5,"carbs":62,"fats":23}', 'Panera', 'Bakery', 'Lunch', 'retail'),
('2099-01-01', 'Charged Lemonade (20oz)', 160, '{"protein":0,"carbs":40,"fats":0}', 'Panera', 'Beverages', 'Lunch', 'retail'),
('2099-01-01', 'Green Tea (16oz)', 0, '{"protein":0,"carbs":0,"fats":0}', 'Panera', 'Beverages', 'Lunch', 'retail'),
('2099-01-01', 'Coffee (16oz)', 5, '{"protein":1,"carbs":1,"fats":0}', 'Panera', 'Beverages', 'Lunch', 'retail');

-- ============================================================================
-- QDOBA MEXICAN EATS
-- Source: Qdoba nutrition calculator (qdoba.com/nutrition)
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
('2099-01-01', 'Chicken Burrito (Flour Tortilla)', 1050, '{"protein":58,"carbs":130,"fats":34}', 'Qdoba', 'Burritos', 'Lunch', 'retail'),
('2099-01-01', 'Impossible Burrito (Flour Tortilla)', 860, '{"protein":42,"carbs":131,"fats":22}', 'Qdoba', 'Burritos', 'Lunch', 'retail'),
('2099-01-01', 'Steak Burrito (Flour Tortilla)', 1100, '{"protein":60,"carbs":130,"fats":38}', 'Qdoba', 'Burritos', 'Lunch', 'retail'),
('2099-01-01', 'Ground Beef Burrito (Flour Tortilla)', 1120, '{"protein":56,"carbs":130,"fats":42}', 'Qdoba', 'Burritos', 'Lunch', 'retail'),
('2099-01-01', 'Veggie Burrito (Flour Tortilla)', 940, '{"protein":30,"carbs":135,"fats":32}', 'Qdoba', 'Burritos', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Burrito Bowl', 770, '{"protein":57,"carbs":76,"fats":30}', 'Qdoba', 'Bowls', 'Lunch', 'retail'),
('2099-01-01', 'Steak Burrito Bowl', 820, '{"protein":59,"carbs":76,"fats":34}', 'Qdoba', 'Bowls', 'Lunch', 'retail'),
('2099-01-01', 'Ground Beef Burrito Bowl', 840, '{"protein":55,"carbs":76,"fats":38}', 'Qdoba', 'Bowls', 'Lunch', 'retail'),
('2099-01-01', 'Impossible Burrito Bowl', 580, '{"protein":41,"carbs":77,"fats":18}', 'Qdoba', 'Bowls', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Tacos (3)', 780, '{"protein":48,"carbs":72,"fats":30}', 'Qdoba', 'Tacos', 'Lunch', 'retail'),
('2099-01-01', 'Steak Tacos (3)', 830, '{"protein":50,"carbs":72,"fats":34}', 'Qdoba', 'Tacos', 'Lunch', 'retail'),
('2099-01-01', 'Ground Beef Tacos (3)', 850, '{"protein":46,"carbs":72,"fats":38}', 'Qdoba', 'Tacos', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Quesadilla', 1290, '{"protein":78,"carbs":106,"fats":58}', 'Qdoba', 'Quesadillas', 'Lunch', 'retail'),
('2099-01-01', 'Steak Quesadilla', 1340, '{"protein":80,"carbs":106,"fats":62}', 'Qdoba', 'Quesadillas', 'Lunch', 'retail'),
('2099-01-01', 'Veggie Quesadilla', 1030, '{"protein":42,"carbs":110,"fats":50}', 'Qdoba', 'Quesadillas', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Taco Salad', 980, '{"protein":62,"carbs":76,"fats":44}', 'Qdoba', 'Salads', 'Lunch', 'retail'),
('2099-01-01', 'Steak Taco Salad', 1030, '{"protein":64,"carbs":76,"fats":48}', 'Qdoba', 'Salads', 'Lunch', 'retail'),
('2099-01-01', 'Chips', 570, '{"protein":8,"carbs":74,"fats":28}', 'Qdoba', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Chips & Queso', 830, '{"protein":20,"carbs":82,"fats":46}', 'Qdoba', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Chips & Guacamole', 730, '{"protein":10,"carbs":82,"fats":42}', 'Qdoba', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Black Beans (Side)', 140, '{"protein":9,"carbs":23,"fats":1}', 'Qdoba', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Cilantro Lime Rice (Side)', 190, '{"protein":4,"carbs":40,"fats":2}', 'Qdoba', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Breakfast Burrito with Bacon', 780, '{"protein":36,"carbs":85,"fats":32}', 'Qdoba', 'Breakfast', 'Breakfast', 'retail'),
('2099-01-01', 'Breakfast Burrito with Sausage', 870, '{"protein":36,"carbs":85,"fats":39}', 'Qdoba', 'Breakfast', 'Breakfast', 'retail');

-- ============================================================================
-- JERSEY MIKE'S SUBS
-- Source: Jersey Mike's nutrition guide (jerseymikes.com/menu/nutrition)
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
('2099-01-01', '#1 BLT (Regular)', 540, '{"protein":21,"carbs":52,"fats":27}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#2 Jersey Shore''s Favorite (Regular)', 630, '{"protein":31,"carbs":53,"fats":31}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#7 Turkey & Provolone (Regular)', 510, '{"protein":30,"carbs":53,"fats":18}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#8 Club Sub with Mayonnaise (Regular)', 640, '{"protein":38,"carbs":53,"fats":29}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#9 Club Supreme (Regular)', 680, '{"protein":40,"carbs":53,"fats":32}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#13 Original Italian (Regular)', 700, '{"protein":31,"carbs":53,"fats":39}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#14 The Veggie (Regular)', 520, '{"protein":20,"carbs":61,"fats":22}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#1 BLT (Giant)', 1080, '{"protein":42,"carbs":104,"fats":54}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#7 Turkey & Provolone (Giant)', 1020, '{"protein":60,"carbs":106,"fats":36}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#8 Club Sub with Mayonnaise (Giant)', 1280, '{"protein":76,"carbs":106,"fats":58}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#13 Original Italian (Giant)', 1400, '{"protein":62,"carbs":106,"fats":78}', 'Jersey Mike's', 'Cold Subs', 'Lunch', 'retail'),
('2099-01-01', '#17 Mike''s Famous Philly (Regular)', 730, '{"protein":45,"carbs":58,"fats":34}', 'Jersey Mike's', 'Hot Subs', 'Lunch', 'retail'),
('2099-01-01', '#26 Bacon Ranch Chicken Cheese Steak (Regular)', 910, '{"protein":50,"carbs":58,"fats":52}', 'Jersey Mike's', 'Hot Subs', 'Lunch', 'retail'),
('2099-01-01', '#43 Chipotle Cheese Steak (Regular)', 850, '{"protein":47,"carbs":60,"fats":46}', 'Jersey Mike's', 'Hot Subs', 'Lunch', 'retail'),
('2099-01-01', '#56 Big Kahuna Cheese Steak (Regular)', 880, '{"protein":47,"carbs":62,"fats":48}', 'Jersey Mike's', 'Hot Subs', 'Lunch', 'retail'),
('2099-01-01', '#17 Mike''s Famous Philly (Giant)', 1460, '{"protein":90,"carbs":116,"fats":68}', 'Jersey Mike's', 'Hot Subs', 'Lunch', 'retail'),
('2099-01-01', '#26 Bacon Ranch Chicken Cheese Steak (Giant)', 1820, '{"protein":100,"carbs":116,"fats":104}', 'Jersey Mike's', 'Hot Subs', 'Lunch', 'retail'),
('2099-01-01', '#2 Jersey Shore''s Favorite (Mini)', 390, '{"protein":19,"carbs":36,"fats":19}', 'Jersey Mike's', 'Mini Subs', 'Lunch', 'retail'),
('2099-01-01', '#7 Turkey & Provolone (Mini)', 320, '{"protein":18,"carbs":36,"fats":11}', 'Jersey Mike's', 'Mini Subs', 'Lunch', 'retail'),
('2099-01-01', 'Grilled Buffalo Chicken Wrap', 600, '{"protein":45,"carbs":48,"fats":25}', 'Jersey Mike's', 'Wraps', 'Lunch', 'retail'),
('2099-01-01', 'Grilled Chicken Caesar Wrap', 690, '{"protein":46,"carbs":48,"fats":32}', 'Jersey Mike's', 'Wraps', 'Lunch', 'retail'),
('2099-01-01', 'Regular Chips', 150, '{"protein":2,"carbs":15,"fats":10}', 'Jersey Mike's', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Pickle', 5, '{"protein":0,"carbs":1,"fats":0}', 'Jersey Mike's', 'Sides', 'Lunch', 'retail'),
('2099-01-01', 'Chocolate Chip Cookie', 420, '{"protein":5,"carbs":55,"fats":21}', 'Jersey Mike's', 'Desserts', 'Lunch', 'retail');

-- ============================================================================
-- STARBUCKS @ MSEE
-- Source: Starbucks nutrition data (starbucks.com/menu)
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
('2099-01-01', 'Caffe Americano (Grande)', 15, '{"protein":1,"carbs":3,"fats":0}', 'Starbucks @ MSEE', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Caffe Latte (Grande)', 190, '{"protein":13,"carbs":19,"fats":7}', 'Starbucks @ MSEE', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Cappuccino (Grande)', 140, '{"protein":10,"carbs":14,"fats":5}', 'Starbucks @ MSEE', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Flat White (Grande)', 220, '{"protein":15,"carbs":22,"fats":9}', 'Starbucks @ MSEE', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Caffe Mocha (Grande)', 370, '{"protein":13,"carbs":50,"fats":14}', 'Starbucks @ MSEE', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'White Chocolate Mocha (Grande)', 430, '{"protein":14,"carbs":59,"fats":16}', 'Starbucks @ MSEE', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Caramel Macchiato (Grande)', 250, '{"protein":10,"carbs":34,"fats":7}', 'Starbucks @ MSEE', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Pumpkin Spice Latte (Grande)', 380, '{"protein":14,"carbs":52,"fats":14}', 'Starbucks @ MSEE', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Iced Caffe Americano (Grande)', 15, '{"protein":2,"carbs":3,"fats":0}', 'Starbucks @ MSEE', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Iced Latte (Grande)', 130, '{"protein":8,"carbs":13,"fats":5}', 'Starbucks @ MSEE', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Iced Caramel Macchiato (Grande)', 250, '{"protein":9,"carbs":35,"fats":7}', 'Starbucks @ MSEE', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Cold Brew (Grande)', 5, '{"protein":0,"carbs":0,"fats":0}', 'Starbucks @ MSEE', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Vanilla Sweet Cream Cold Brew (Grande)', 110, '{"protein":1,"carbs":14,"fats":5}', 'Starbucks @ MSEE', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Nitro Cold Brew (Grande)', 5, '{"protein":0,"carbs":0,"fats":0}', 'Starbucks @ MSEE', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Caffe Vanilla Frappuccino (Grande)', 400, '{"protein":5,"carbs":66,"fats":13}', 'Starbucks @ MSEE', 'Frappuccinos', 'Lunch', 'retail'),
('2099-01-01', 'Caramel Frappuccino (Grande)', 420, '{"protein":5,"carbs":68,"fats":16}', 'Starbucks @ MSEE', 'Frappuccinos', 'Lunch', 'retail'),
('2099-01-01', 'Mocha Frappuccino (Grande)', 410, '{"protein":6,"carbs":64,"fats":15}', 'Starbucks @ MSEE', 'Frappuccinos', 'Lunch', 'retail'),
('2099-01-01', 'Java Chip Frappuccino (Grande)', 470, '{"protein":6,"carbs":69,"fats":19}', 'Starbucks @ MSEE', 'Frappuccinos', 'Lunch', 'retail'),
('2099-01-01', 'Chai Tea Latte (Grande)', 240, '{"protein":6,"carbs":45,"fats":4}', 'Starbucks @ MSEE', 'Tea', 'Breakfast', 'retail'),
('2099-01-01', 'Matcha Tea Latte (Grande)', 240, '{"protein":9,"carbs":34,"fats":7}', 'Starbucks @ MSEE', 'Tea', 'Breakfast', 'retail'),
('2099-01-01', 'Hot Chocolate (Grande)', 370, '{"protein":14,"carbs":47,"fats":15}', 'Starbucks @ MSEE', 'Hot Chocolate', 'Breakfast', 'retail'),
('2099-01-01', 'Iced Passion Tango Tea (Grande)', 0, '{"protein":0,"carbs":0,"fats":0}', 'Starbucks @ MSEE', 'Tea', 'Lunch', 'retail'),
('2099-01-01', 'Espresso (Solo)', 5, '{"protein":0,"carbs":1,"fats":0}', 'Starbucks @ MSEE', 'Espresso', 'Breakfast', 'retail'),
('2099-01-01', 'Espresso (Doppio)', 10, '{"protein":1,"carbs":2,"fats":0}', 'Starbucks @ MSEE', 'Espresso', 'Breakfast', 'retail'),
('2099-01-01', 'Bacon, Gouda & Egg Sandwich', 360, '{"protein":19,"carbs":33,"fats":16}', 'Starbucks @ MSEE', 'Breakfast Sandwiches', 'Breakfast', 'retail'),
('2099-01-01', 'Turkey Bacon & Egg White Sandwich', 230, '{"protein":17,"carbs":30,"fats":5}', 'Starbucks @ MSEE', 'Breakfast Sandwiches', 'Breakfast', 'retail'),
('2099-01-01', 'Spinach, Feta & Egg White Wrap', 290, '{"protein":20,"carbs":33,"fats":10}', 'Starbucks @ MSEE', 'Breakfast Sandwiches', 'Breakfast', 'retail'),
('2099-01-01', 'Butter Croissant', 310, '{"protein":5,"carbs":32,"fats":18}', 'Starbucks @ MSEE', 'Bakery', 'Breakfast', 'retail'),
('2099-01-01', 'Blueberry Muffin', 420, '{"protein":6,"carbs":61,"fats":17}', 'Starbucks @ MSEE', 'Bakery', 'Breakfast', 'retail'),
('2099-01-01', 'Turkey Pesto Panini', 500, '{"protein":28,"carbs":46,"fats":22}', 'Starbucks @ MSEE', 'Lunch', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Caprese Panini', 490, '{"protein":30,"carbs":45,"fats":20}', 'Starbucks @ MSEE', 'Lunch', 'Lunch', 'retail'),
('2099-01-01', 'Tomato & Mozzarella Panini', 350, '{"protein":17,"carbs":40,"fats":14}', 'Starbucks @ MSEE', 'Lunch', 'Lunch', 'retail'),
('2099-01-01', 'Everything Bagel', 290, '{"protein":11,"carbs":56,"fats":3}', 'Starbucks @ MSEE', 'Bakery', 'Breakfast', 'retail'),
('2099-01-01', 'Chocolate Chip Cookie', 370, '{"protein":4,"carbs":47,"fats":19}', 'Starbucks @ MSEE', 'Bakery', 'Lunch', 'retail'),
('2099-01-01', 'Double Chocolate Brownie', 480, '{"protein":6,"carbs":61,"fats":25}', 'Starbucks @ MSEE', 'Bakery', 'Lunch', 'retail'),
('2099-01-01', 'Lemon Loaf', 470, '{"protein":5,"carbs":66,"fats":21}', 'Starbucks @ MSEE', 'Bakery', 'Lunch', 'retail'),
('2099-01-01', 'Cake Pop', 170, '{"protein":2,"carbs":23,"fats":8}', 'Starbucks @ MSEE', 'Desserts', 'Lunch', 'retail');

-- ============================================================================
-- STARBUCKS @ WINIFRED PARKER HALL
-- Source: Starbucks nutrition data (starbucks.com/menu)
-- Same menu as MSEE location
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
('2099-01-01', 'Caffe Americano (Grande)', 15, '{"protein":1,"carbs":3,"fats":0}', 'Starbucks @ Winifred Parker Hall', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Caffe Latte (Grande)', 190, '{"protein":13,"carbs":19,"fats":7}', 'Starbucks @ Winifred Parker Hall', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Cappuccino (Grande)', 140, '{"protein":10,"carbs":14,"fats":5}', 'Starbucks @ Winifred Parker Hall', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Flat White (Grande)', 220, '{"protein":15,"carbs":22,"fats":9}', 'Starbucks @ Winifred Parker Hall', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Caffe Mocha (Grande)', 370, '{"protein":13,"carbs":50,"fats":14}', 'Starbucks @ Winifred Parker Hall', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'White Chocolate Mocha (Grande)', 430, '{"protein":14,"carbs":59,"fats":16}', 'Starbucks @ Winifred Parker Hall', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Caramel Macchiato (Grande)', 250, '{"protein":10,"carbs":34,"fats":7}', 'Starbucks @ Winifred Parker Hall', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Pumpkin Spice Latte (Grande)', 380, '{"protein":14,"carbs":52,"fats":14}', 'Starbucks @ Winifred Parker Hall', 'Hot Coffee', 'Breakfast', 'retail'),
('2099-01-01', 'Iced Caffe Americano (Grande)', 15, '{"protein":2,"carbs":3,"fats":0}', 'Starbucks @ Winifred Parker Hall', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Iced Latte (Grande)', 130, '{"protein":8,"carbs":13,"fats":5}', 'Starbucks @ Winifred Parker Hall', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Iced Caramel Macchiato (Grande)', 250, '{"protein":9,"carbs":35,"fats":7}', 'Starbucks @ Winifred Parker Hall', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Cold Brew (Grande)', 5, '{"protein":0,"carbs":0,"fats":0}', 'Starbucks @ Winifred Parker Hall', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Vanilla Sweet Cream Cold Brew (Grande)', 110, '{"protein":1,"carbs":14,"fats":5}', 'Starbucks @ Winifred Parker Hall', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Nitro Cold Brew (Grande)', 5, '{"protein":0,"carbs":0,"fats":0}', 'Starbucks @ Winifred Parker Hall', 'Cold Coffee', 'Lunch', 'retail'),
('2099-01-01', 'Caffe Vanilla Frappuccino (Grande)', 400, '{"protein":5,"carbs":66,"fats":13}', 'Starbucks @ Winifred Parker Hall', 'Frappuccinos', 'Lunch', 'retail'),
('2099-01-01', 'Caramel Frappuccino (Grande)', 420, '{"protein":5,"carbs":68,"fats":16}', 'Starbucks @ Winifred Parker Hall', 'Frappuccinos', 'Lunch', 'retail'),
('2099-01-01', 'Mocha Frappuccino (Grande)', 410, '{"protein":6,"carbs":64,"fats":15}', 'Starbucks @ Winifred Parker Hall', 'Frappuccinos', 'Lunch', 'retail'),
('2099-01-01', 'Java Chip Frappuccino (Grande)', 470, '{"protein":6,"carbs":69,"fats":19}', 'Starbucks @ Winifred Parker Hall', 'Frappuccinos', 'Lunch', 'retail'),
('2099-01-01', 'Chai Tea Latte (Grande)', 240, '{"protein":6,"carbs":45,"fats":4}', 'Starbucks @ Winifred Parker Hall', 'Tea', 'Breakfast', 'retail'),
('2099-01-01', 'Matcha Tea Latte (Grande)', 240, '{"protein":9,"carbs":34,"fats":7}', 'Starbucks @ Winifred Parker Hall', 'Tea', 'Breakfast', 'retail'),
('2099-01-01', 'Hot Chocolate (Grande)', 370, '{"protein":14,"carbs":47,"fats":15}', 'Starbucks @ Winifred Parker Hall', 'Hot Chocolate', 'Breakfast', 'retail'),
('2099-01-01', 'Iced Passion Tango Tea (Grande)', 0, '{"protein":0,"carbs":0,"fats":0}', 'Starbucks @ Winifred Parker Hall', 'Tea', 'Lunch', 'retail'),
('2099-01-01', 'Espresso (Solo)', 5, '{"protein":0,"carbs":1,"fats":0}', 'Starbucks @ Winifred Parker Hall', 'Espresso', 'Breakfast', 'retail'),
('2099-01-01', 'Espresso (Doppio)', 10, '{"protein":1,"carbs":2,"fats":0}', 'Starbucks @ Winifred Parker Hall', 'Espresso', 'Breakfast', 'retail'),
('2099-01-01', 'Bacon, Gouda & Egg Sandwich', 360, '{"protein":19,"carbs":33,"fats":16}', 'Starbucks @ Winifred Parker Hall', 'Breakfast Sandwiches', 'Breakfast', 'retail'),
('2099-01-01', 'Turkey Bacon & Egg White Sandwich', 230, '{"protein":17,"carbs":30,"fats":5}', 'Starbucks @ Winifred Parker Hall', 'Breakfast Sandwiches', 'Breakfast', 'retail'),
('2099-01-01', 'Spinach, Feta & Egg White Wrap', 290, '{"protein":20,"carbs":33,"fats":10}', 'Starbucks @ Winifred Parker Hall', 'Breakfast Sandwiches', 'Breakfast', 'retail'),
('2099-01-01', 'Butter Croissant', 310, '{"protein":5,"carbs":32,"fats":18}', 'Starbucks @ Winifred Parker Hall', 'Bakery', 'Breakfast', 'retail'),
('2099-01-01', 'Blueberry Muffin', 420, '{"protein":6,"carbs":61,"fats":17}', 'Starbucks @ Winifred Parker Hall', 'Bakery', 'Breakfast', 'retail'),
('2099-01-01', 'Turkey Pesto Panini', 500, '{"protein":28,"carbs":46,"fats":22}', 'Starbucks @ Winifred Parker Hall', 'Lunch', 'Lunch', 'retail'),
('2099-01-01', 'Chicken Caprese Panini', 490, '{"protein":30,"carbs":45,"fats":20}', 'Starbucks @ Winifred Parker Hall', 'Lunch', 'Lunch', 'retail'),
('2099-01-01', 'Tomato & Mozzarella Panini', 350, '{"protein":17,"carbs":40,"fats":14}', 'Starbucks @ Winifred Parker Hall', 'Lunch', 'Lunch', 'retail'),
('2099-01-01', 'Everything Bagel', 290, '{"protein":11,"carbs":56,"fats":3}', 'Starbucks @ Winifred Parker Hall', 'Bakery', 'Breakfast', 'retail'),
('2099-01-01', 'Chocolate Chip Cookie', 370, '{"protein":4,"carbs":47,"fats":19}', 'Starbucks @ Winifred Parker Hall', 'Bakery', 'Lunch', 'retail'),
('2099-01-01', 'Double Chocolate Brownie', 480, '{"protein":6,"carbs":61,"fats":25}', 'Starbucks @ Winifred Parker Hall', 'Bakery', 'Lunch', 'retail'),
('2099-01-01', 'Lemon Loaf', 470, '{"protein":5,"carbs":66,"fats":21}', 'Starbucks @ Winifred Parker Hall', 'Bakery', 'Lunch', 'retail'),
('2099-01-01', 'Cake Pop', 170, '{"protein":2,"carbs":23,"fats":8}', 'Starbucks @ Winifred Parker Hall', 'Desserts', 'Lunch', 'retail');

-- ============================================================================
-- EARHART DINING COURT - BEVERAGES
-- Source: Prairie Farms (milk), Coca-Cola (fountain drinks)
-- Cup size: 16 oz standard dining hall cup
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
('2099-01-01', '2% Reduced Fat Milk (16 oz)', 240, '{"protein": 16, "carbs": 24, "fats": 10, "saturated_fat": 6, "cholesterol": 50, "sodium": 240, "fiber": 0, "sugar": 24, "added_sugar": 0, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Reduced fat milk, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Fat Free Skim Milk (16 oz)', 160, '{"protein": 16, "carbs": 24, "fats": 0, "saturated_fat": 0, "cholesterol": 10, "sodium": 260, "fiber": 0, "sugar": 24, "added_sugar": 0, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Fat free milk, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', '1% Lowfat Chocolate Milk (16 oz)', 320, '{"protein": 16, "carbs": 52, "fats": 5, "saturated_fat": 3, "cholesterol": 20, "sodium": 380, "fiber": 2, "sugar": 48, "added_sugar": 24, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Lowfat milk, sugar, cocoa (processed with alkali), cornstarch, salt, carrageenan, vanillin, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Coca-Cola (16 oz)', 190, '{"protein": 0, "carbs": 52, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 52, "added_sugar": 52, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Diet Coke (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 60, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, caramel color, aspartame, phosphoric acid, potassium benzoate, natural flavors, citric acid, caffeine.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Coca-Cola Zero Sugar (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, caramel color, phosphoric acid, aspartame, potassium benzoate, natural flavors, potassium citrate, acesulfame potassium, caffeine.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Sprite (16 oz)', 190, '{"protein": 0, "carbs": 51, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 51, "added_sugar": 51, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, citric acid, natural flavors, sodium citrate, sodium benzoate.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Sprite Zero (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 40, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, citric acid, natural flavors, potassium citrate, aspartame, acesulfame potassium, sodium benzoate.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Dr Pepper (16 oz)', 200, '{"protein": 0, "carbs": 53, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 75, "fiber": 0, "sugar": 53, "added_sugar": 53, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural and artificial flavors, sodium benzoate, caffeine.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Fanta Orange (16 oz)', 220, '{"protein": 0, "carbs": 59, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 59, "added_sugar": 59, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, citric acid, sodium benzoate, natural flavors, modified food starch, glycerol ester of rosin, yellow 6, red 40.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Barq''s Root Beer (16 oz)', 200, '{"protein": 0, "carbs": 54, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 75, "fiber": 0, "sugar": 54, "added_sugar": 54, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, sodium benzoate, citric acid, caffeine, artificial and natural flavors, acacia.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Mello Yello (16 oz)', 220, '{"protein": 0, "carbs": 58, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 58, "added_sugar": 58, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, concentrated orange juice, citric acid, natural flavors, caffeine, sodium benzoate, gum arabic, glycerol ester of rosin, calcium disodium EDTA, yellow 5.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Hi-C Flashin'' Fruit Punch (16 oz)', 200, '{"protein": 0, "carbs": 54, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 54, "added_sugar": 54, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, citric acid, natural flavors, modified cornstarch, fruit juice for color, glycerol ester of rosin, ascorbic acid (vitamin C).", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Powerade Mountain Berry Blast (16 oz)', 100, '{"protein": 0, "carbs": 25, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 150, "fiber": 0, "sugar": 25, "added_sugar": 25, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, citric acid, salt, natural flavors, potassium citrate, modified food starch, calcium disodium EDTA, medium chain triglycerides, sucrose acetate isobutyrate, blue 1.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Minute Maid Lemonade (16 oz)', 180, '{"protein": 0, "carbs": 49, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 40, "fiber": 0, "sugar": 47, "added_sugar": 47, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, lemon juice from concentrate, citric acid, natural flavors, sodium citrate, ascorbic acid (vitamin C).", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Water (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 0, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water.", "serving_size": "16 oz"}', 'Earhart', 'Beverages', 'breakfast/lunch/dinner', 'retail');

-- ============================================================================
-- FORD DINING COURT - BEVERAGES
-- Source: Prairie Farms (milk), Coca-Cola (fountain drinks)
-- Cup size: 16 oz standard dining hall cup
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
('2099-01-01', '2% Reduced Fat Milk (16 oz)', 240, '{"protein": 16, "carbs": 24, "fats": 10, "saturated_fat": 6, "cholesterol": 50, "sodium": 240, "fiber": 0, "sugar": 24, "added_sugar": 0, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Reduced fat milk, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Fat Free Skim Milk (16 oz)', 160, '{"protein": 16, "carbs": 24, "fats": 0, "saturated_fat": 0, "cholesterol": 10, "sodium": 260, "fiber": 0, "sugar": 24, "added_sugar": 0, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Fat free milk, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', '1% Lowfat Chocolate Milk (16 oz)', 320, '{"protein": 16, "carbs": 52, "fats": 5, "saturated_fat": 3, "cholesterol": 20, "sodium": 380, "fiber": 2, "sugar": 48, "added_sugar": 24, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Lowfat milk, sugar, cocoa (processed with alkali), cornstarch, salt, carrageenan, vanillin, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Coca-Cola (16 oz)', 190, '{"protein": 0, "carbs": 52, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 52, "added_sugar": 52, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Diet Coke (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 60, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, caramel color, aspartame, phosphoric acid, potassium benzoate, natural flavors, citric acid, caffeine.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Coca-Cola Zero Sugar (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, caramel color, phosphoric acid, aspartame, potassium benzoate, natural flavors, potassium citrate, acesulfame potassium, caffeine.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Sprite (16 oz)', 190, '{"protein": 0, "carbs": 51, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 51, "added_sugar": 51, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, citric acid, natural flavors, sodium citrate, sodium benzoate.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Sprite Zero (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 40, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, citric acid, natural flavors, potassium citrate, aspartame, acesulfame potassium, sodium benzoate.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Dr Pepper (16 oz)', 200, '{"protein": 0, "carbs": 53, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 75, "fiber": 0, "sugar": 53, "added_sugar": 53, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural and artificial flavors, sodium benzoate, caffeine.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Fanta Orange (16 oz)', 220, '{"protein": 0, "carbs": 59, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 59, "added_sugar": 59, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, citric acid, sodium benzoate, natural flavors, modified food starch, glycerol ester of rosin, yellow 6, red 40.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Barq''s Root Beer (16 oz)', 200, '{"protein": 0, "carbs": 54, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 75, "fiber": 0, "sugar": 54, "added_sugar": 54, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, sodium benzoate, citric acid, caffeine, artificial and natural flavors, acacia.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Mello Yello (16 oz)', 220, '{"protein": 0, "carbs": 58, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 58, "added_sugar": 58, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, concentrated orange juice, citric acid, natural flavors, caffeine, sodium benzoate, gum arabic, glycerol ester of rosin, calcium disodium EDTA, yellow 5.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Hi-C Flashin'' Fruit Punch (16 oz)', 200, '{"protein": 0, "carbs": 54, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 54, "added_sugar": 54, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, citric acid, natural flavors, modified cornstarch, fruit juice for color, glycerol ester of rosin, ascorbic acid (vitamin C).", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Powerade Mountain Berry Blast (16 oz)', 100, '{"protein": 0, "carbs": 25, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 150, "fiber": 0, "sugar": 25, "added_sugar": 25, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, citric acid, salt, natural flavors, potassium citrate, modified food starch, calcium disodium EDTA, medium chain triglycerides, sucrose acetate isobutyrate, blue 1.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Minute Maid Lemonade (16 oz)', 180, '{"protein": 0, "carbs": 49, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 40, "fiber": 0, "sugar": 47, "added_sugar": 47, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, lemon juice from concentrate, citric acid, natural flavors, sodium citrate, ascorbic acid (vitamin C).", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Water (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 0, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water.", "serving_size": "16 oz"}', 'Ford', 'Beverages', 'breakfast/lunch/dinner', 'retail');

-- ============================================================================
-- HILLENBRAND DINING COURT - BEVERAGES
-- Source: Prairie Farms (milk), Coca-Cola (fountain drinks)
-- Cup size: 16 oz standard dining hall cup
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
('2099-01-01', '2% Reduced Fat Milk (16 oz)', 240, '{"protein": 16, "carbs": 24, "fats": 10, "saturated_fat": 6, "cholesterol": 50, "sodium": 240, "fiber": 0, "sugar": 24, "added_sugar": 0, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Reduced fat milk, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Fat Free Skim Milk (16 oz)', 160, '{"protein": 16, "carbs": 24, "fats": 0, "saturated_fat": 0, "cholesterol": 10, "sodium": 260, "fiber": 0, "sugar": 24, "added_sugar": 0, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Fat free milk, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', '1% Lowfat Chocolate Milk (16 oz)', 320, '{"protein": 16, "carbs": 52, "fats": 5, "saturated_fat": 3, "cholesterol": 20, "sodium": 380, "fiber": 2, "sugar": 48, "added_sugar": 24, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Lowfat milk, sugar, cocoa (processed with alkali), cornstarch, salt, carrageenan, vanillin, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Coca-Cola (16 oz)', 190, '{"protein": 0, "carbs": 52, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 52, "added_sugar": 52, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Diet Coke (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 60, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, caramel color, aspartame, phosphoric acid, potassium benzoate, natural flavors, citric acid, caffeine.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Coca-Cola Zero Sugar (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, caramel color, phosphoric acid, aspartame, potassium benzoate, natural flavors, potassium citrate, acesulfame potassium, caffeine.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Sprite (16 oz)', 190, '{"protein": 0, "carbs": 51, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 51, "added_sugar": 51, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, citric acid, natural flavors, sodium citrate, sodium benzoate.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Sprite Zero (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 40, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, citric acid, natural flavors, potassium citrate, aspartame, acesulfame potassium, sodium benzoate.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Dr Pepper (16 oz)', 200, '{"protein": 0, "carbs": 53, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 75, "fiber": 0, "sugar": 53, "added_sugar": 53, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural and artificial flavors, sodium benzoate, caffeine.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Fanta Orange (16 oz)', 220, '{"protein": 0, "carbs": 59, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 59, "added_sugar": 59, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, citric acid, sodium benzoate, natural flavors, modified food starch, glycerol ester of rosin, yellow 6, red 40.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Barq''s Root Beer (16 oz)', 200, '{"protein": 0, "carbs": 54, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 75, "fiber": 0, "sugar": 54, "added_sugar": 54, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, sodium benzoate, citric acid, caffeine, artificial and natural flavors, acacia.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Mello Yello (16 oz)', 220, '{"protein": 0, "carbs": 58, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 58, "added_sugar": 58, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, concentrated orange juice, citric acid, natural flavors, caffeine, sodium benzoate, gum arabic, glycerol ester of rosin, calcium disodium EDTA, yellow 5.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Hi-C Flashin'' Fruit Punch (16 oz)', 200, '{"protein": 0, "carbs": 54, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 54, "added_sugar": 54, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, citric acid, natural flavors, modified cornstarch, fruit juice for color, glycerol ester of rosin, ascorbic acid (vitamin C).", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Powerade Mountain Berry Blast (16 oz)', 100, '{"protein": 0, "carbs": 25, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 150, "fiber": 0, "sugar": 25, "added_sugar": 25, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, citric acid, salt, natural flavors, potassium citrate, modified food starch, calcium disodium EDTA, medium chain triglycerides, sucrose acetate isobutyrate, blue 1.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Minute Maid Lemonade (16 oz)', 180, '{"protein": 0, "carbs": 49, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 40, "fiber": 0, "sugar": 47, "added_sugar": 47, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, lemon juice from concentrate, citric acid, natural flavors, sodium citrate, ascorbic acid (vitamin C).", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Water (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 0, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water.", "serving_size": "16 oz"}', 'Hillenbrand', 'Beverages', 'breakfast/lunch/dinner', 'retail');

-- ============================================================================
-- WILEY DINING COURT - BEVERAGES
-- Source: Prairie Farms (milk), Coca-Cola (fountain drinks)
-- Cup size: 16 oz standard dining hall cup
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
('2099-01-01', '2% Reduced Fat Milk (16 oz)', 240, '{"protein": 16, "carbs": 24, "fats": 10, "saturated_fat": 6, "cholesterol": 50, "sodium": 240, "fiber": 0, "sugar": 24, "added_sugar": 0, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Reduced fat milk, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Fat Free Skim Milk (16 oz)', 160, '{"protein": 16, "carbs": 24, "fats": 0, "saturated_fat": 0, "cholesterol": 10, "sodium": 260, "fiber": 0, "sugar": 24, "added_sugar": 0, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Fat free milk, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', '1% Lowfat Chocolate Milk (16 oz)', 320, '{"protein": 16, "carbs": 52, "fats": 5, "saturated_fat": 3, "cholesterol": 20, "sodium": 380, "fiber": 2, "sugar": 48, "added_sugar": 24, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Lowfat milk, sugar, cocoa (processed with alkali), cornstarch, salt, carrageenan, vanillin, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Coca-Cola (16 oz)', 190, '{"protein": 0, "carbs": 52, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 52, "added_sugar": 52, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Diet Coke (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 60, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, caramel color, aspartame, phosphoric acid, potassium benzoate, natural flavors, citric acid, caffeine.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Coca-Cola Zero Sugar (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, caramel color, phosphoric acid, aspartame, potassium benzoate, natural flavors, potassium citrate, acesulfame potassium, caffeine.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Sprite (16 oz)', 190, '{"protein": 0, "carbs": 51, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 51, "added_sugar": 51, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, citric acid, natural flavors, sodium citrate, sodium benzoate.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Sprite Zero (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 40, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, citric acid, natural flavors, potassium citrate, aspartame, acesulfame potassium, sodium benzoate.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Dr Pepper (16 oz)', 200, '{"protein": 0, "carbs": 53, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 75, "fiber": 0, "sugar": 53, "added_sugar": 53, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural and artificial flavors, sodium benzoate, caffeine.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Fanta Orange (16 oz)', 220, '{"protein": 0, "carbs": 59, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 59, "added_sugar": 59, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, citric acid, sodium benzoate, natural flavors, modified food starch, glycerol ester of rosin, yellow 6, red 40.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Barq''s Root Beer (16 oz)', 200, '{"protein": 0, "carbs": 54, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 75, "fiber": 0, "sugar": 54, "added_sugar": 54, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, sodium benzoate, citric acid, caffeine, artificial and natural flavors, acacia.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Mello Yello (16 oz)', 220, '{"protein": 0, "carbs": 58, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 58, "added_sugar": 58, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, concentrated orange juice, citric acid, natural flavors, caffeine, sodium benzoate, gum arabic, glycerol ester of rosin, calcium disodium EDTA, yellow 5.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Hi-C Flashin'' Fruit Punch (16 oz)', 200, '{"protein": 0, "carbs": 54, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 54, "added_sugar": 54, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, citric acid, natural flavors, modified cornstarch, fruit juice for color, glycerol ester of rosin, ascorbic acid (vitamin C).", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Powerade Mountain Berry Blast (16 oz)', 100, '{"protein": 0, "carbs": 25, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 150, "fiber": 0, "sugar": 25, "added_sugar": 25, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, citric acid, salt, natural flavors, potassium citrate, modified food starch, calcium disodium EDTA, medium chain triglycerides, sucrose acetate isobutyrate, blue 1.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Minute Maid Lemonade (16 oz)', 180, '{"protein": 0, "carbs": 49, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 40, "fiber": 0, "sugar": 47, "added_sugar": 47, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, lemon juice from concentrate, citric acid, natural flavors, sodium citrate, ascorbic acid (vitamin C).", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Water (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 0, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water.", "serving_size": "16 oz"}', 'Wiley', 'Beverages', 'breakfast/lunch/dinner', 'retail');

-- ============================================================================
-- WINDSOR DINING COURT - BEVERAGES
-- Source: Prairie Farms (milk), Coca-Cola (fountain drinks)
-- Cup size: 16 oz standard dining hall cup
-- ============================================================================

INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES
('2099-01-01', '2% Reduced Fat Milk (16 oz)', 240, '{"protein": 16, "carbs": 24, "fats": 10, "saturated_fat": 6, "cholesterol": 50, "sodium": 240, "fiber": 0, "sugar": 24, "added_sugar": 0, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Reduced fat milk, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Fat Free Skim Milk (16 oz)', 160, '{"protein": 16, "carbs": 24, "fats": 0, "saturated_fat": 0, "cholesterol": 10, "sodium": 260, "fiber": 0, "sugar": 24, "added_sugar": 0, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Fat free milk, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', '1% Lowfat Chocolate Milk (16 oz)', 320, '{"protein": 16, "carbs": 52, "fats": 5, "saturated_fat": 3, "cholesterol": 20, "sodium": 380, "fiber": 2, "sugar": 48, "added_sugar": 24, "is_vegetarian": true, "is_vegan": false, "allergens": ["Milk"], "ingredients": "Lowfat milk, sugar, cocoa (processed with alkali), cornstarch, salt, carrageenan, vanillin, vitamin A palmitate, vitamin D3.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Coca-Cola (16 oz)', 190, '{"protein": 0, "carbs": 52, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 52, "added_sugar": 52, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Diet Coke (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 60, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, caramel color, aspartame, phosphoric acid, potassium benzoate, natural flavors, citric acid, caffeine.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Coca-Cola Zero Sugar (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, caramel color, phosphoric acid, aspartame, potassium benzoate, natural flavors, potassium citrate, acesulfame potassium, caffeine.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Sprite (16 oz)', 190, '{"protein": 0, "carbs": 51, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 50, "fiber": 0, "sugar": 51, "added_sugar": 51, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, citric acid, natural flavors, sodium citrate, sodium benzoate.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Sprite Zero (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 40, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, citric acid, natural flavors, potassium citrate, aspartame, acesulfame potassium, sodium benzoate.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Dr Pepper (16 oz)', 200, '{"protein": 0, "carbs": 53, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 75, "fiber": 0, "sugar": 53, "added_sugar": 53, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, phosphoric acid, natural and artificial flavors, sodium benzoate, caffeine.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Fanta Orange (16 oz)', 220, '{"protein": 0, "carbs": 59, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 59, "added_sugar": 59, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, citric acid, sodium benzoate, natural flavors, modified food starch, glycerol ester of rosin, yellow 6, red 40.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Barq''s Root Beer (16 oz)', 200, '{"protein": 0, "carbs": 54, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 75, "fiber": 0, "sugar": 54, "added_sugar": 54, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, caramel color, sodium benzoate, citric acid, caffeine, artificial and natural flavors, acacia.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Mello Yello (16 oz)', 220, '{"protein": 0, "carbs": 58, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 58, "added_sugar": 58, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Carbonated water, high fructose corn syrup, concentrated orange juice, citric acid, natural flavors, caffeine, sodium benzoate, gum arabic, glycerol ester of rosin, calcium disodium EDTA, yellow 5.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Hi-C Flashin'' Fruit Punch (16 oz)', 200, '{"protein": 0, "carbs": 54, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 55, "fiber": 0, "sugar": 54, "added_sugar": 54, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, citric acid, natural flavors, modified cornstarch, fruit juice for color, glycerol ester of rosin, ascorbic acid (vitamin C).", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Powerade Mountain Berry Blast (16 oz)', 100, '{"protein": 0, "carbs": 25, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 150, "fiber": 0, "sugar": 25, "added_sugar": 25, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, citric acid, salt, natural flavors, potassium citrate, modified food starch, calcium disodium EDTA, medium chain triglycerides, sucrose acetate isobutyrate, blue 1.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Minute Maid Lemonade (16 oz)', 180, '{"protein": 0, "carbs": 49, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 40, "fiber": 0, "sugar": 47, "added_sugar": 47, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water, high fructose corn syrup, lemon juice from concentrate, citric acid, natural flavors, sodium citrate, ascorbic acid (vitamin C).", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail'),
('2099-01-01', 'Water (16 oz)', 0, '{"protein": 0, "carbs": 0, "fats": 0, "saturated_fat": 0, "cholesterol": 0, "sodium": 0, "fiber": 0, "sugar": 0, "added_sugar": 0, "is_vegetarian": true, "is_vegan": true, "allergens": [], "ingredients": "Water.", "serving_size": "16 oz"}', 'Windsor', 'Beverages', 'breakfast/lunch/dinner', 'retail');

