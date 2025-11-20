import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200 dark:bg-cyan-900/20 rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="text-center relative z-10">
        <div className="mb-8">
          <h1 className="text-9xl font-bold gradient-text mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Oops! The page you're looking for doesn't exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:from-indigo-700 hover:to-cyan-700 transition-all shadow-lg shadow-indigo-500/30 font-medium"
          >
            Go Home
          </Link>
          <Link
            href="/chat"
            className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-all font-medium"
          >
            Try Chat
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Quick Links:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/agents" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
              Agents
            </Link>
            <Link href="/models" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
              Models
            </Link>
            <Link href="/tasks" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
              Tasks
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

