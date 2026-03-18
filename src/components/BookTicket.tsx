import { useState, useEffect } from 'react';
import { Ticket, Calendar, User, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Train } from '../types/database';

export default function BookTicket() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    trainNumber: '',
    journeyDate: '',
    passengerName: '',
    age: '',
    address: '',
    contactNumber: '',
    ticketCategory: 'General' as 'AC' | 'General',
  });

  useEffect(() => {
    fetchTrains();
  }, []);

  const fetchTrains = async () => {
    try {
      const { data, error } = await supabase
        .from('train')
        .select('*')
        .order('train_number');

      if (error) throw error;
      setTrains(data || []);
    } catch (error) {
      console.error('Error fetching trains:', error);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const selectedDate = new Date(formData.journeyDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 7);

      if (selectedDate < today || selectedDate > maxDate) {
        setMessage({ type: 'error', text: 'Booking allowed only within the next 7 days' });
        setLoading(false);
        return;
      }

      const { data: passengerData, error: passengerError } = await supabase
        .from('passenger')
        .insert({
          passenger_name: formData.passengerName,
          age: parseInt(formData.age),
          address: formData.address,
          contact_number: formData.contactNumber,
        })
        .select()
        .single();

      if (passengerError) throw passengerError;

      const { data: statusData, error: statusError } = await supabase
        .from('train_status')
        .select('*')
        .eq('train_number', formData.trainNumber)
        .eq('journey_date', formData.journeyDate)
        .maybeSingle();

      if (statusError) throw statusError;

      let currentStatus = statusData;
      const category = formData.ticketCategory;
      const bookedSeatsKey = category === 'AC' ? 'booked_seats_ac' : 'booked_seats_general';
      const waitingCountKey = category === 'AC' ? 'waiting_count_ac' : 'waiting_count_general';

      if (!currentStatus) {
        const { data: newStatus, error: createError } = await supabase
          .from('train_status')
          .insert({
            train_number: formData.trainNumber,
            journey_date: formData.journeyDate,
            total_seats: 10,
            booked_seats_ac: 0,
            booked_seats_general: 0,
            waiting_count_ac: 0,
            waiting_count_general: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        currentStatus = newStatus;
      }

      const bookedSeats = currentStatus[bookedSeatsKey] || 0;
      const waitingCount = currentStatus[waitingCountKey] || 0;
      let ticketStatus: 'Confirmed' | 'Waiting';
      let fare: number;

      if (bookedSeats < 10) {
        ticketStatus = 'Confirmed';
        fare = category === 'AC' ? 1500 : 800;

        const { error: updateError } = await supabase
          .from('train_status')
          .update({ [bookedSeatsKey]: bookedSeats + 1 })
          .eq('status_id', currentStatus.status_id);

        if (updateError) throw updateError;
      } else if (waitingCount < 2) {
        ticketStatus = 'Waiting';
        fare = category === 'AC' ? 1500 : 800;

        const { error: updateError } = await supabase
          .from('train_status')
          .update({ [waitingCountKey]: waitingCount + 1 })
          .eq('status_id', currentStatus.status_id);

        if (updateError) throw updateError;
      } else {
        setMessage({
          type: 'error',
          text: 'No seats available. All seats and waiting list are full.'
        });
        setLoading(false);
        return;
      }

      const { data: ticketData, error: ticketError } = await supabase
        .from('ticket')
        .insert({
          passenger_id: passengerData.passenger_id,
          train_number: formData.trainNumber,
          journey_date: formData.journeyDate,
          ticket_category: category,
          ticket_status: ticketStatus,
          fare: fare,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      setMessage({
        type: 'success',
        text: `Ticket booked successfully! Ticket ID: ${ticketData.ticket_id.slice(0, 8)}... | Status: ${ticketStatus}`,
      });

      setFormData({
        trainNumber: '',
        journeyDate: '',
        passengerName: '',
        age: '',
        address: '',
        contactNumber: '',
        ticketCategory: 'General',
      });
    } catch (error) {
      console.error('Error booking ticket:', error);
      setMessage({ type: 'error', text: 'Failed to book ticket. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Ticket className="w-7 h-7" />
        Book Train Ticket
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

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Train
          </label>
          <select
            value={formData.trainNumber}
            onChange={(e) => setFormData({ ...formData, trainNumber: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a train</option>
            {trains.map((train) => (
              <option key={train.train_number} value={train.train_number}>
                {train.train_number} - {train.train_name} ({train.source_station} to{' '}
                {train.destination_station})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Journey Date (Next 7 days only)
          </label>
          <input
            type="date"
            value={formData.journeyDate}
            onChange={(e) => setFormData({ ...formData, journeyDate: e.target.value })}
            min={getMinDate()}
            max={getMaxDate()}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ticket Category
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="General"
                checked={formData.ticketCategory === 'General'}
                onChange={(e) =>
                  setFormData({ ...formData, ticketCategory: e.target.value as 'AC' | 'General' })
                }
                className="mr-2"
              />
              General (₹800)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="AC"
                checked={formData.ticketCategory === 'AC'}
                onChange={(e) =>
                  setFormData({ ...formData, ticketCategory: e.target.value as 'AC' | 'General' })
                }
                className="mr-2"
              />
              AC (₹1500)
            </label>
          </div>
        </div>

        <div className="border-t pt-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Passenger Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </label>
              <input
                type="text"
                value={formData.passengerName}
                onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                min="1"
                max="120"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Booking...' : 'Book Ticket'}
        </button>
      </form>
    </div>
  );
}
