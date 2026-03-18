import { useState } from 'react';
import { Brain as Train } from 'lucide-react';
import TrainList from './components/TrainList';
import BookTicket from './components/BookTicket';
import CancelTicket from './components/CancelTicket';
import ViewTickets from './components/ViewTickets';

type TabType = 'trains' | 'book' | 'cancel' | 'view';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('trains');

  const tabs = [
    { id: 'trains' as TabType, label: 'Available Trains' },
    { id: 'book' as TabType, label: 'Book Ticket' },
    { id: 'view' as TabType, label: 'View Tickets' },
    { id: 'cancel' as TabType, label: 'Cancel Ticket' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Train className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Train Ticket Reservation</h1>
              <p className="text-sm text-gray-600">Book your journey with ease</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'trains' && <TrainList />}
        {activeTab === 'book' && <BookTicket />}
        {activeTab === 'cancel' && <CancelTicket />}
        {activeTab === 'view' && <ViewTickets />}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>Train Ticket Reservation System - Book within next 7 days</p>
          <p className="mt-1">Each category has 10 seats | 2 waiting tickets allowed per category</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
