import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CancelTicket() {
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: ticket, error: fetchError } = await supabase
        .from('ticket')
        .select('*')
        .eq('ticket_id', ticketId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!ticket) {
        setMessage({ type: 'error', text: 'Ticket not found' });
        setLoading(false);
        return;
      }

      if (ticket.ticket_status === 'Cancelled') {
        setMessage({ type: 'error', text: 'Ticket is already cancelled' });
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('ticket')
        .update({ ticket_status: 'Cancelled' })
        .eq('ticket_id', ticketId);

      if (updateError) throw updateError;

      const category = ticket.ticket_category;
      const bookedSeatsKey = category === 'AC' ? 'booked_seats_ac' : 'booked_seats_general';
      const waitingCountKey = category === 'AC' ? 'waiting_count_ac' : 'waiting_count_general';

      if (ticket.ticket_status === 'Confirmed') {
        const { data: statusData, error: statusError } = await supabase
          .from('train_status')
          .select('*')
          .eq('train_number', ticket.train_number)
          .eq('journey_date', ticket.journey_date)
          .single();

        if (statusError) throw statusError;

        const bookedSeats = statusData[bookedSeatsKey] || 0;
        const waitingCount = statusData[waitingCountKey] || 0;

        const { error: statusUpdateError } = await supabase
          .from('train_status')
          .update({ [bookedSeatsKey]: Math.max(0, bookedSeats - 1) })
          .eq('status_id', statusData.status_id);

        if (statusUpdateError) throw statusUpdateError;

        if (waitingCount > 0) {
          const { data: waitingTickets, error: waitingError } = await supabase
            .from('ticket')
            .select('*')
            .eq('train_number', ticket.train_number)
            .eq('journey_date', ticket.journey_date)
            .eq('ticket_category', category)
            .eq('ticket_status', 'Waiting')
            .order('booking_date', { ascending: true })
            .limit(1);

          if (waitingError) throw waitingError;

          if (waitingTickets && waitingTickets.length > 0) {
            const firstWaitingTicket = waitingTickets[0];

            const { error: promoteError } = await supabase
              .from('ticket')
              .update({ ticket_status: 'Confirmed' })
              .eq('ticket_id', firstWaitingTicket.ticket_id);

            if (promoteError) throw promoteError;

            const { error: waitingUpdateError } = await supabase
              .from('train_status')
              .update({
                [bookedSeatsKey]: bookedSeats,
                [waitingCountKey]: waitingCount - 1,
              })
              .eq('status_id', statusData.status_id);

            if (waitingUpdateError) throw waitingUpdateError;

            setMessage({
              type: 'success',
              text: `Ticket cancelled successfully. Waiting ticket ${firstWaitingTicket.ticket_id.slice(
                0,
                8
              )}... has been confirmed.`,
            });
          } else {
            setMessage({ type: 'success', text: 'Ticket cancelled successfully' });
          }
        } else {
          setMessage({ type: 'success', text: 'Ticket cancelled successfully' });
        }
      } else if (ticket.ticket_status === 'Waiting') {
        const { data: statusData, error: statusError } = await supabase
          .from('train_status')
          .select('*')
          .eq('train_number', ticket.train_number)
          .eq('journey_date', ticket.journey_date)
          .single();

        if (statusError) throw statusError;

        const waitingCount = statusData[waitingCountKey] || 0;

        const { error: statusUpdateError } = await supabase
          .from('train_status')
          .update({ [waitingCountKey]: Math.max(0, waitingCount - 1) })
          .eq('status_id', statusData.status_id);

        if (statusUpdateError) throw statusUpdateError;

        setMessage({ type: 'success', text: 'Waiting ticket cancelled successfully' });
      }

      setTicketId('');
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      setMessage({ type: 'error', text: 'Failed to cancel ticket. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <XCircle className="w-7 h-7" />
        Cancel Ticket
      </h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleCancel} className="bg-white rounded-lg shadow-md p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ticket ID
          </label>
          <input
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Enter your ticket ID"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <p className="mt-2 text-sm text-gray-500">
            You can find your ticket ID in the "View Tickets" section
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Cancelling...' : 'Cancel Ticket'}
        </button>
      </form>
    </div>
  );
}
