export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-cyan-600 animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading...</h2>
        <p className="text-gray-600 dark:text-gray-400">Please wait while we load your content</p>
      </div>
    </div>
  );
}

