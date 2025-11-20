import Link from 'next/link';

export default function Register() {
  return (
    <main className="h-screen w-full overflow-hidden futuristic-bg flex items-center justify-center relative">
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md p-8 glass-panel rounded-2xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 mx-auto">
              <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400 text-sm">Join MindCubes today</p>
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">First Name</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Last Name</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Password</label>
            <input
              type="password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors mt-6">
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
