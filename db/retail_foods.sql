-- Add retail food items from popular restaurants and chains
-- Chick-fil-A
INSERT INTO foods (name, calories, macros, dining_court, meal_time) 
SELECT * FROM (VALUES
    ('Chick-fil-A Chicken Sandwich', 440, '{"protein":39,"carbs":41,"fats":17}'::JSONB, 'Retail', 'lunch'),
    ('Chick-fil-A Grilled Chicken Sandwich', 320, '{"protein":40,"carbs":26,"fats":6}'::JSONB, 'Retail', 'lunch'),
    ('Chick-fil-A Spicy Chicken Sandwich', 450, '{"protein":39,"carbs":42,"fats":18}'::JSONB, 'Retail', 'lunch'),
    ('Chick-fil-A Chicken Nuggets (8pc)', 260, '{"protein":26,"carbs":12,"fats":12}'::JSONB, 'Retail', 'lunch'),
    ('Chick-fil-A Waffle Fries', 410, '{"protein":4,"carbs":45,"fats":22}'::JSONB, 'Retail', 'lunch'),
    ('Chick-fil-A Greek Yogurt Parfait', 220, '{"protein":9,"carbs":39,"fats":2}'::JSONB, 'Retail', 'breakfast'),
    ('Chick-fil-A Egg White Grill', 290, '{"protein":27,"carbs":28,"fats":10}'::JSONB, 'Retail', 'breakfast'),
    
    -- McDonald's  
    ('McDonald''s Big Mac', 550, '{"protein":25,"carbs":45,"fats":30}'::JSONB, 'Retail', 'lunch'),
    ('McDonald''s Chicken McNuggets (6pc)', 290, '{"protein":17,"carbs":17,"fats":17}'::JSONB, 'Retail', 'lunch'),
    ('McDonald''s Cheeseburger', 305, '{"protein":15,"carbs":33,"fats":13}'::JSONB, 'Retail', 'lunch'),
    ('McDonald''s McChicken', 400, '{"protein":15,"carbs":41,"fats":20}'::JSONB, 'Retail', 'lunch'),
    ('McDonald''s Fries (Medium)', 320, '{"protein":4,"carbs":36,"fats":17}'::JSONB, 'Retail', 'lunch'),
    ('McDonald''s Egg McMuffin', 300, '{"protein":17,"carbs":30,"fats":16}'::JSONB, 'Retail', 'breakfast'),
    
    -- Subway
    ('Subway 6" Grilled Chicken Breast', 320, '{"protein":30,"carbs":35,"fats":5}'::JSONB, 'Retail', 'lunch'),
    ('Subway 6" Tuna', 350, '{"protein":20,"carbs":35,"fats":12}'::JSONB, 'Retail', 'lunch'),
    ('Subway 6" Meatball Marinara', 380, '{"protein":20,"carbs":40,"fats":15}'::JSONB, 'Retail', 'lunch'),
    ('Subway 6" Italian BMT', 410, '{"protein":20,"carbs":35,"fats":19}'::JSONB, 'Retail', 'lunch'),
    
    -- Panera
    ('Panera Roasted Turkey', 360, '{"protein":27,"carbs":38,"fats":12}'::JSONB, 'Retail', 'lunch'),
    ('Panera Half Rosted Half Sandwich', 380, '{"protein":18,"carbs":42,"fats":17}'::JSONB, 'Retail', 'lunch'),
    ('Panera Chipotle Chicken Wrap', 420, '{"protein":28,"carbs":45,"fats":17}'::JSONB, 'Retail', 'lunch'),
    
    -- Wendy's
    ('Wendy''s Dave''s Single', 440, '{"protein":25,"carbs":38,"fats":21}'::JSONB, 'Retail', 'lunch'),
    ('Wendy''s Grilled Chicken Sandwich', 360, '{"protein":33,"carbs":36,"fats":15}'::JSONB, 'Retail', 'lunch'),
    ('Wendy''s Spicy Chicken Sandwich', 440, '{"protein":27,"carbs":42,"fats":20}'::JSONB, 'Retail', 'lunch'),
    ('Wendy''s Fries (Medium)', 310, '{"protein":4,"carbs":39,"fats":15}'::JSONB, 'Retail', 'lunch'),
    
    -- Chipotle
    ('Chipotle Chicken Bowl', 570, '{"protein":53,"carbs":53,"fats":9}'::JSONB, 'Retail', 'lunch'),
    ('Chipotle Steak Bowl', 650, '{"protein":56,"carbs":54,"fats":18}'::JSONB, 'Retail', 'lunch'),
    ('Chipotle Carnitas Bowl', 720, '{"protein":47,"carbs":53,"fats":28}'::JSONB, 'Retail', 'lunch'),
    ('Chipotle Sofritas Bowl', 620, '{"protein":37,"carbs":55,"fats":28}'::JSONB, 'Retail', 'lunch'),
    
    -- Taco Bell
    ('Taco Bell Crunchy Taco', 170, '{"protein":8,"carbs":13,"fats":9}'::JSONB, 'Retail', 'lunch'),
    ('Taco Bell Burrito Supreme', 420, '{"protein":18,"carbs":39,"fats":17}'::JSONB, 'Retail', 'lunch'),
    ('Taco Bell Crunchwrap Supreme', 520, '{"protein":21,"carbs":48,"fats":27}'::JSONB, 'Retail', 'lunch'),
    ('Taco Bell Cheesy Bean and Rice Burrito', 380, '{"protein":12,"carbs":48,"fats":15}'::JSONB, 'Retail', 'lunch'),
    
    -- Pizza Hut
    ('Pizza Hut Large Pepperoni (2 slices)', 560, '{"protein":28,"carbs":56,"fats":24}'::JSONB, 'Retail', 'lunch'),
    ('Pizza Hut Large Veggie (2 slices)', 480, '{"protein":22,"carbs":56,"fats":18}'::JSONB, 'Retail', 'lunch'),
    
    -- Domino's
    ('Domino''s Large MeatZZa (2 slices)', 580, '{"protein":30,"carbs":58,"fats":26}'::JSONB, 'Retail', 'lunch'),
    ('Domino''s Large Cali Veggie (2 slices)', 490, '{"protein":20,"carbs":60,"fats":20}'::JSONB, 'Retail', 'lunch'),
    
    -- KFC
    ('KFC 2 Piece Original Chicken', 380, '{"protein":28,"carbs":9,"fats":22}'::JSONB, 'Retail', 'lunch'),
    ('KFC 2 Piece Extra Crispy Chicken', 470, '{"protein":26,"carbs":17,"fats":31}'::JSONB, 'Retail', 'lunch'),
    ('KFC Mashed Potatoes with Gravy', 130, '{"protein":2,"carbs":14,"fats":6}'::JSONB, 'Retail', 'lunch'),
    
    -- Five Guys
    ('Five Guys Hamburger', 540, '{"protein":28,"carbs":41,"fats":28}'::JSONB, 'Retail', 'lunch'),
    ('Five Guys Cheeseburger', 630, '{"protein":34,"carbs":41,"fats":36}'::JSONB, 'Retail', 'lunch'),
    ('Five Guys Fries (Regular)', 520, '{"protein":6,"carbs":60,"fats":25}'::JSONB, 'Retail', 'lunch'),
    
    -- In-N-Out (if near area)
    ('In-N-Out Hamburger', 390, '{"protein":16,"carbs":39,"fats":19}'::JSONB, 'Retail', 'lunch'),
    ('In-N-Out Double-Double', 670, '{"protein":37,"carbs":39,"fats":41}'::JSONB, 'Retail', 'lunch'),
    ('In-N-Out French Fries', 365, '{"protein":4,"carbs":48,"fats":17}'::JSONB, 'Retail', 'lunch'),
    
    -- General packaged foods
    ('Protein Bar (avg)', 250, '{"protein":20,"carbs":24,"fats":8}'::JSONB, 'Retail', 'lunch'),
    ('Protein Shake (avg)', 200, '{"protein":25,"carbs":10,"fats":3}'::JSONB, 'Retail', 'breakfast'),
    ('Greek Yogurt (6oz)', 100, '{"protein":17,"carbs":6,"fats":0}'::JSONB, 'Retail', 'breakfast'),
    ('Peanut Butter (2 tbsp)', 188, '{"protein":8,"carbs":7,"fats":16}'::JSONB, 'Retail', 'breakfast'),
    ('Almonds (1oz/23pc)', 161, '{"protein":6,"carbs":6,"fats":14}'::JSONB, 'Retail', 'lunch'),
    ('Banana (1 medium)', 105, '{"protein":1,"carbs":27,"fats":0}'::JSONB, 'Retail', 'breakfast'),
    ('Apple (1 medium)', 95, '{"protein":0,"carbs":25,"fats":0}'::JSONB, 'Retail', 'lunch'),
    ('Chicken Breast (3oz cooked)', 165, '{"protein":31,"carbs":0,"fats":4}'::JSONB, 'Retail', 'lunch'),
    ('Salmon (3oz cooked)', 175, '{"protein":19,"carbs":0,"fats":10}'::JSONB, 'Retail', 'lunch'),
    ('Brown Rice (1 cup cooked)', 215, '{"protein":5,"carbs":45,"fats":2}'::JSONB, 'Retail', 'lunch'),
    ('Sweet Potato (1 medium baked)', 103, '{"protein":2,"carbs":24,"fats":0}'::JSONB, 'Retail', 'lunch'),
    ('Broccoli (1 cup)', 55, '{"protein":4,"carbs":11,"fats":1}'::JSONB, 'Retail', 'lunch'),
    ('Oatmeal (1/2 cup dry)', 150, '{"protein":5,"carbs":27,"fats":3}'::JSONB, 'Retail', 'breakfast'),
    ('Whole Wheat Bread (1 slice)', 80, '{"protein":4,"carbs":14,"fats":1}'::JSONB, 'Retail', 'breakfast'),
    ('Cheddar Cheese (1oz)', 113, '{"protein":7,"carbs":0,"fats":9}'::JSONB, 'Retail', 'lunch'),
    ('Egg (1 large)', 78, '{"protein":6,"carbs":1,"fats":5}'::JSONB, 'Retail', 'breakfast'),
    ('Milk (1 cup whole)', 150, '{"protein":8,"carbs":12,"fats":8}'::JSONB, 'Retail', 'breakfast'),
    ('Pasta (1 cup cooked)', 221, '{"protein":8,"carbs":43,"fats":1}'::JSONB, 'Retail', 'lunch'),
    ('Salmon Fillet (6oz)', 350, '{"protein":38,"carbs":0,"fats":21}'::JSONB, 'Retail', 'dinner'),
    ('Tuna Steak (6oz)', 280, '{"protein":54,"carbs":0,"fats":1}'::JSONB, 'Retail', 'dinner'),
    ('Ground Beef 90/10 (3oz)', 180, '{"protein":20,"carbs":0,"fats":10}'::JSONB, 'Retail', 'dinner'),
    ('Chicken Thigh (3oz)', 220, '{"protein":19,"carbs":0,"fats":16}'::JSONB, 'Retail', 'dinner'),
    ('Steak (6oz)', 440, '{"protein":52,"carbs":0,"fats":24}'::JSONB, 'Retail', 'dinner'),
    ('Pork Chop (3oz)', 200, '{"protein":26,"carbs":0,"fats":10}'::JSONB, 'Retail', 'dinner'),
    ('Tofu (4oz)', 88, '{"protein":11,"carbs":2,"fats":5}'::JSONB, 'Retail', 'lunch'),
    ('Lentil Soup (1 cup)', 140, '{"protein":9,"carbs":20,"fats":1}'::JSONB, 'Retail', 'lunch'),
    ('Quinoa (1 cup cooked)', 222, '{"protein":8,"carbs":39,"fats":4}'::JSONB, 'Retail', 'lunch'),
    ('Avocado (1/2)', 120, '{"protein":1,"carbs":6,"fats":11}'::JSONB, 'Retail', 'lunch'),
    ('Olive Oil (1 tbsp)', 119, '{"protein":0,"carbs":0,"fats":14}'::JSONB, 'Retail', 'lunch'),
    ('Dark Chocolate (1oz)', 170, '{"protein":2,"carbs":16,"fats":12}'::JSONB, 'Retail', 'lunch')
) AS t(name, calories, macros, dining_court, meal_time)
WHERE NOT EXISTS (SELECT 1 FROM foods f WHERE f.name = t.name AND f.dining_court = t.dining_court);
