# Social Clone

A full-stack social media application built with the MERN stack (MongoDB, Express, React, Node.js).

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Socket.io-client, React Router DOM, Framer Motion
- **Backend:** Node.js, Express.js, Socket.io, MongoDB (Mongoose), Cloudinary (for image uploads)
- **Authentication:** JWT (JSON Web Tokens)

## Live Demo

**[Insert Deployed App Link Here]**

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (Local or AtlasURI)
- Cloudinary Account (for media uploads)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Anmol1085/social-clone.git
    cd social-clone
    ```

2.  **Install Dependencies:**

    _Server:_

    ```bash
    cd server
    npm install
    ```

    _Client:_

    ```bash
    cd ../client
    npm install
    ```

## Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

_(Note: If the client requires specific environment variables, add them to a `.env` file in the `client` directory, typically prefixed with `VITE_`)\_

## Running the Application

1.  **Start the Backend Server:**

    ```bash
    cd server
    npm run dev
    ```

    The server will run on `http://localhost:5000` (or your defined PORT).

2.  **Start the Frontend Client:**

    ```bash
    cd client
    npm run dev
    ```

    The client will run on `http://localhost:5173` (default Vite port).

## Build for Production

1.  **Client:**
    ```bash
    cd client
    npm run build
    ```

## License

[MIT](LICENSE)
