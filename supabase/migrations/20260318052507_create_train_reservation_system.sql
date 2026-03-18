/*
  # Train Ticket Reservation System Database Schema

  1. New Tables
    - `train`
      - `train_number` (text, primary key) - Unique train identifier
      - `train_name` (text) - Name of the train
      - `source_station` (text) - Starting station
      - `destination_station` (text) - Ending station
      - `available_days` (text) - Days when train runs (e.g., "Mon,Wed,Fri")
    
    - `passenger`
      - `passenger_id` (uuid, primary key) - Unique passenger identifier
      - `passenger_name` (text) - Full name of passenger
      - `age` (integer) - Age of passenger
      - `address` (text) - Residential address
      - `contact_number` (text) - Phone number
      - `created_at` (timestamptz) - Record creation timestamp
    
    - `train_status`
      - `status_id` (uuid, primary key) - Unique status identifier
      - `train_number` (text, foreign key) - References train table
      - `journey_date` (date) - Date of journey
      - `total_seats` (integer) - Total seats per category (10 for AC, 10 for General)
      - `booked_seats_ac` (integer) - Booked AC seats
      - `booked_seats_general` (integer) - Booked general seats
      - `waiting_count_ac` (integer) - Waiting list count for AC
      - `waiting_count_general` (integer) - Waiting list count for General
    
    - `ticket`
      - `ticket_id` (uuid, primary key) - Unique ticket identifier
      - `passenger_id` (uuid, foreign key) - References passenger table
      - `train_number` (text, foreign key) - References train table
      - `journey_date` (date) - Date of journey
      - `ticket_category` (text) - 'AC' or 'General'
      - `ticket_status` (text) - 'Confirmed' or 'Waiting'
      - `fare` (decimal) - Ticket price
      - `booking_date` (timestamptz) - When ticket was booked
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public access (for demo purposes)
    
  3. Sample Data
    - Insert 5 trains with different routes
*/

-- Create Train table
CREATE TABLE IF NOT EXISTS train (
  train_number text PRIMARY KEY,
  train_name text NOT NULL,
  source_station text NOT NULL,
  destination_station text NOT NULL,
  available_days text NOT NULL
);

-- Create Passenger table
CREATE TABLE IF NOT EXISTS passenger (
  passenger_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age < 120),
  address text NOT NULL,
  contact_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create Train_Status table
CREATE TABLE IF NOT EXISTS train_status (
  status_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  train_number text NOT NULL REFERENCES train(train_number) ON DELETE CASCADE,
  journey_date date NOT NULL,
  total_seats integer DEFAULT 10,
  booked_seats_ac integer DEFAULT 0,
  booked_seats_general integer DEFAULT 0,
  waiting_count_ac integer DEFAULT 0,
  waiting_count_general integer DEFAULT 0,
  UNIQUE(train_number, journey_date)
);

-- Create Ticket table
CREATE TABLE IF NOT EXISTS ticket (
  ticket_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid NOT NULL REFERENCES passenger(passenger_id) ON DELETE CASCADE,
  train_number text NOT NULL REFERENCES train(train_number) ON DELETE CASCADE,
  journey_date date NOT NULL,
  ticket_category text NOT NULL CHECK (ticket_category IN ('AC', 'General')),
  ticket_status text NOT NULL CHECK (ticket_status IN ('Confirmed', 'Waiting', 'Cancelled')),
  fare decimal(10,2) NOT NULL,
  booking_date timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE train ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Allow public read access to trains"
  ON train FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to passenger"
  ON passenger FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public read access to passenger"
  ON passenger FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public all access to train_status"
  ON train_status FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert to ticket"
  ON ticket FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public read access to ticket"
  ON ticket FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public update to ticket"
  ON ticket FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample train data
INSERT INTO train (train_number, train_name, source_station, destination_station, available_days) VALUES
  ('12301', 'Rajdhani Express', 'New Delhi', 'Mumbai', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
  ('12302', 'Shatabdi Express', 'Chennai', 'Bangalore', 'Mon,Wed,Fri,Sun'),
  ('12303', 'Duronto Express', 'Kolkata', 'New Delhi', 'Tue,Thu,Sat'),
  ('12304', 'Garib Rath', 'Mumbai', 'Ahmedabad', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
  ('12305', 'Jan Shatabdi', 'Pune', 'Goa', 'Fri,Sat,Sun')
ON CONFLICT (train_number) DO NOTHING;