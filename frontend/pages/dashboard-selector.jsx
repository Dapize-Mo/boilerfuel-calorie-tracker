import Head from 'next/head';
import Link from 'next/link';

export default function DashboardSelector() {
  return (
    <>
      <Head>
        <title>Choose Your Dashboard Design - BoilerFuel</title>
        <meta name="description" content="Select your preferred dashboard design" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">Choose Your Dashboard</h1>
            <p className="text-xl text-slate-400">Pick the design that works best for you</p>
          </div>

          {/* Design Options Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Design 1 - Modern Card Layout */}
            <Link href="/dashboard-design1">
              <div className="group cursor-pointer">
                <div className="backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 p-6 hover:border-yellow-500/50 transition-all hover:scale-105 h-full">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-2xl mb-4">
                      🎨
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Design 1</h2>
                    <h3 className="text-lg text-yellow-400 mb-4">Modern Card Layout</h3>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="text-sm text-slate-300">
                      ✓ Glass-morphism design
                    </div>
                    <div className="text-sm text-slate-300">
                      ✓ Vibrant gradient accents
                    </div>
                    <div className="text-sm text-slate-300">
                      ✓ Spacious card-based layout
                    </div>
                    <div className="text-sm text-slate-300">
                      ✓ Large visual elements
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <div className="text-xs text-slate-400 mb-2">Preview:</div>
                    <div className="space-y-2">
                      <div className="h-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded border border-yellow-500/30"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded border border-green-500/30"></div>
                        <div className="h-12 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded border border-blue-500/30"></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="inline-block px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-xl text-yellow-300 font-semibold group-hover:bg-yellow-500 group-hover:text-slate-900 transition-all">
                      View Design 1
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Design 2 - Compact Stats Grid */}
            <Link href="/dashboard-design2">
              <div className="group cursor-pointer">
                <div className="backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 p-6 hover:border-cyan-500/50 transition-all hover:scale-105 h-full">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-2xl mb-4">
                      📊
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Design 2</h2>
                    <h3 className="text-lg text-cyan-400 mb-4">Compact Stats Grid</h3>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="text-sm text-slate-300">
                      ✓ Dense information layout
                    </div>
                    <div className="text-sm text-slate-300">
                      ✓ Maximum data visibility
                    </div>
                    <div className="text-sm text-slate-300">
                      ✓ Efficient use of space
                    </div>
                    <div className="text-sm text-slate-300">
                      ✓ Perfect for power users
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <div className="text-xs text-slate-400 mb-2">Preview:</div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-1">
                        <div className="h-6 bg-yellow-500/20 rounded border border-yellow-500/30"></div>
                        <div className="h-6 bg-orange-500/20 rounded border border-orange-500/30"></div>
                        <div className="h-6 bg-cyan-500/20 rounded border border-cyan-500/30"></div>
                        <div className="h-6 bg-green-500/20 rounded border border-green-500/30"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-16 bg-slate-800/50 rounded border border-slate-600"></div>
                        <div className="h-16 bg-slate-800/50 rounded border border-slate-600"></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="inline-block px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-xl text-cyan-300 font-semibold group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all">
                      View Design 2
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Design 3 - Minimalist Single Column */}
            <Link href="/dashboard-design3">
              <div className="group cursor-pointer">
                <div className="backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 p-6 hover:border-purple-500/50 transition-all hover:scale-105 h-full">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl mb-4">
                      ✨
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Design 3</h2>
                    <h3 className="text-lg text-purple-400 mb-4">Minimalist Single Column</h3>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="text-sm text-slate-300">
                      ✓ Clean, distraction-free
                    </div>
                    <div className="text-sm text-slate-300">
                      ✓ Simple and elegant
                    </div>
                    <div className="text-sm text-slate-300">
                      ✓ Easy to read and scan
                    </div>
                    <div className="text-sm text-slate-300">
                      ✓ Mobile-friendly design
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-white rounded-lg p-3 border border-slate-300">
                    <div className="text-xs text-slate-600 mb-2">Preview:</div>
                    <div className="space-y-2">
                      <div className="h-px bg-slate-300"></div>
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-px bg-slate-300"></div>
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-px bg-slate-300"></div>
                      <div className="h-4 bg-slate-200 rounded"></div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="inline-block px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl text-purple-300 font-semibold group-hover:bg-purple-500 group-hover:text-white transition-all">
                      View Design 3
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Back */}
          <div className="text-center mt-12">
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-xl text-white font-semibold transition-all"
            >
              ← Back to Original Dashboard
            </Link>
          </div>

          {/* Info Section */}
          <div className="mt-12 backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4">About These Designs</h3>
            <div className="text-slate-300 space-y-2">
              <p>
                Each dashboard design offers the same functionality with different visual styles:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Design 1</strong> uses modern glass-morphism effects and vibrant gradients for a premium feel</li>
                <li><strong>Design 2</strong> maximizes information density with a compact grid layout ideal for power users</li>
                <li><strong>Design 3</strong> embraces minimalism with a clean, distraction-free single-column design</li>
              </ul>
              <p className="mt-4 text-sm text-slate-400">
                All designs are fully functional with your existing data. Try each one to find your favorite!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
