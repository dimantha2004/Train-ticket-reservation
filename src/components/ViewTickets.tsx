import { useEffect, useState } from 'react';
import { FileText, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TicketWithDetails } from '../types/database';

export default function ViewTickets() {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket')
        .select(
          `
          *,
          passenger (*),
          train (*)
        `
        )
        .order('booking_date', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyTicketId = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId);
    setCopiedId(ticketId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <FileText className="w-7 h-7" />
        Booked Tickets
      </h2>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">No tickets booked yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.ticket_id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {ticket.train?.train_name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        ticket.ticket_status
                      )}`}
                    >
                      {ticket.ticket_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Train #{ticket.train_number} | {ticket.ticket_category} Class
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">₹{ticket.fare}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Route</p>
                  <p className="font-medium text-gray-800">
                    {ticket.train?.source_station} → {ticket.train?.destination_station}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Journey Date</p>
                  <p className="font-medium text-gray-800">
                    {new Date(ticket.journey_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Passenger Details</p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name: </span>
                    <span className="font-medium text-gray-800">
                      {ticket.passenger?.passenger_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Age: </span>
                    <span className="font-medium text-gray-800">{ticket.passenger?.age}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact: </span>
                    <span className="font-medium text-gray-800">
                      {ticket.passenger?.contact_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Address: </span>
                    <span className="font-medium text-gray-800">{ticket.passenger?.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Ticket ID</p>
                  <p className="font-mono text-sm text-gray-800">{ticket.ticket_id}</p>
                </div>
                <button
                  onClick={() => copyTicketId(ticket.ticket_id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copiedId === ticket.ticket_id ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Booked on:{' '}
                {new Date(ticket.booking_date).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
