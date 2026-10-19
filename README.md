# 🐾 PAWTRACE — Lost & Found Pet Reporting Platform

**Lost doesn't mean gone.**

PAWTRACE is a community-focused web application designed to help people report lost and found pets, discover pet reports, and support reunions between pets and their families.

The platform allows users to publish pet information, upload photographs, search existing reports, and filter listings by animal type and report status.

---

## ✨ Features

### 🐶 Pet Reporting
- Create reports for lost and found dogs and cats.
- Add pet names, breeds, colours, locations, and descriptions.
- Upload pet photographs directly from the report form.
- Preview and remove selected photographs before submitting.
- Support reports with or without photographs.

### 🔎 Search & Discovery
- Search reports by pet name, breed, colour, location, and description.
- Filter reports by status: Lost or Found.
- Filter reports by animal type: Dog or Cat.
- View pet information and uploaded photographs in report cards.

### 🖼️ Photo Upload System
- Upload JPG, PNG, and WebP images.
- Enforce a maximum upload size of 5 MB.
- Generate unique filenames for uploaded images.
- Store image files on the backend and their paths in PostgreSQL.
- Display uploaded photographs after page refreshes.

### 💚 User Experience
- Modern, dark-themed interface with lime-green accents.
- Responsive layouts for different screen sizes.
- Pet report statistics.
- Save and unsave pet cards during the current session.
- Form validation and submission feedback.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI |
| TypeScript | Type-safe frontend development |
| Vite | Development server and build tooling |
| Tailwind CSS | Styling and responsive layouts |
| Lucide React | Icons |
| Node.js | Backend runtime |
| Express.js | REST API |
| PostgreSQL | Relational database |
| `pg` | PostgreSQL integration |
| Multer | Multipart image uploads |
| dotenv | Environment variable management |
| Git & GitHub | Version control |

---

## 🏗️ Architecture

PAWTRACE follows a client-server architecture.

```text
PAWTRACE
│
├── client/                  # React + TypeScript frontend
│   ├── src/
│   │   └── App.tsx
│   └── package.json
│
├── server/                  # Node.js + Express backend
│   ├── index.js             # API routes and server setup
│   ├── upload.js            # Image upload configuration
│   ├── uploads/             # Uploaded pet photographs
│   ├── .env                 # Local environment variables
│   └── package.json
│
├── .gitignore
└── README.md
```

*The directory structure may vary slightly as development continues.*

### How It Works

1. A user submits a pet report through the React interface.
2. The frontend sends the report to the Express API.
3. Multer processes an optional image upload.
4. Express stores the report details in PostgreSQL.
5. The backend returns the saved report.
6. React displays the report and its photograph.
7. Reports are retrieved from the database when the application loads.

---

## 🚀 Getting Started

Follow these steps to run PAWTRACE locally.

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Git](https://git-scm.com/)
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/laseyae07-cmd/pawtrace.git
cd pawtrace
```

### 2. Set Up the Database

Create a PostgreSQL database named `pawtrace_db`.

Using `psql`, you can run:

```sql
CREATE DATABASE pawtrace_db;
```

Connect to the new database and create the pet reports table:

```sql
CREATE TABLE pet_reports (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    animal_type VARCHAR(10) NOT NULL
        CHECK (animal_type IN ('Dog', 'Cat')),
    breed VARCHAR(100),
    color VARCHAR(100),
    location VARCHAR(255) NOT NULL,
    status VARCHAR(10) NOT NULL
        CHECK (status IN ('Lost', 'Found')),
    description VARCHAR(1000) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3. Configure the Backend

Open a terminal in the server directory:

```bash
cd server
npm install
```

Create a `.env` file inside `server/` with your local PostgreSQL connection settings:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pawtrace_db
DB_USER=postgres
DB_PASSWORD=your_local_postgres_password
```

Replace the password placeholder with your actual local PostgreSQL password. Never commit `.env` or publish database credentials.

Ensure the `uploads/` directory exists inside `server/`.

Start the backend using the development script configured in `server/package.json`. If the project uses Nodemon, this will typically be:

```bash
npm run dev
```

The API should be available at:

`http://localhost:5000`

### 4. Configure the Frontend

Open a second terminal from the project root:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

`http://localhost:5173`

Keep both the backend and frontend running while using the application.

---

## 🔌 API Endpoints

The backend exposes the following report endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check that the API is running |
| GET | `/api/reports` | Retrieve pet reports |
| POST | `/api/reports` | Create a report using the existing JSON endpoint |
| POST | `/api/reports/with-photo` | Create a report with an optional image upload |

### Photo Upload Request

The `/api/reports/with-photo` endpoint accepts `multipart/form-data`.

| Field | Description |
|---|---|
| `name` | Pet name |
| `type` | Dog or Cat |
| `breed` | Pet breed |
| `color` | Main colour |
| `location` | Reported location |
| `status` | Lost or Found |
| `description` | Pet description |
| `image` | Optional JPG, PNG, or WebP image (maximum 5 MB) |

Uploaded images are served through the backend's `/uploads/` route.

---

## 🧪 Testing

The following functionality has been tested during development:

- Retrieving reports from PostgreSQL.
- Creating pet reports through the API.
- Uploading real pet photographs.
- Validating image types and file sizes.
- Displaying image previews before submission.
- Displaying uploaded photographs in report cards.
- Keeping reports and image references available after refreshing the page.
- Submitting reports without photographs.
- Searching and filtering pet reports.

Testing will continue as additional features are implemented.

---

## 🔒 Security & Privacy

PAWTRACE is currently a local development project.

- Database credentials are kept in environment variables.
- Uploaded filenames are generated uniquely.
- Image uploads are restricted by file type and size.
- Personal information should not be included unnecessarily in public reports.

Before production deployment, additional security measures should be implemented, including stronger file-content validation, rate limiting, comprehensive input validation, and secure handling of uploaded files.

---

## 🗺️ Future Improvements

Planned enhancements may include:

- User registration and authentication.
- Editing and deleting pet reports.
- Dedicated pet detail pages.
- Contact and sighting submission features.
- Interactive maps for reported locations.
- Improved image validation and upload security.
- Automated tests and deployment.
- Notifications when relevant pet reports are added.

---

## 🎯 Project Goal

The goal of PAWTRACE is to explore how a full-stack web application can use modern frontend technologies, REST APIs, relational database storage, and image uploads to support a meaningful community need.

**Every paw deserves a way home. 🐾**

---

## 👩‍💻 Author

**Laseya Ekanayake**

- GitHub: [@laseyae07-cmd](https://github.com/laseyae07-cmd)
- Project Repository: [PAWTRACE](https://github.com/laseyae07-cmd/pawtrace)

*Built with care for every paw.*
