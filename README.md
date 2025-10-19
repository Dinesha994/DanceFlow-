## Project title: *DanceFlow: Personalized Dance Sequence Builder and Scheduler*

### Student name: *Dinesha Bungatavula*

### Student email: *dlb29@student.le.ac.uk*

### Project description: 
DanceFlow is a web application where users will be able to create, schedule, and track the progress of their dance sessions. Users can choose their preferred dance moves from a database, customize their sequences, and schedule their sessions in a calendar. This also allows users to track their progress, set new goals, and interact with the community of dancers. 

By providing a structured platform, DanceFlow aims to help the dancers stay organized and develop their dancing skills. Many other dancers have problems in staying consistent and tracking their progress, so this DanceFlow web application makes it easier to organize and finish thier sessions.

### List of requirements (objectives): 
 

Essential:
- User Registration: Users should be able to create and login with their accounts securely. 
- Admin role: Admin will be able to create, edit and delete the dance moves, this ensures that the content remains up to date. 
- Database: A database with a collection of dance moves including its description, images and videos. 
- Sequence Creation: Users can create and customize their dance sequences. 
- Progress Tracking: Tracks the progress of their dance practice sessions and users can see their progress anytime. 
- Community Features: Users will be able to share their dance sequence with other users in the application.  

Desirable:
- Role based access control: This ensures that both the user and admin roles have appropriate permissions. 
- CRUD Operations:  
  Admin: This helps the admin to create, edit and delete the dance moves in the database. 
  User: This helps the user to make changes in the sequences according to their preference. 
- Advanced features: keywords and filtered search options to find the dance moves and sequences quickly.  
- Calendar Integration: Users can schedule their dance sessions and set reminders. 
- Notifications: Users will get the notification to remind them of their dance sessions. 
- AI recommendations: Users will the recommendations from AI based on their activity and progress. 

Optional:
- Profile Customization: Users can customize and update their profile. 
- Offline mode: Users can download their preferred sequences for later practice. 
- Voice Commands: Implementing voice commands like start/stop to practice sessions.

### Tech Stack

- Frontend: HTML, CSS, JavaScript; Toast UI Calendar; Chart.js; Choices.js. 
- Backend: Node.js + Express. 
- Database: MongoDB + Mongoose. 
- Auth & Security: JWT, bcryptjs. 
- Other: Multer (uploads), Nodemailer (emails/password reset). 

### Prerequisites

- Node.js: Version 18 or higher 
- npm: Version 9 or higher
- MongoDB: Version 6.0 or higher — can be local or hosted on MongoDB Atlas
- Code Editor: Visual Studio Code (recommended)
- Gmail App Password: Password reset emails

### Setup & Installation

To set up and run the DanceFlow project on your local system, follow these steps:

Step 1: Clone the repository and move into the project folder
git clone https://github.com/Dinesha994/DanceFlow.git
cd DanceFlow

Step 2: Install dependencies using npm
npm install

Step 3: Create a .env file in the root directory and add the required environment variables

Step 4: Start the MongoDB service
If using local MongoDB, start the MongoDB service.
If using MongoDB Atlas, ensure your cluster is active and accessible.

Step 5: Run the server
node server.js
npm run dev

Step 6: Open the app in your browser
Go to 👉 http://localhost:3000
If you see:
MongoDB Atlas Connected Successfully!
Server running on port 3000
your project is successfully set up and running ✅

### 👥 Roles & Permissions
🧑‍💼 Admin

Manage dance moves (CRUD)

View and manage registered users

Access restricted admin dashboard

💃 User

Register / Login

Create and download dance sequences

Schedule and mark practice sessions

Track progress through charts

Participate in community discussions and challenges

### 🧪 Testing Your Setup

After starting the app:

Register a user → login → verify JWT token in console

As Admin → add a Dance Move (with image/video)

As User → create a Sequence → view in dashboard

Add a Session in Calendar → mark “Completed” → check progress chart

Try creating a Thread or Challenge in the Community tab
