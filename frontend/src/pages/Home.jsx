import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-amber-600">🍯 HoneyTrace</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-amber-600">Login</Link>
              <Link to="/dashboard" className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Track Your Honey From Hive to Home
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Blockchain-powered supply chain tracking for authentic, traceable honey. 
            Ensure quality and build trust with every batch.
          </p>
          <div className="space-x-4">
            <Link 
              to="/dashboard" 
              className="bg-amber-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-600"
            >
              View Dashboard
            </Link>
            <Link 
              to="/login" 
              className="border border-amber-500 text-amber-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-amber-50"
            >
              Producer Login
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Full Traceability</h3>
            <p className="text-gray-600">Track every batch from production to packaging with immutable records.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Quality Assurance</h3>
            <p className="text-gray-600">Lab tests and certifications integrated directly into the supply chain.</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔗</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Blockchain Secured</h3>
            <p className="text-gray-600">Tamper-proof records on the blockchain ensure authenticity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}