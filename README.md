# Community Engagement System (AI-Powered)

An advanced, microservices-driven Community Engagement System designed to empower residents, business owners, and community organizers. This platform leverages **Apollo Federation** for the backend and **Vite Module Federation** for a micro-frontend architecture, integrated with **Google Gemini AI** for personalized insights.

## 🚀 Features

- **Multi-Role Support:** Tailored experiences for Residents, Business Owners, and Community Organizers.
- **AI-Powered Insights:** 
    - **Summarization:** Stay updated quickly with AI summaries of long community discussions.
    - **Sentiment Analysis:** Actionable feedback for owners based on customer reviews.
    - **Volunteer Matching:** Smart matching for help requests and events based on interests and location.
    - **Predictive Event Timing:** AI-suggested optimal scheduling for community events.
- **Real-Time Systems:** Emergency alerts and notifications via Socket.io.
- **Business Management:** Profiles, service listings, special deals, and customer review interactions.
- **Event Management:** Community calendar, RSVP tracking, and volunteer management.

## 🛠 Architecture

### Backend (Microservices)
The backend uses **Apollo Federation 2.0** to unify multiple subgraphs into a single GraphQL gateway.

| Service | Port | Responsibilities |
| :--- | :--- | :--- |
| **Gateway** | 4000 | The entry point for all client requests. |
| **Auth Service** | 4001 | JWT Authentication, User Roles, and Profiles. |
| **Community Service** | 4003 | News, Discussions, Help Requests, and Emergency Alerts. |
| **Business & Event Service** | 4004 | Business Listings, Reviews, and Event Management. |
| **AI Personalization Service** | 4005 | Centralized Google Gemini AI logic and integrations. |

### Frontend (Micro-frontends)
Built using **React** and **Vite Module Federation** for modular development.

| App | Port | Responsibilities |
| :--- | :--- | :--- |
| **Shell App** | 3000 | The main container that orchestrates other micro-frontends. |
| **User App** | 3001 | Handles authentication and user profile management. |
| **Community App** | 3003 | Unified community portal with role-based dashboard tabs. |

## 🏁 Getting Started

### Prerequisites
- **Node.js**: v18 or higher.
- **MongoDB**: A local instance running on `mongodb://localhost:27017`.
- **Gemini API Key**: Required for AI features. Obtain one from the [Google AI Studio](https://aistudio.google.com/).

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd community-engagement-system
   ```

2. **Install Backend Dependencies:**
   ```bash
   # Navigate to the server root and install shared dependencies
   cd server
   npm install

   # Install dependencies for each specialized microservice
   cd microservices/auth-service && npm install
   cd ../community-service && npm install
   cd ../business-event-service && npm install
   cd ../ai-personalization-service && npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../../client
   cd shell-app && npm install
   cd ../user-app && npm install
   cd ../community-app && npm install
   ```

### Configuration
1. Create a `.env` file in `server/microservices/ai-personalization-service/` and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
2. (Optional) Check `.env.example` files in other services to ensure all necessary environment variables are set.

### Seeding the Database
To populate the system with sample data (Residents, Owners, Organizers, etc.):
```bash
cd server
node seedData.js
```

## 🏃 Running the Project

### 1. Start the Backend
To start the backend services, run these in separate terminals to ensure stability and proper startup order:

1.  **Auth Service:** `cd server/microservices/auth-service && npm run dev`
2.  **Community Service:** `cd server/microservices/community-service && npm run dev`
3.  **Business & Event Service:** `cd server/microservices/business-event-service && npm run dev`
4.  **AI Service:** `cd server/microservices/ai-personalization-service && npm run dev`
5.  **Gateway:** `cd server && node gateway.js`

### 2. Start the Frontend
The micro-frontends need to be built and served to be consumed by the Shell App.

1. **Start User App & Community App:**
   In two separate terminals:
   ```bash
   # Terminal 1
   cd client/user-app
   npm run deploy
   
   # Terminal 2
   cd client/community-app
   npm run deploy
   ```

2. **Start the Shell App:**
   ```bash
   cd client/shell-app
   npm run dev
   ```
   *Access the application at [http://localhost:3000](http://localhost:3000).*

## 📖 Key Technical Details
- **AI Logic:** Centralized in `server/microservices/ai-personalization-service/services/aiService.js`.
- **Real-Time Notifications:** Socket.io is integrated into the `community-service`.
- **State Preservation:** The UI uses CSS-based tab switching (`d-block`/`d-none`) in the `CommunityComponent.jsx` to maintain active states in the background.

---
Developed as part of the Community Engagement System project.
