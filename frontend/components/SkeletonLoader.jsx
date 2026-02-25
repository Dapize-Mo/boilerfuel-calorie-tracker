/**
 * SkeletonLoader — Animated placeholder screens shown while content loads.
 * Adapts to the current theme (light/dark) via CSS variables.
 */

const shimmerClass = 'animate-pulse bg-theme-text-primary/[0.06]';

/** Generic rectangular skeleton block */
function SkeletonBlock({ className = '', style = {} }) {
  return <div className={`${shimmerClass} rounded ${className}`} style={style} />;
}

/** A single food-row skeleton (matches the food table row layout) */
function FoodRowSkeleton({ index = 0 }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-theme-text-primary/5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Star / favorite placeholder */}
      <SkeletonBlock className="w-4 h-4 rounded-full shrink-0" />
      {/* Food name */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <SkeletonBlock className="h-3.5 rounded" style={{ width: `${55 + (index % 4) * 10}%` }} />
        <SkeletonBlock className="h-2.5 rounded" style={{ width: `${30 + (index % 3) * 8}%` }} />
      </div>
      {/* Calorie badge */}
      <SkeletonBlock className="w-10 h-5 rounded shrink-0" />
      {/* Action buttons */}
      <div className="flex gap-1 shrink-0">
        <SkeletonBlock className="w-6 h-6 rounded" />
        <SkeletonBlock className="w-6 h-6 rounded" />
      </div>
    </div>
  );
}

/** Station header skeleton */
function StationHeaderSkeleton() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 mt-2">
      <SkeletonBlock className="h-3 rounded" style={{ width: '120px' }} />
    </div>
  );
}

/** Full menu/food-table skeleton (landing → results transition) */
export function MenuSkeleton({ rowCount = 12 }) {
  const rows = [];
  let foodIdx = 0;

  for (let i = 0; i < rowCount; i++) {
    // Insert a station header every 4-6 rows
    if (i === 0 || i === 5 || i === 9) {
      rows.push(<StationHeaderSkeleton key={`sh-${i}`} />);
    }
    rows.push(<FoodRowSkeleton key={`fr-${i}`} index={foodIdx++} />);
  }

  return (
    <div className="space-y-0">
      {/* Summary bar skeleton */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-theme-text-primary/10 px-4">
        <SkeletonBlock className="h-3 rounded" style={{ width: '100px' }} />
        <SkeletonBlock className="h-3 rounded" style={{ width: '60px' }} />
      </div>

      {/* Search bar skeleton */}
      <div className="flex items-center gap-2 mb-4 px-4">
        <SkeletonBlock className="flex-1 h-8 rounded" />
        <SkeletonBlock className="w-8 h-8 rounded" />
        <SkeletonBlock className="w-16 h-8 rounded" />
      </div>

      {/* Food rows */}
      {rows}
    </div>
  );
}

/** Profile page skeleton */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <SkeletonBlock className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-5 rounded" style={{ width: '180px' }} />
          <SkeletonBlock className="h-3 rounded" style={{ width: '120px' }} />
        </div>
      </div>

      {/* Goals section */}
      <div className="space-y-3">
        <SkeletonBlock className="h-4 rounded" style={{ width: '100px' }} />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <SkeletonBlock className="h-3 rounded" style={{ width: '60px' }} />
              <SkeletonBlock className="h-3 rounded" style={{ width: '80px' }} />
            </div>
            <SkeletonBlock className="h-2 rounded-full w-full" />
          </div>
        ))}
      </div>

      {/* Meal log section */}
      <div className="space-y-2">
        <SkeletonBlock className="h-4 rounded" style={{ width: '120px' }} />
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 border border-theme-text-primary/5 rounded">
            <SkeletonBlock className="flex-1 h-4 rounded" />
            <SkeletonBlock className="w-12 h-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stats page skeleton */
export function StatsSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Date navigation */}
      <div className="flex items-center justify-center gap-4">
        <SkeletonBlock className="w-8 h-8 rounded" />
        <SkeletonBlock className="h-5 rounded" style={{ width: '160px' }} />
        <SkeletonBlock className="w-8 h-8 rounded" />
      </div>

      {/* Chart area */}
      <div className="border border-theme-text-primary/10 rounded-lg p-4">
        <SkeletonBlock className="h-4 rounded mb-4" style={{ width: '100px' }} />
        <div className="flex items-end gap-1 h-32">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <SkeletonBlock
                className="w-full rounded-t"
                style={{ height: `${30 + Math.random() * 70}%` }}
              />
              <SkeletonBlock className="h-2 rounded" style={{ width: '20px' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Pie chart area */}
      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <SkeletonBlock className="w-40 h-40 rounded-full" />
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2">
              <SkeletonBlock className="w-3 h-3 rounded" />
              <SkeletonBlock className="h-3 rounded" style={{ width: '80px' }} />
              <SkeletonBlock className="h-3 rounded" style={{ width: '40px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Generic card skeleton */
export function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`border border-theme-text-primary/10 rounded-lg p-4 space-y-3 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <SkeletonBlock
          key={i}
          className="h-3 rounded"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export default MenuSkeleton;
