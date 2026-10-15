# Hotel & Room Management REST API

A lightweight, robust RESTful API built with **Node.js** and **Express.js** for managing hotel rooms and reservations. Features comprehensive CRUD operations, pagination, multi-attribute filtering, sorting, search capabilities, and strict input validation.

---

## 📋 Table of Contents
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Configuration](#-configuration)
- [Data Models & Validation Rules](#-data-models--validation-rules)
- [API Documentation](#-api-documentation)
  - [1. Create a Room](#1-create-a-room)
  - [2. List / Search Rooms](#2-list--search-rooms)
  - [3. Get Room by ID](#3-get-room-by-id)
  - [4. Update Room (Full - PUT)](#4-update-room-full---put)
  - [5. Update Room (Partial - PATCH)](#5-update-room-partial---patch)
  - [6. Delete Room](#6-delete-room)
- [Error Handling](#-error-handling)
- [Testing with cURL](#-testing-with-curl)

---

## 🛠 Tech Stack
- **Runtime:** Node.js (v16+ recommended)
- **Framework:** Express.js (v5)
- **Data Format:** JSON (`application/json; charset=utf-8`)

---

## ⚙️ Prerequisites
Make sure you have installed on your machine:
- [Node.js](https://nodejs.org/) (version 16.x or higher)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- [Git](https://git-scm.com/)

---

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/satszzz/mern-hotel-management-assessment.git
   cd mern-hotel-management-assessment
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

---

## ▶️ Running the Application

### Start Server
```bash
npm start
```
Or directly using Node:
```bash
node index.js
```

Once started, the server will output:
```
Hotel Rooms API server listening on port 8080
```
The API is accessible at: `http://localhost:8080`

---

## 🔧 Configuration

The application uses the following optional environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Port on which the Express server runs |

To run on a custom port:
```bash
# On Linux/macOS
PORT=5000 npm start

# On Windows PowerShell
$env:PORT="5000"; npm start

# On Windows Command Prompt
set PORT=5000 && npm start
```

---

## 📐 Data Models & Validation Rules

### Room Schema

| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Auto-generated | Read-only unique identifier |
| `name` | String | Yes | 3 to 60 characters |
| `location` | String | Yes | 2 to 40 characters |
| `type` | String | Yes | Allowed values: `Single`, `Double`, `Suite`, `Deluxe`, `Family` |
| `pricePerNight` | Number | Yes | Positive number, between `0` and `100,000` |
| `capacity` | Integer | Yes | Integer between `1` and `10` |
| `available` | Boolean | Yes | `true` or `false` |
| `roomNumber` | String | Yes | 4 to 20 characters (Unique, case-insensitive) |

---

## 📖 API Documentation

Base URL: `http://localhost:8080/api`

### 1. Create a Room
Creates a new hotel room entry.

- **Method:** `POST`
- **URL:** `/api/rooms`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Deluxe Ocean View",
    "location": "North Wing Floor 3",
    "type": "Deluxe",
    "pricePerNight": 2500,
    "capacity": 2,
    "available": true,
    "roomNumber": "RM-301"
  }
  ```
- **Responses:**
  - `201 Created`: Returns newly created room with generated `id`.
  - `400 Bad Request`: Missing field or validation constraint violation.
  - `409 Conflict`: `roomNumber` already exists.

---

### 2. List / Search Rooms
Retrieves a paginated list of rooms with optional filtering, sorting, and searching.

- **Method:** `GET`
- **URL:** `/api/rooms`
- **Query Parameters:**
  | Parameter | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `page` | Integer | `1` | Page number (positive integer) |
  | `limit` | Integer | `10` | Number of items per page (max 50) |
  | `type` | String | - | Filter by type (`Single`, `Double`, `Suite`, `Deluxe`, `Family`) |
  | `available` | Boolean | - | Filter by availability (`true` or `false`) |
  | `minPricePerNight` | Number | - | Minimum price filter |
  | `maxPricePerNight` | Number | - | Maximum price filter |
  | `search` | String | - | Case-insensitive search matching `name` or `location` |
  | `sort` | String | - | Field to sort by: `name`, `pricePerNight`, `capacity` |
  | `order` | String | `asc` | Sorting direction: `asc` or `desc` |

- **Example Request:**
  ```
  GET /api/rooms?type=Deluxe&available=true&minPricePerNight=1000&sort=pricePerNight&order=desc&page=1&limit=10
  ```
- **Response (`200 OK`):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Deluxe Ocean View",
        "location": "North Wing Floor 3",
        "type": "Deluxe",
        "pricePerNight": 2500,
        "capacity": 2,
        "available": true,
        "roomNumber": "RM-301"
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
  ```

---

### 3. Get Room by ID
Retrieves details of a specific room.

- **Method:** `GET`
- **URL:** `/api/rooms/:id`
- **Responses:**
  - `200 OK`: Returns the room object.
  - `404 Not Found`: `{ "error": "Record not found" }`

---

### 4. Update Room (Full - PUT)
Replaces all room details. All required fields must be supplied.

- **Method:** `PUT`
- **URL:** `/api/rooms/:id`
- **Headers:** `Content-Type: application/json`
- **Request Body:** Must contain all fields (`name`, `location`, `type`, `pricePerNight`, `capacity`, `available`, `roomNumber`).
- **Responses:**
  - `200 OK`: Returns the updated room.
  - `400 Bad Request`: Missing field or validation failure.
  - `404 Not Found`: `{ "error": "Record not found" }`
  - `409 Conflict`: `roomNumber` belongs to another room.

---

### 5. Update Room (Partial - PATCH)
Updates one or more fields of an existing room.

- **Method:** `PATCH`
- **URL:** `/api/rooms/:id`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "pricePerNight": 2200,
    "available": false
  }
  ```
- **Responses:**
  - `200 OK`: Returns the updated room object.
  - `400 Bad Request`: No recognized fields provided or invalid value.
  - `404 Not Found`: `{ "error": "Record not found" }`
  - `409 Conflict`: Updated `roomNumber` already taken.

---

### 6. Delete Room
Deletes a room by its identifier.

- **Method:** `DELETE`
- **URL:** `/api/rooms/:id`
- **Responses:**
  - `204 No Content`: Successful deletion (empty body).
  - `404 Not Found`: `{ "error": "Record not found" }`

---

## 🛑 Error Handling

The API adheres to standard HTTP status codes and responds with JSON error payloads:

| Status Code | Description | Example Response |
| :--- | :--- | :--- |
| `400 Bad Request` | Validation failure / malformed JSON | `{"error": "name must be between 3 and 60 characters"}` |
| `404 Not Found` | Room or route doesn't exist | `{"error": "Record not found"}` or `{"error": "Route not found"}` |
| `409 Conflict` | Duplicate unique constraint | `{"error": "roomNumber already exists"}` |
| `500 Server Error` | Unexpected internal exception | `{"error": "Internal Server Error"}` |

---

## 🧪 Testing with cURL

### 1. Create Room
```bash
curl -X POST http://localhost:8080/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Presidential Suite",
    "location": "Penthouse Floor",
    "type": "Suite",
    "pricePerNight": 12000,
    "capacity": 4,
    "available": true,
    "roomNumber": "PS-1001"
  }'
```

### 2. Get All Rooms
```bash
curl http://localhost:8080/api/rooms
```

### 3. Filter and Sort
```bash
curl "http://localhost:8080/api/rooms?type=Suite&sort=pricePerNight&order=desc"
```

### 4. Update Room
```bash
curl -X PATCH http://localhost:8080/api/rooms/1 \
  -H "Content-Type: application/json" \
  -d '{"available": false}'
```

### 5. Delete Room
```bash
curl -X DELETE http://localhost:8080/api/rooms/1
```
