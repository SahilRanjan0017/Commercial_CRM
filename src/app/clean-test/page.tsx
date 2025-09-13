
export default function CleanTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clean Test Page</h1>
      <p className="mb-4">This page has absolutely no Server Actions.</p>
      
      {/* Regular HTML form - no Server Actions */}
      <form method="GET" action="/" className="space-y-4">
        <div>
          <label htmlFor="test" className="block text-sm font-medium">
            Test Input:
          </label>
          <input 
            type="text" 
            id="test"
            name="test" 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter something..."
          />
        </div>
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Submit (GET request)
        </button>
      </form>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Navigation Test:</h2>
        <a href="/" className="text-blue-600 hover:underline">Go to Home</a>
      </div>
    </div>
  )
}
