# Frontend Deployment Guide (Render)

This guide will help you deploy the React frontend to Render.

## Prerequisites
- You have a Render account.
- The backend is already deployed and you have its URL (e.g., `https://appointment-monitor-backend.onrender.com`).
- This repository is connected to your Render account.

## Steps

1.  **Create a New Static Site**
    - Go to your [Render Dashboard](https://dashboard.render.com/).
    - Click **New +** and select **Static Site**.
    - Connect your GitHub/GitLab repository.

2.  **Configure the Service**
    - **Name**: Choose a name (e.g., `appointment-frontend`).
    - **Branch**: `main` (or your working branch).
    - **Root Directory**: `frontend` (Important! This tells Render the app is in the subfolder).
    - **Build Command**: `npm install && npm run build`
    - **Publish Directory**: `dist` (This is where Vite outputs the build).

3.  **Environment Variables**
    - Scroll down to the **Environment Variables** section.
    - Click **Add Environment Variable**.
    - **Key**: `VITE_API_URL`
    - **Value**: The URL of your deployed backend (e.g., `https://your-backend-service.onrender.com`).
      - *Note: Do not add a trailing slash `/` to the URL.*

4.  **Deploy**
    - Click **Create Static Site**.
    - Render will start the build process. You can watch the logs.

5.  **Verify**
    - Once deployed, click the URL provided by Render (e.g., `https://appointment-frontend.onrender.com`).
    - Test the application. The frontend should now be able to communicate with your backend.

## Troubleshooting
- **404 Errors on Refresh**: If you get 404s when refreshing pages like `/dashboard`, you may need to add a rewrite rule in Render.
    - Go to **Redirects/Rewrites**.
    - Source: `/*`
    - Destination: `/index.html`
    - Action: `Rewrite`
- **CORS Errors**: If you see CORS errors in the browser console, you might need to update the CORS settings in your **backend** to allow the new frontend URL.
