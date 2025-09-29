#!/bin/bash

# Navigate to the backend directory and set up the Python environment
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Navigate to the frontend directory and install dependencies
cd ../frontend
npm install

# Start the backend API in the background
cd ../backend
flask --app app run --debug &

# Start the frontend development server
cd ../frontend
npm run dev

# Wait for user input to terminate the services
echo "Both services are running. Press [CTRL+C] to stop." 
wait