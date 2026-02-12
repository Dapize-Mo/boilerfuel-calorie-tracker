import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CommandPalette - Keyboard-first universal search and command interface
 * Triggered with Cmd/Ctrl+K
 */
export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Commands and navigation items
  const commands = [
    // Navigation
    { id: 'nav-home', label: 'Go to Dashboard', icon: '🏠', action: () => router.push('/'), category: 'Navigation' },
    { id: 'nav-insights', label: 'Insights & Analytics', icon: '📊', action: () => router.push('/insights'), category: 'Navigation' },
    { id: 'nav-menu', label: 'Browse Dining Menu', icon: '🍽️', action: () => router.push('/food-dashboard-glass'), category: 'Navigation' },
    { id: 'nav-gym', label: 'Gym Tracker', icon: '💪', action: () => router.push('/gym-modern'), category: 'Navigation' },
    { id: 'nav-profile', label: 'Profile & Goals', icon: '👤', action: () => router.push('/profile'), category: 'Navigation' },
    { id: 'nav-about', label: 'About BoilerFuel', icon: 'ℹ️', action: () => router.push('/about'), category: 'Navigation' },
    { id: 'nav-onboarding', label: 'Setup Wizard', icon: '🎯', action: () => router.push('/onboarding'), category: 'Navigation' },
    
    // Actions
    { id: 'action-log-meal', label: 'Log a Meal', icon: '🍔', action: () => alert('Log meal modal - TODO'), category: 'Actions' },
    { id: 'action-add-workout', label: 'Add Workout', icon: '🏋️', action: () => router.push('/gym'), category: 'Actions' },
    { id: 'action-set-goal', label: 'Set Daily Goal', icon: '🎯', action: () => router.push('/profile'), category: 'Actions' },
    
    // Dining Courts
    { id: 'menu-earhart', label: 'Earhart Menu', icon: '🏛️', action: () => router.push('/food-dashboard-glass?court=earhart'), category: 'Dining Courts' },
    { id: 'menu-windsor', label: 'Windsor Menu', icon: '🏰', action: () => router.push('/food-dashboard-glass?court=windsor'), category: 'Dining Courts' },
    { id: 'menu-wiley', label: 'Wiley Menu', icon: '🏫', action: () => router.push('/food-dashboard-glass?court=wiley'), category: 'Dining Courts' },
    { id: 'menu-ford', label: 'Ford Menu', icon: '🏢', action: () => router.push('/food-dashboard-glass?court=ford'), category: 'Dining Courts' },
  ];

  // Filter commands based on search
  const filteredCommands = search
    ? commands.filter(cmd => 
        cmd.label.toLowerCase().includes(search.toLowerCase()) ||
        cmd.category.toLowerCase().includes(search.toLowerCase())
      )
    : commands;

  // Open/close with Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearch('');
        setSelectedIndex(0);
      }

      if (!isOpen) return;

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, search, selectedIndex, filteredCommands]);

  const executeCommand = useCallback((command) => {
    command.action();
    setIsOpen(false);
    setSearch('');
    setSelectedIndex(0);
  }, []);

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Command Palette */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ 
                type: 'spring',
                damping: 25,
                stiffness: 300
              }}
              className="w-full max-w-2xl bg-theme-card-bg border border-theme-card-border rounded-2xl shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              {/* Search Input */}
              <div className="p-4 border-b border-theme-border-primary">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔍</span>
                  <input
                    type="text"
                    placeholder="Search commands or navigate..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSelectedIndex(0);
                    }}
                    className="flex-1 bg-transparent text-theme-text-primary placeholder-theme-text-tertiary outline-none text-lg"
                    autoFocus
                  />
                  <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-theme-bg-tertiary border border-theme-border-primary rounded">
                    <span>ESC</span>
                  </kbd>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                {Object.keys(groupedCommands).length === 0 ? (
                  <div className="p-8 text-center text-theme-text-tertiary">
                    <p>No commands found</p>
                    <p className="text-sm mt-2">Try searching for &quot;menu&quot;, &quot;gym&quot;, or &quot;profile&quot;</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {Object.entries(groupedCommands).map(([category, cmds]) => (
                      <div key={category} className="mb-4 last:mb-0">
                        <div className="px-3 py-2 text-xs font-semibold text-theme-text-tertiary uppercase tracking-wider">
                          {category}
                        </div>
                        {cmds.map((cmd, idx) => {
                          const globalIndex = filteredCommands.indexOf(cmd);
                          const isSelected = globalIndex === selectedIndex;
                          
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => executeCommand(cmd)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                                isSelected 
                                  ? 'bg-theme-accent text-white' 
                                  : 'hover:bg-theme-bg-hover text-theme-text-primary'
                              }`}
                            >
                              <span className="text-2xl">{cmd.icon}</span>
                              <span className="flex-1 font-medium">{cmd.label}</span>
                              {isSelected && (
                                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono bg-white/20 rounded">
                                  ↵
                                </kbd>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Hint */}
              <div className="p-3 border-t border-theme-border-primary bg-theme-bg-tertiary/50">
                <div className="flex items-center justify-between text-xs text-theme-text-tertiary">
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline">↑↓ Navigate</span>
                    <span className="hidden sm:inline">↵ Select</span>
                    <span>ESC Close</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-theme-bg-secondary border border-theme-border-primary rounded text-2xs font-mono">
                      {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                    </kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 bg-theme-bg-secondary border border-theme-border-primary rounded text-2xs font-mono">
                      K
                    </kbd>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
