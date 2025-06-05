# SHOP YETU3D - Custom & Pre-designed 3D Prints

## Description

SHOP YETU3D is a web application that allows users to order pre-designed 3D printed items and submit requests for custom 3D designs. The platform facilitates communication between customers and the design service, handling product browsing, custom request submissions (including file uploads for references), and order placement (currently supporting Pay on Delivery).

## Technologies Used

*   **Backend:** Node.js, Express.js
*   **Frontend:** HTML, CSS, JavaScript
*   **File Uploads:** Multer
*   **Data Handling:** JSON files for storing custom requests and orders.

## Features

*   Browse and view pre-designed 3D products.
*   Submit detailed custom design requests, including:
    *   Project descriptions
    *   Reference images/sketches (uploads supported)
    *   Existing 3D model files (uploads supported)
*   Place orders for pre-designed items (Pay on Delivery).
*   View a portfolio of past projects.
*   Contact form for inquiries.

## Setup and Running the Project

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd 3d_design_app
    ```
2.  **Install dependencies:**
    Make sure you have Node.js and npm installed. Then run:
    ```bash
    npm install
    ```
3.  **Run the server:**
    ```bash
    node server.js
    ```
    The application will typically be available at `http://localhost:3000`.

    The server will create `data/` and `uploads/` directories if they don't exist, along with `custom-requests.json` and `orders.json` within the `data/` directory.

## File Structure

*   `server.js`: The main backend Express application file. Handles routing, middleware, and form submissions.
*   `package.json`: Project metadata, dependencies, and scripts.
*   `public/`: Contains all static frontend assets.
    *   `css/`: Stylesheets for the application.
    *   `images/`: Image assets used in the site.
    *   `js/`: Frontend JavaScript files.
    *   `index.html`: The main landing page.
    *   `products.html`: Page for browsing pre-designed products.
    *   `checkout.html`: Page for the checkout process.
    *   `success.html`: Order confirmation page.
*   `data/`: Stores JSON files for application data.
    *   `custom-requests.json`: Stores submitted custom design requests.
    *   `orders.json`: Stores placed orders.
*   `uploads/`: Directory where uploaded files (reference images, 3D models for custom requests) are stored.
*   `.gitignore`: Specifies intentionally untracked files that Git should ignore.

## Customization

*   **Port:** The default port is `3000`. This can be changed by modifying the `port` variable in `server.js`.
*   **File Paths:** Paths for data storage (`data/`, `uploads/`) are defined at the top of `server.js` and can be modified if needed.
