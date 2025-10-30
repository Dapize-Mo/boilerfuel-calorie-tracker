import { ensureSchema, query } from '../../utils/db';
import { requireAdmin } from '../../utils/jwt';

// Comprehensive exercise database with Purdue Rec Center equipment
const EXERCISES = [
  // Purdue Rec Center Specific Equipment
  { name: 'Treadmill', calories_per_hour: 550, category: 'cardio', intensity: 'moderate', muscle_groups: ['legs', 'core'], equipment: 'treadmill', description: 'Popular cardio equipment at Purdue Rec - walk, jog, or run at your own pace.' },
  { name: 'Elliptical Machine', calories_per_hour: 400, category: 'cardio', intensity: 'moderate', muscle_groups: ['legs', 'arms'], equipment: 'elliptical', description: 'Low-impact full-body cardio available at Purdue Rec.' },
  { name: 'Stationary Bike', calories_per_hour: 420, category: 'cardio', intensity: 'moderate', muscle_groups: ['legs', 'core'], equipment: 'stationary bike', description: 'Recumbent and upright bikes available at Purdue Rec.' },
  { name: 'Rowing Machine', calories_per_hour: 520, category: 'cardio', intensity: 'vigorous', muscle_groups: ['back', 'legs', 'arms', 'core'], equipment: 'rowing machine', description: 'Full-body cardio workout machine at Purdue Rec.' },
  { name: 'StairMaster', calories_per_hour: 500, category: 'cardio', intensity: 'vigorous', muscle_groups: ['legs', 'glutes'], equipment: 'stair climber', description: 'Intense stair climbing machine for lower body cardio.' },
  { name: 'Arc Trainer', calories_per_hour: 450, category: 'cardio', intensity: 'moderate', muscle_groups: ['legs', 'glutes'], equipment: 'arc trainer', description: 'Low-impact alternative to elliptical and treadmill.' },
  { name: 'VersaClimber', calories_per_hour: 600, category: 'cardio', intensity: 'vigorous', muscle_groups: ['full body'], equipment: 'versa climber', description: 'Vertical climbing machine for intense full-body cardio.' },
  { name: 'Assault Bike', calories_per_hour: 650, category: 'cardio', intensity: 'vigorous', muscle_groups: ['legs', 'arms', 'core'], equipment: 'assault bike', description: 'High-intensity air resistance bike for HIIT workouts.' },
  { name: 'Indoor Track Running', calories_per_hour: 580, category: 'cardio', intensity: 'vigorous', muscle_groups: ['legs', 'core'], equipment: null, description: 'Use the Purdue Rec indoor track for running.' },
  { name: 'Basketball (Rec)', calories_per_hour: 480, category: 'sports', intensity: 'vigorous', muscle_groups: ['legs', 'full body'], equipment: 'basketball', description: 'Play on Purdue Rec basketball courts.' },
  { name: 'Racquetball', calories_per_hour: 450, category: 'sports', intensity: 'vigorous', muscle_groups: ['legs', 'arms', 'core'], equipment: 'racquet', description: 'Use Purdue Rec racquetball courts.' },
  { name: 'Swimming (Lap)', calories_per_hour: 550, category: 'cardio', intensity: 'moderate', muscle_groups: ['full body'], equipment: null, description: 'Lap swimming at Purdue Aquatic Center.' },
  { name: 'Water Aerobics', calories_per_hour: 320, category: 'cardio', intensity: 'light', muscle_groups: ['full body'], equipment: null, description: 'Low-impact aquatic exercise classes at Purdue pool.' },
  { name: 'Group Fitness Class', calories_per_hour: 400, category: 'cardio', intensity: 'moderate', muscle_groups: ['full body'], equipment: null, description: 'Purdue Rec offers various group fitness classes (Zumba, Spin, Boot Camp, etc.).' },
  { name: 'Yoga Class', calories_per_hour: 200, category: 'flexibility', intensity: 'light', muscle_groups: ['full body'], equipment: null, description: 'Yoga classes offered at Purdue Rec.' },
  { name: 'Rock Climbing Wall', calories_per_hour: 500, category: 'sports', intensity: 'vigorous', muscle_groups: ['arms', 'back', 'core', 'legs'], equipment: 'climbing gear', description: 'Indoor rock climbing at Purdue Rec climbing wall.' },
  { name: 'Massage Chair', calories_per_hour: 50, category: 'flexibility', intensity: 'light', muscle_groups: ['full body'], equipment: 'massage chair', description: 'Recovery and relaxation in Purdue Rec massage chairs.' },
  { name: 'Foam Rolling', calories_per_hour: 80, category: 'flexibility', intensity: 'light', muscle_groups: ['full body'], equipment: 'foam roller', description: 'Self-myofascial release for recovery at Purdue Rec.' },
  { name: 'Free Weights (General)', calories_per_hour: 220, category: 'strength', intensity: 'moderate', muscle_groups: ['full body'], equipment: 'dumbbells', description: 'General free weight training at Purdue Rec weight room.' },
  { name: 'Cable Machine Workout', calories_per_hour: 200, category: 'strength', intensity: 'moderate', muscle_groups: ['full body'], equipment: 'cable machine', description: 'Use Purdue Rec cable machines for various exercises.' },
  { name: 'Smith Machine Workout', calories_per_hour: 240, category: 'strength', intensity: 'moderate', muscle_groups: ['full body'], equipment: 'smith machine', description: 'Guided barbell exercises at Purdue Rec.' },
  { name: 'Battle Ropes', calories_per_hour: 550, category: 'cardio', intensity: 'vigorous', muscle_groups: ['arms', 'shoulders', 'core'], equipment: 'battle ropes', description: 'High-intensity rope training available at Purdue Rec functional area.' },
  { name: 'TRX Suspension Training', calories_per_hour: 350, category: 'strength', intensity: 'moderate', muscle_groups: ['full body'], equipment: 'TRX straps', description: 'Bodyweight suspension training at Purdue Rec.' },
  { name: 'Kettlebell Workout', calories_per_hour: 400, category: 'strength', intensity: 'vigorous', muscle_groups: ['full body'], equipment: 'kettlebell', description: 'Dynamic kettlebell exercises at Purdue Rec functional area.' },
  { name: 'Medicine Ball Workout', calories_per_hour: 320, category: 'strength', intensity: 'moderate', muscle_groups: ['core', 'full body'], equipment: 'medicine ball', description: 'Core and power training with medicine balls at Purdue Rec.' },
  { name: 'Plyo Box Jumps', calories_per_hour: 450, category: 'cardio', intensity: 'vigorous', muscle_groups: ['legs', 'glutes'], equipment: 'plyo box', description: 'Plyometric box jump training at Purdue Rec.' },
  { name: 'Sauna Session', calories_per_hour: 150, category: 'flexibility', intensity: 'light', muscle_groups: [], equipment: null, description: 'Recovery and relaxation in Purdue Rec sauna.' },

  // Standard Exercises
  { name: 'Running', calories_per_hour: 600, category: 'cardio', intensity: 'vigorous', muscle_groups: ['legs', 'core'], equipment: null, description: 'High-intensity cardiovascular exercise that builds endurance and burns calories.' },
  { name: 'Walking', calories_per_hour: 280, category: 'cardio', intensity: 'light', muscle_groups: ['legs'], equipment: null, description: 'Low-impact cardio suitable for all fitness levels.' },
  { name: 'Cycling', calories_per_hour: 500, category: 'cardio', intensity: 'moderate', muscle_groups: ['legs', 'core'], equipment: 'bicycle', description: 'Low-impact cardio that builds leg strength and endurance.' },
  { name: 'Swimming', calories_per_hour: 550, category: 'cardio', intensity: 'moderate', muscle_groups: ['full body'], equipment: null, description: 'Full-body workout with minimal joint impact.' },
  { name: 'Jump Rope', calories_per_hour: 700, category: 'cardio', intensity: 'vigorous', muscle_groups: ['legs', 'shoulders'], equipment: 'jump rope', description: 'High-intensity cardio that improves coordination and agility.' },
  { name: 'Stair Climbing', calories_per_hour: 480, category: 'cardio', intensity: 'vigorous', muscle_groups: ['legs', 'glutes'], equipment: null, description: 'Intense lower body cardio workout.' },

  // Strength exercises
  { name: 'Bench Press', calories_per_hour: 200, category: 'strength', intensity: 'moderate', muscle_groups: ['chest', 'triceps', 'shoulders'], equipment: 'barbell', description: 'Compound exercise for building chest strength and size.' },
  { name: 'Dumbbell Chest Press', calories_per_hour: 180, category: 'strength', intensity: 'moderate', muscle_groups: ['chest', 'triceps', 'shoulders'], equipment: 'dumbbell', description: 'Allows for greater range of motion than barbell bench press.' },
  { name: 'Push-ups', calories_per_hour: 240, category: 'strength', intensity: 'moderate', muscle_groups: ['chest', 'triceps', 'shoulders', 'core'], equipment: 'bodyweight', description: 'Classic bodyweight exercise for chest and triceps.' },
  { name: 'Chest Fly', calories_per_hour: 160, category: 'strength', intensity: 'light', muscle_groups: ['chest'], equipment: 'dumbbell', description: 'Isolation exercise targeting the chest muscles.' },
  { name: 'Deadlift', calories_per_hour: 300, category: 'strength', intensity: 'vigorous', muscle_groups: ['back', 'legs', 'glutes', 'core'], equipment: 'barbell', description: 'Compound exercise that builds full posterior chain strength.' },
  { name: 'Pull-ups', calories_per_hour: 260, category: 'strength', intensity: 'vigorous', muscle_groups: ['back', 'biceps'], equipment: 'pull-up bar', description: 'Bodyweight exercise for back and bicep development.' },
  { name: 'Barbell Row', calories_per_hour: 220, category: 'strength', intensity: 'moderate', muscle_groups: ['back', 'biceps'], equipment: 'barbell', description: 'Compound rowing movement for back thickness.' },
  { name: 'Lat Pulldown', calories_per_hour: 180, category: 'strength', intensity: 'moderate', muscle_groups: ['back', 'biceps'], equipment: 'cable machine', description: 'Machine exercise for building lat width.' },
  { name: 'Squats', calories_per_hour: 280, category: 'strength', intensity: 'vigorous', muscle_groups: ['legs', 'glutes', 'core'], equipment: 'barbell', description: 'King of leg exercises, builds overall lower body strength.' },
  { name: 'Leg Press', calories_per_hour: 240, category: 'strength', intensity: 'moderate', muscle_groups: ['legs', 'glutes'], equipment: 'leg press machine', description: 'Machine exercise for building leg strength with less core demand.' },
  { name: 'Lunges', calories_per_hour: 220, category: 'strength', intensity: 'moderate', muscle_groups: ['legs', 'glutes'], equipment: 'dumbbell', description: 'Unilateral exercise for leg strength and balance.' },
  { name: 'Leg Curl', calories_per_hour: 160, category: 'strength', intensity: 'light', muscle_groups: ['hamstrings'], equipment: 'machine', description: 'Isolation exercise for hamstring development.' },
  { name: 'Calf Raises', calories_per_hour: 140, category: 'strength', intensity: 'light', muscle_groups: ['calves'], equipment: 'bodyweight or machine', description: 'Targeted exercise for calf development.' },
  { name: 'Overhead Press', calories_per_hour: 200, category: 'strength', intensity: 'moderate', muscle_groups: ['shoulders', 'triceps', 'core'], equipment: 'barbell', description: 'Compound pressing movement for shoulder strength.' },
  { name: 'Dumbbell Shoulder Press', calories_per_hour: 180, category: 'strength', intensity: 'moderate', muscle_groups: ['shoulders', 'triceps'], equipment: 'dumbbell', description: 'Allows for natural pressing motion and shoulder development.' },
  { name: 'Lateral Raises', calories_per_hour: 140, category: 'strength', intensity: 'light', muscle_groups: ['shoulders'], equipment: 'dumbbell', description: 'Isolation exercise for side deltoids.' },
  { name: 'Bicep Curls', calories_per_hour: 150, category: 'strength', intensity: 'light', muscle_groups: ['biceps'], equipment: 'dumbbell', description: 'Classic bicep isolation exercise.' },
  { name: 'Tricep Dips', calories_per_hour: 200, category: 'strength', intensity: 'moderate', muscle_groups: ['triceps', 'chest', 'shoulders'], equipment: 'bodyweight', description: 'Compound bodyweight exercise for triceps.' },
  { name: 'Hammer Curls', calories_per_hour: 150, category: 'strength', intensity: 'light', muscle_groups: ['biceps', 'forearms'], equipment: 'dumbbell', description: 'Neutral-grip curl for biceps and forearm development.' },
  { name: 'Planks', calories_per_hour: 180, category: 'strength', intensity: 'moderate', muscle_groups: ['core'], equipment: 'bodyweight', description: 'Isometric core exercise for stability and strength.' },
  { name: 'Crunches', calories_per_hour: 160, category: 'strength', intensity: 'light', muscle_groups: ['abs'], equipment: 'bodyweight', description: 'Classic abdominal exercise.' },
  { name: 'Russian Twists', calories_per_hour: 200, category: 'strength', intensity: 'moderate', muscle_groups: ['core', 'obliques'], equipment: 'bodyweight or medicine ball', description: 'Rotational core exercise for obliques.' },

  // Flexibility
  { name: 'Yoga', calories_per_hour: 200, category: 'flexibility', intensity: 'light', muscle_groups: ['full body'], equipment: null, description: 'Mind-body practice improving flexibility, strength, and balance.' },
  { name: 'Stretching', calories_per_hour: 120, category: 'flexibility', intensity: 'light', muscle_groups: ['full body'], equipment: null, description: 'Improves flexibility and range of motion.' },
  { name: 'Pilates', calories_per_hour: 240, category: 'flexibility', intensity: 'moderate', muscle_groups: ['core', 'full body'], equipment: null, description: 'Low-impact exercise focusing on core strength and flexibility.' },

  // Sports
  { name: 'Basketball', calories_per_hour: 480, category: 'sports', intensity: 'vigorous', muscle_groups: ['legs', 'full body'], equipment: 'basketball', description: 'High-intensity team sport combining cardio and agility.' },
  { name: 'Tennis', calories_per_hour: 420, category: 'sports', intensity: 'moderate', muscle_groups: ['arms', 'legs', 'core'], equipment: 'tennis racket', description: 'Improves agility, coordination, and cardiovascular fitness.' },
  { name: 'Soccer', calories_per_hour: 500, category: 'sports', intensity: 'vigorous', muscle_groups: ['legs', 'full body'], equipment: 'soccer ball', description: 'High-intensity sport with constant movement and sprinting.' },
  { name: 'Boxing', calories_per_hour: 650, category: 'sports', intensity: 'vigorous', muscle_groups: ['arms', 'shoulders', 'core', 'legs'], equipment: 'gloves', description: 'High-intensity combat sport combining cardio and power.' },

  // HIIT
  { name: 'HIIT Training', calories_per_hour: 600, category: 'cardio', intensity: 'vigorous', muscle_groups: ['full body'], equipment: null, description: 'High-intensity interval training for maximum calorie burn.' },
  { name: 'Circuit Training', calories_per_hour: 500, category: 'strength', intensity: 'vigorous', muscle_groups: ['full body'], equipment: 'various', description: 'Combination of strength and cardio exercises performed in sequence.' },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req);
    await ensureSchema();

    let added = 0;
    let skipped = 0;

    for (const exercise of EXERCISES) {
      // Check if exercise already exists
      const existing = await query(
        'SELECT id FROM activities WHERE name = $1',
        [exercise.name]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Insert new exercise
      await query(
        `INSERT INTO activities (name, calories_per_hour, category, intensity, muscle_groups, equipment, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          exercise.name,
          exercise.calories_per_hour,
          exercise.category,
          exercise.intensity,
          JSON.stringify(exercise.muscle_groups || []),
          exercise.equipment,
          exercise.description,
        ]
      );
      added++;
    }

    return res.status(200).json({
      message: `Successfully initialized exercise database. Added ${added} exercises, skipped ${skipped} existing.`,
      added,
      skipped,
      total: EXERCISES.length,
    });
  } catch (error) {
    console.error('Init exercises error:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Failed to initialize exercises'
    });
  }
}
