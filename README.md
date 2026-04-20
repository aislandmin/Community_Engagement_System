# Community Engagement System (AI-Powered)

An advanced, microservices-driven Community Engagement System designed to empower residents, business owners, and community organizers. This platform leverages **Apollo Federation** for the backend and **Vite Module Federation** for a micro-frontend architecture, integrated with **Google Gemini AI** for personalized community insights.

## 🚀 Features

- **Tailored Multi-Role Portals:** 
    - **Residents:** Full access to feed, alerts, help requests, business deals, and AI assistant.
    - **Organizers:** Focused workspace for event management and volunteer matching.
    - **Business Owners:** Dedicated dashboard for business profiles, special offers, and customer review interactions.
- **AI-Powered Insights:** 
    - **Summarization:** Stay updated with AI-generated summaries of long discussions.
    - **Hybrid Volunteer Matching:** Intelligent matching for help requests and events that combines Gemini's reasoning with hard-coded location priority.
    - **Business Feedback:** Actionable tips for owners based on customer sentiment analysis.
- **Real-Time Ecosystem:** 
    - **Emergency Alerts:** Instant broadcasting of safety concerns.
    - **Business Notifications:** Owners see new reviews and feedback immediately without refreshing.
    - **Unified Invitations:** Residents receive real-time notifications when invited to volunteer.
- **High-Performance Media:** Supports direct Base64 image uploads with a **50MB** payload limit and automatic UI fallbacks for businesses without images.

## 🛠 Architecture

### Backend (Microservices)
The backend uses **Apollo Federation 2.0** to unify specialized subgraphs.

| Service | Port | Key Features |
| :--- | :--- | :--- |
| **Gateway** | 4000 | Federated entry point; 50MB payload limit. |
| **Auth Service** | 4001 | Roles (Resident/Owner/Organizer), Interests, & JWT Auth. |
| **Community Service** | 4003 | News, Help Requests, & Real-time Alerts. |
| **Business & Event Service** | 4004 | Listings, Deals, Events, & Real-time Review Sync. |
| **AI Personalization Service** | 4005 | Centralized `gemini-flash-latest` logic & Hybrid Matching. |

### Frontend (Micro-frontends)
Built using **React** and **Vite Module Federation**.

| App | Port | Responsibilities |
| :--- | :--- | :--- |
| **Shell App** | 3000 | The main container orchestrating micro-frontends. |
| **User App** | 3001 | Authentication and user profile management. |
| **Community App** | 3003 | The heart of the system; provides role-based tabs. |

## 🏁 Getting Started

### Prerequisites
- **Node.js**: v18 or higher.
- **MongoDB**: Local instance running on `27017`.
- **Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/).

### Installation

1. **Clone & Install Backend:**
   ```bash
   cd server
   npm install
   # Install for each microservice:
   cd microservices/auth-service && npm install
   cd ../community-service && npm install
   cd ../business-event-service && npm install
   cd ../ai-personalization-service && npm install
   ```

2. **Install Frontend:**
   ```bash
   cd client/shell-app && npm install
   cd ../user-app && npm install
   cd ../community-app && npm install
   ```

### Seeding the Database
Populate the system with a complete set of sample users, businesses, and events:
```bash
cd server
node seedData.js
```

## 🏃 Running the Project

### 1. Start the Backend
```bash
# From the /server directory
npm run dev
```

### 2. Start the Frontend
The federated apps must be built/served before the shell can consume them:
```bash
# Terminal 1 & 2
cd client/user-app && npm run deploy
cd client/community-app && npm run deploy

# Terminal 3
cd client/shell-app && npm run dev
```
*Access the system at [http://localhost:3000](http://localhost:3000).*

---
Developed as part of the Community Engagement System project.
