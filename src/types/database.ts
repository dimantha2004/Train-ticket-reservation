export interface Train {
  train_number: string;
  train_name: string;
  source_station: string;
  destination_station: string;
  available_days: string;
}

export interface Passenger {
  passenger_id: string;
  passenger_name: string;
  age: number;
  address: string;
  contact_number: string;
  created_at: string;
}

export interface TrainStatus {
  status_id: string;
  train_number: string;
  journey_date: string;
  total_seats: number;
  booked_seats_ac: number;
  booked_seats_general: number;
  waiting_count_ac: number;
  waiting_count_general: number;
}

export interface Ticket {
  ticket_id: string;
  passenger_id: string;
  train_number: string;
  journey_date: string;
  ticket_category: 'AC' | 'General';
  ticket_status: 'Confirmed' | 'Waiting' | 'Cancelled';
  fare: number;
  booking_date: string;
}

export interface TicketWithDetails extends Ticket {
  passenger?: Passenger;
  train?: Train;
}
