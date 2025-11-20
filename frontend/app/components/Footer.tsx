import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold gradient-text">MindCubes</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Advanced AI Agent platform with highly skilled agents, each perfecting a single task. 
              Train, fine-tune, and deploy AI models with ease.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/agents" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  AI Agents
                </Link>
              </li>
              <li>
                <Link href="/models" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Models
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Chat Interface
                </Link>
              </li>
              <li>
                <Link href="/tasks" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Task Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#about" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} MindCubes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

