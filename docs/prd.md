# Product Requirements Document: Shopify to Logistics Platform Order Management Application

## 1. Overview

This document outlines the requirements for a web application designed to streamline the order fulfillment process. The application will serve as an intermediary between one or more Shopify stores and the Detrack logistics platform. It will automatically ingest fulfilled orders from Shopify, allow for data review and editing on a centralized dashboard, and facilitate the export of this data to Detrack's API. The primary goal is to automate data transfer, reduce manual entry, and provide a clear, editable overview of orders ready for dispatch.

## 2. Objectives/Goals

*   **Automation:** Automatically pull fulfilled order data from connected Shopify stores to eliminate manual data extraction.
*   **Centralization:** Provide a single, spreadsheet-style dashboard to view, manage, and edit all processed orders from multiple stores.
*   **Efficiency:** Enable one-click data export of single or multiple orders to the Detrack logistics platform.
*   **Customization:** Allow the user to define how Shopify order data maps to the fields within the application's dashboard.
*   **Usability:** Deliver a clean, intuitive, and user-friendly interface that requires minimal training.

## 3. Features

### 3.1. Settings Management

**Description:** This feature allows the user to configure the application's core integrations, including connecting Shopify stores and defining data mapping rules.

**Application Flows:**

**Flow: Connecting a new Shopify Store**
1.  The user navigates to the "Settings" page.
2.  The user clicks an "Add Shopify Store" button.
3.  A form appears asking for the Shopify Store URL and API credentials.
4.  The user enters the required information and saves it.
5.  The application validates the credentials and, upon success, adds the store to a list of connected stores on the settings page.
6.  The user can disconnect a store at any time by clicking a "Disconnect" button next to the store's name.

**Flow: Configuring Field Mappings**
1.  On the "Settings" page, the user accesses the "Field Mapping" section.
2.  The application displays a list of all dashboard fields (e.g., "Delivery Order (D.O.) No.", "Address", "First Name").
3.  Next to each dashboard field, the user can configure the mapping in one of the following ways:
    - **Single Field Mapping:** Select one Shopify data field from a dropdown (e.g., `customer.first_name` for "First Name")
    - **Multiple Field Concatenation:** Select multiple Shopify data fields that will be concatenated together (e.g., `shipping_address.address1` + `shipping_address.address2` + `shipping_address.city` for "Address")
    - **No Mapping:** Select "No Mapping" option, which will result in that dashboard column being empty by default for new orders
4.  For concatenated fields, the user can specify a separator (e.g., space, comma, or custom text) between the concatenated values.
5.  The user saves the mapping configuration. This configuration applies to all incoming orders from all connected Shopify stores.

### 3.2. Order Dashboard

**Description:** The dashboard is the central hub for viewing and managing orders pulled from Shopify. It is designed to function like a spreadsheet, providing flexibility and ease of use.

**Application Flows:**

**Flow: Automatic Order Ingestion**
1.  An order is marked as 'fulfilled' in one of the connected Shopify stores.
2.  Shopify sends a webhook with the order data to the application's endpoint.
3.  The application processes the data according to the saved mapping rules.
4.  A new row representing the order is created and displayed on the dashboard.
5.  The order's initial "Status" is set to 'Ready for Export'.

**Flow: Reviewing and Editing Orders**
1.  The user navigates to the "Dashboard" page.
2.  The dashboard displays all processed orders in a tabular, spreadsheet-like grid.
3.  The user can resize any column by clicking and dragging the column divider in the header.
4.  The user can click into any cell (e.g., "Address", "Instructions") to edit its content directly.
5.  Changes are saved automatically as the user edits the field.

### 3.3. Data Export to Logistics Platform

**Description:** This feature enables the user to send prepared order data to the Detrack logistics platform.

**Application Flows:**

**Flow: Exporting Orders**
1.  On the dashboard, each order row has a checkbox.
2.  The user selects one or more orders by checking the corresponding boxes. A "Select All" checkbox is also available.
3.  The user clicks the "Export to Detrack" button.
4.  The application prepares the data for the selected orders.
5.  The application sends the data to the Detrack API.
6.  For each order that is successfully exported, the "Status" column on the dashboard updates to 'Exported'.
7.  If an error occurs during the export for any order, its "Status" updates to 'Error', and a remark may be added to the "Remarks" column with the error details.

## 4. Technical Requirements

### 4.1. System Architecture
*   The application will be a Single Page Application (SPA) built using React.
*   The user interface will be developed with shadcn/ui components and styled with Tailwind CSS.
*   The application will be deployed on Cloudflare Workers.
*   For the initial prototype, application state and data (orders, settings) will be persisted in the browser's Local Storage.

### 4.2. Functional Technical Requirements
*   **Shopify Integration:** The application must provide a webhook endpoint to receive 'order fulfillment' events from Shopify.
*   **Detrack Integration:** The application must be capable of making API calls to the Detrack platform to submit delivery jobs.

### 4.3. Backend API Endpoints
The following backend endpoints are required. For the UI-only prototype, these will be mocked.

*   **`POST /api/shopify/webhook`**: Receives order data from a Shopify webhook. Processes the data based on saved mapping rules and creates a new order record.
*   **`GET /api/orders`**: Fetches all existing orders to display on the dashboard.
*   **`PUT /api/orders/:orderId`**: Updates a specific order with new data when a user edits a cell on the dashboard.
*   **`POST /api/export`**: Receives a list of order IDs. For each order, it formats the data and sends it to the Detrack API. Updates the status of the orders upon success or failure.
*   **`GET /api/settings`**: Retrieves the current settings, including connected Shopify stores and field mapping configurations.
*   **`POST /api/settings`**: Saves updated settings for Shopify stores and field mappings.

## 5. Design Style

### 5.1. Design Philosophy
The design will be modern, clean, and intuitive. The focus is on functionality and ease of use, ensuring that the user can navigate the application and perform tasks efficiently without clutter or distraction.

### 5.2. Theme
The overall theme is professional and calming, creating a pleasant user experience suitable for a data-focused work environment.

### 5.3. Color Palette
*   **Primary:** Olive (`#616B53`) - Used for primary buttons, active states, and key interface elements.
*   **Secondary:** Dust (`#E2E5DA`) - Used for backgrounds, secondary panels, and to complement the primary color.
*   **Accent/Neutral:** A light cream or off-white (e.g., `#F5F5F5`) for the main application background to ensure content is legible.
*   **Text:** A dark gray (e.g., `#333333`) for body text and a slightly lighter gray for secondary text.
*   **Status Colors:**
    *   Success (e.g., 'Exported'): A shade of green.
    *   Warning/Info (e.g., 'Ready for Export'): A shade of blue or yellow.
    *   Error (e.g., 'Error'): A shade of red.

### 5.4. Typography
A clean, highly-readable sans-serif font such as **Inter** or **Lato** will be used for all text content to ensure clarity across the application.

## 6. Assumptions / Constraints

*   **Single User:** The application is designed for a single user. There are no authentication, user roles, or authorization requirements.
*   **API Credentials:** The user is responsible for obtaining and securely managing their own API credentials for both Shopify and Detrack.
*   **Initial Prototype:** The initial build will be a UI-only prototype. Backend functionality, including actual API calls to Shopify and Detrack, will be mocked, and data will be stored in the browser's local storage.
*   **Data Mapping Source:** The available fields for mapping from Shopify are assumed to be those present in the standard 'order fulfillment' webhook payload.