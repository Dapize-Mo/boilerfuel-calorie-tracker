import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

/**
 * BottomNav - Mobile-optimized bottom navigation bar
 * Shows on screens <768px, replaces sidebar navigation
 */
export default function BottomNav() {
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/food-dashboard-glass', label: 'Menu', icon: MenuIcon },
    { href: '#', label: 'Log', icon: PlusIcon, isAction: true }, // Special FAB-style button
    { href: '/gym-modern', label: 'Gym', icon: GymIcon },
    { href: '/profile', label: 'Profile', icon: ProfileIcon },
  ];

  const isActive = (href) => {
    if (href === '/') return router.pathname === '/';
    return router.pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-theme-card-bg border-t border-theme-card-border z-30 safe-area-bottom">
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.isAction) {
            // Special FAB-style log button (elevated)
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 shadow-lg flex items-center justify-center"
                >
                  <Icon className="w-7 h-7 text-white" />
                </motion.div>
                <span className="text-2xs mt-1 font-medium text-theme-text-secondary">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                active ? 'text-theme-accent' : 'text-theme-text-secondary'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`} />
                {active && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-theme-accent"
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                )}
              </div>
              <span className={`text-2xs mt-1 font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Icon Components
function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function MenuIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function GymIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12h15m0 0l-3.5-3.5M19.5 12l-3.5 3.5M4.5 6.5h15M4.5 17.5h15" />
    </svg>
  );
}

function ProfileIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
