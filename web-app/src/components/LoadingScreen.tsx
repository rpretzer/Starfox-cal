export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sprint Calendar</h2>
        <p className="text-gray-600">Initializing...</p>
      </div>
    </div>
  );
}

