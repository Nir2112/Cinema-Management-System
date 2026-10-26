# Cinema Management System

A full-stack web application for booking movie tickets and managing cinema operations. This project provides a seamless experience for users to browse movies and book seats, alongside a powerful dashboard for administrators to manage schedules and track revenue.

## Key Features

### For Users (Client Side)
* **Movie Catalog:** Browse currently showing movies with posters, durations, and age ratings.
* **Smart Booking:** Select screenings and pick specific seats in dynamic cinema halls.
* **Secure Checkout:** Mock payment gateway with realistic credit card validation (expiry dates, auto-formatting).
* **Digital Tickets:** Upon successful payment, users receive a beautiful digital ticket with a barcode, including an option to print or save it as a PDF.

### For Administrators (Admin Dashboard)
* **Screening Management:** Easily schedule single screenings or batch-create schedules for multiple consecutive days in just one click.
* **Advanced Analytics:** A comprehensive statistics dashboard that tracks total revenue, total tickets sold, and total orders.
* **Performance Tracking:** View the "Top 5 Most Profitable Movies" and search for the financial performance of any specific movie.
* **Date Filtering:** Filter all revenue statistics by specific date ranges (From/To) to analyze daily, weekly, or monthly performance.

## Tech Stack

This project is built using the **MERN** stack:

**Frontend:**
* **React.js** - UI components and state management
* **Tailwind CSS** - Styling and responsive design
* **React Router** - Navigation and routing
* **Axios** - HTTP client for API requests
* **Lucide React** - UI Icons

**Backend:**
* **Node.js & Express.js** - Server environment and RESTful API creation
* **MongoDB & Mongoose** - NoSQL Database and object modeling

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone 
   ```

2. **Backend Setup**

    see "Cinema-System---Backend-API" repository
   ```bash
   cd backend folder
   npm install
   # Create a .env file with your PORT and MongoDB connection string
   npm start
   ```

3. **Frontend Setup & Network Configuration (Important!)**
   ```bash
   cd frontend
   npm install
   ```
Configure the API Instance:
Open the src/api/axiosInstance.js file. You must replace the placeholder URL with your actual local IPv4 address

    ```bash
   npm run dev
   ```
(or npm start depending on your setup)

4. **Access the App**
   Open your browser and navigate to `http://localhost:5173` (or your Vite/React local port).


## License ##
This project was created for portfolio and educational purposes.