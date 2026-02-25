import { useState, useEffect, useRef } from 'react';
import { LOCATION_CATEGORIES, FOOD_CO_LOCATIONS } from '../utils/diningLocations';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function LocationDropdown({ value, onChange, availableLocations, retailLocations, compact = false }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [dropdownMaxH, setDropdownMaxH] = useState('24rem');
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleToggle() {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const available = window.innerHeight - rect.bottom - 8;
      setDropdownMaxH(`${Math.max(180, available)}px`);
    }
    setOpen(o => !o);
  }

  const availSet = new Set((availableLocations || []).map(l => l.toLowerCase()));
  const filteredCategories = LOCATION_CATEGORIES.map(cat => ({
    ...cat,
    locations: cat.locations.filter(loc => availSet.has(loc.toLowerCase())),
  })).filter(cat => cat.locations.length > 0);

  const foodCoList = (retailLocations && retailLocations.length > 0)
    ? retailLocations
    : FOOD_CO_LOCATIONS.map(l => l.name);

  const displayText = value.type === 'all' ? 'All Locations'
    : value.type === 'all-purdue' ? 'All Purdue'
    : value.type === 'all-foodco' ? 'Purdue Food Co'
    : value.type === 'category' ? value.value
    : value.value;

  function select(newVal) {
    onChange(newVal);
    setOpen(false);
  }

  const isActive = (type, val) => value.type === type && value.value === val;

  function toggleGroup(group) {
    setExpanded(prev => prev === group ? null : group);
  }

  return (
    <div ref={ref} className="relative" data-location-dropdown>
      <button type="button" onClick={handleToggle}
        className={`w-full border bg-theme-bg-secondary text-theme-text-primary text-left font-mono flex items-center justify-between hover:bg-theme-bg-hover transition-all ${
          compact ? 'px-2 py-1.5 border-theme-text-primary/30 text-sm gap-2' : 'p-2 border-theme-text-primary gap-3'
        }`}>
        <span className="whitespace-nowrap truncate">{displayText}</span>
        <svg width={compact ? 12 : 14} height={compact ? 12 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: `transform 0.2s ${EASE}` }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto border border-theme-text-primary bg-theme-bg-primary shadow-lg"
          style={{ animation: `fadeInTooltip 0.15s ${EASE} both`, maxHeight: dropdownMaxH }}>
          <button type="button" onClick={() => select({ type: 'all', value: 'All' })}
            className={`w-full text-left px-3 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
              isActive('all', 'All') ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-hover text-theme-text-primary'
            }`}>
            All Locations
          </button>

          <div className="border-t border-theme-text-primary/20">
            <button type="button"
              onClick={() => toggleGroup('purdue')}
              className={`w-full text-left px-3 py-2.5 text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-between transition-colors ${
                (value.type === 'all-purdue' || (value.type === 'category' && LOCATION_CATEGORIES.some(c => c.label === value.value)) || (value.type === 'single' && availSet.has(value.value?.toLowerCase())))
                  ? 'bg-theme-text-primary/10 text-theme-text-primary'
                  : 'bg-theme-bg-tertiary/50 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover'
              }`}>
              <span>All Purdue</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-50"
                style={{ transform: expanded === 'purdue' ? 'rotate(180deg)' : 'rotate(0)', transition: `transform 0.2s ${EASE}` }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expanded === 'purdue' && (
              <div>
                <button type="button"
                  onClick={() => select({ type: 'all-purdue', value: 'All Purdue', locations: filteredCategories.flatMap(c => c.locations) })}
                  className={`w-full text-left px-5 py-1.5 text-sm font-bold transition-colors ${
                    isActive('all-purdue', 'All Purdue') ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-hover text-theme-text-primary'
                  }`}>
                  All Purdue Dining
                </button>

                {filteredCategories.map(cat => (
                  <div key={cat.label}>
                    <button type="button"
                      onClick={() => select({ type: 'category', value: cat.label, locations: cat.locations })}
                      className={`w-full text-left px-5 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                        isActive('category', cat.label)
                          ? 'bg-theme-text-primary text-theme-bg-primary'
                          : 'text-theme-text-tertiary hover:bg-theme-bg-hover hover:text-theme-text-secondary'
                      }`}>
                      {cat.label}
                    </button>
                    {cat.locations.map(loc => (
                      <button key={loc} type="button"
                        onClick={() => select({ type: 'single', value: loc })}
                        className={`w-full text-left px-8 py-1 text-sm transition-colors ${
                          isActive('single', loc)
                            ? 'bg-theme-text-primary text-theme-bg-primary'
                            : 'hover:bg-theme-bg-hover text-theme-text-primary'
                        }`}>
                        {loc}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-theme-text-primary/20">
            <button type="button"
              onClick={() => toggleGroup('foodco')}
              className={`w-full text-left px-3 py-2.5 text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-between transition-colors ${
                (value.type === 'all-foodco' || (value.type === 'single' && foodCoList.some(n => n === value.value)))
                  ? 'bg-theme-text-primary/10 text-theme-text-primary'
                  : 'bg-theme-bg-tertiary/50 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover'
              }`}>
              <span>Purdue Food Co</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-50"
                style={{ transform: expanded === 'foodco' ? 'rotate(180deg)' : 'rotate(0)', transition: `transform 0.2s ${EASE}` }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expanded === 'foodco' && (
              <div>
                <button type="button"
                  onClick={() => select({ type: 'all-foodco', value: 'Purdue Food Co', locations: foodCoList })}
                  className={`w-full text-left px-5 py-1.5 text-sm font-bold transition-colors ${
                    isActive('all-foodco', 'Purdue Food Co') ? 'bg-theme-text-primary text-theme-bg-primary' : 'hover:bg-theme-bg-hover text-theme-text-primary'
                  }`}>
                  All Food Co
                </button>

                {foodCoList.map(name => (
                  <button key={name} type="button"
                    onClick={() => select({ type: 'single', value: name, source: 'foodco' })}
                    className={`w-full text-left px-8 py-1 text-sm transition-colors ${
                      isActive('single', name)
                        ? 'bg-theme-text-primary text-theme-bg-primary'
                        : 'hover:bg-theme-bg-hover text-theme-text-primary'
                    }`}>
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
