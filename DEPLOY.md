# Deployment Guide

This guide explains how to deploy the Social Clone application. We will deploy the **Backend** to **Render** and the **Frontend** to **Vercel**.

## 1. Deploy Backend (Render)

1.  Create an account on [Render](https://render.com/).
2.  Click **"New +"** -> **"Web Service"**.
3.  Connect your GitHub repository.
4.  **Configuration:**
    - **Name:** `social-clone-api` (or similar)
    - **Root Directory:** `server`
    - **Environment:** `Node`
    - **Build Command:** `npm install`
    - **Start Command:** `npm start`
5.  **Environment Variables:**
    - Add the following variables (matching your `.env` but for production):
      - `MONGO_URI`: Your MongoDB Connection String (Atlas).
      - `JWT_SECRET`: A strong secret key.
      - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name.
      - `CLOUDINARY_API_KEY`: Your Cloudinary API Key.
      - `CLOUDINARY_API_SECRET`: Your Cloudinary API Secret.
      - `NODE_ENV`: `production`
6.  Click **"Create Web Service"**.
7.  Once deployed, copy the **onrender.com URL** (e.g., `https://social-clone-api.onrender.com`). You will need this for the frontend.

## 2. Deploy Frontend (Vercel)

1.  Create an account on [Vercel](https://vercel.com/).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `social-clone` repository.
4.  **Configuration:**
    - **Framework Preset:** `Vite` (should detect automatically).
    - **Root Directory:** `client` (Click "Edit" and select the `client` folder).
5.  **Environment Variables:**
    - Add the following variable:
      - `VITE_API_URL`: The Backend URL you copied from Render (e.g., `https://social-clone-api.onrender.com`). **Do not add a trailing slash.**
6.  Click **"Deploy"**.

## Troubleshooting

- **CORS Issues:** If the frontend cannot talk to the backend, ensure your backend's `cors` configuration allows the frontend's domain.
  - _Quick Fix:_ In `server/app.js`, ensure `cors()` is used loosely or configure `origin` to match your Vercel URL.
- **Socket Connection:** The frontend uses `VITE_API_URL` to connect to the Socket.io server. Ensure the URL is correct.
