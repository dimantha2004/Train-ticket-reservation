import { useEffect, useState } from 'react';
import { Brain as TrainIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Train } from '../types/database';

export default function TrainList() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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
        <TrainIcon className="w-7 h-7" />
        Available Trains
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trains.map((train) => (
          <div
            key={train.train_number}
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {train.train_name}
                </h3>
                <p className="text-sm text-gray-500">#{train.train_number}</p>
              </div>
              <TrainIcon className="w-5 h-5 text-blue-600" />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">From:</span>
                <span className="font-medium text-gray-800">{train.source_station}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To:</span>
                <span className="font-medium text-gray-800">{train.destination_station}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days:</span>
                <span className="font-medium text-gray-800">{train.available_days}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
