# 🌐 VoxVista

**Break language barriers, connect the world.**

🔗 **Live Demo:** https://vox-vista.vercel.app

VoxVista is a real-time multilingual chat application that enables seamless communication across languages. Combining modern messaging features with instant translation, VoxVista helps users connect globally without language barriers.

## 🖼 Screenshots

### Desktop View

![Signup Page](/screenshots/signup.png)

![Login Page](/screenshots/login.png)

![Chat Listing](/screenshots/chatlisting.png)

![Chat Section with Language Selection](/screenshots/chatSectionWLangSelOpt.png)

![Side Profile Section](/screenshots/sideProfileSection.png)


---

## ✨ Features

- 💬 **Real-time Messaging** - Instant one-to-one and group chat
- 🌍 **Multilingual Translation** - Automatic message translation powered by Azure Translator API
- ✅ **Message Status** - Delivery and read receipts for all messages
- 🔐 **Secure Authentication** - JWT-based login and signup system
- 👥 **Group Chat** - Create and manage group conversations
- 🎨 **Modern UI/UX** - Clean, responsive interface built with Tailwind CSS
- ⚡ **Real-time Updates** - Powered by Socket.IO for instant communication
- 📱 **Mobile Responsive** - Optimized for all screen sizes

---

## 🛠️ Tech Stack

### Frontend
- **React** - UI library for building interactive interfaces
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Socket.IO Client** - Real-time bidirectional communication
- **Axios** - HTTP client for API requests
- **React Router** - Navigation and routing

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data storage
- **Socket.IO** - Real-time event-based communication
- **JWT** - JSON Web Tokens for authentication
- **Cloudinary** - Cloud storage for profile pictures and media
- **Azure Translator API** - AI-powered language translation

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/new-Varshit/VoxVista.git
cd VoxVista
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
SECRET_KEY=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
TRANSLATOR_SUBSCRIPTION_KEY=your_azure_translator_key
TRANSLATOR_ENDPOINT=your_azure_translator_endpoint
TRANSLATOR_REGION=your_azure_region
LANGUAGE_SUBSCRIPTION_KEY=your_language_detection_key
LANGUAGE_TRANSLATOR_URL=your_language_detection_url
CLIENT_ORIGIN=http://localhost:5173
TOXICITY_URL=http://127.0.0.1:8001/score
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
```

Start the backend server:
```bash
npm run dev
```

### Optional: Run Local Toxicity Service (Free)
If you want toxicity moderation without paid inference APIs, run the included local service:

```bash
cd backend/moderation-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001
```

This serves:
- `GET /health` for service health checks
- `POST /score` for toxicity scores (English + Hindi/Hinglish)

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Access the Application
Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🚀 Usage

1. **Sign Up** - Create a new account with username, email, and password
2. **Log In** - Access your account securely
3. **Start Chatting** - Search for users and start conversations
4. **Create Groups** - Set up group chats with multiple members
5. **Translate Messages** - Messages are automatically translated based on user preferences
6. **Manage Profile** - Update your profile picture and information

---

## 📁 Project Structure

```
VoxVista/
├── backend/
│   ├── controllers/      # Request handlers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication & validation
│   ├── utils/           # Helper functions
│   └── index.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── utils/       # Utility functions
│   │   ├── assets/      # Images and static files
│   │   └── App.jsx      # Main app component
│   └── public/          # Public assets
└── README.md
```

---

## 🔮 Future Enhancements

- 📞 **Audio & Video Calling** - Voice and video call support
- 🎤 **Voice Messages** - Record and send voice notes
- 🤖 **AI-Powered Chat Assistant** - Smart suggestions and help
- 🔒 **End-to-End Encryption** - Enhanced message security
- 🔍 **Message Search** - Find messages with smart filters
- 📎 **File Sharing** - Send documents, images, and videos
- 🌙 **Dark Mode** - Eye-friendly dark theme
- ⭐ **Message Reactions** - React to messages with emojis
- 📌 **Pinned Messages** - Pin important messages in chats

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Varshit Tyagi**
- 🎓 Computer Science Engineering Student
- 💼 Backend-focused Full Stack Developer
- 🔗 [GitHub](https://github.com/new-Varshit)
- 💼 [LinkedIn](https://linkedin.com/in/varshit-tyagi-298617248)
- 📧 [Email](mailto:vksingh1122001@gmail.com)

---

## 🙏 Acknowledgments

- Azure Translator API for translation services
- Cloudinary for media storage
- Socket.IO for real-time communication
- MongoDB Atlas for database hosting

---

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/new-Varshit/vox-vista/issues) on GitHub.

---

<div align="center">
  <strong>Made with ❤️ by Varshit Tyagi</strong>
  <br>
  <sub>Breaking language barriers, one message at a time.</sub>
</div>
