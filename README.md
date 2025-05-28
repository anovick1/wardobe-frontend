# 🫅 Wardrobe Frontend

A mobile app built with **React Native + Expo** for digitizing your closet, planning outfits, and getting AI-powered recommendations based on weather, location, and style.

This app connects to a Flask backend (in `wardrobe-backend`) that handles the database and API layer.

---

## 📱 Tech Stack

- [Expo](https://expo.dev/) (React Native)
- React Navigation (v6)
- Axios (API calls)
- Flask (Python backend, separate repo)
- PostgreSQL (hosted in Docker container)
- Docker Compose (local orchestration)
- `.env` environment config for local IP support

---

## 🔧 Setup Instructions

### 1. Clone the frontend

```bash
git clone git@gitlab.com:wardrobe-ai/wardrobe-frontend.git
cd wardrobe-frontend
```

### 2. Install dependencies

```bash
npm install
```

> If you don’t have Expo CLI globally:

```bash
npm install -g expo-cli
```

### 3. Set up environment variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Then update `.env` with your machine's local IP address:

```
FLASK_API_BASE_URL=http://192.168.x.x:5001
```

> ⚠️ You must use your **local IP address** (check with `ipconfig getifaddr en0` on Mac), not `localhost` or `127.0.0.1`.

---

### 4. Start the backend (from wardrobe-backend repo)

```bash
docker compose up --build
```

Make sure the backend is running and the `/items` endpoint is working (`GET http://192.168.x.x:5001/items` should return a JSON array).

---

### 5. Start the frontend

```bash
npx expo start
```

- Open the Expo Go app on your phone and scan the QR code
- The app should load your wardrobe and show items

---

## 🔪 Project Structure

```
wardrobe-frontend/
├── api/                    # Axios instance
├── assets/                 # Images, icons
├── screens/                # App screens (e.g., HomeScreen)
├── styles/                 # Modular styles (global, card, typography)
│   ├── global.js
│   ├── typography.js
│   └── card.js
├── App.js                  # Entry point
├── .env                    # Local IP config
├── app.json                # Expo config
└── ...
```

---

## ✅ Features

- Fetches items from the Flask API
- Clean layout with reusable styles
- Expo support for easy testing on physical devices
- Modular file organization

---

## 🔮 Coming Soon

- Outfit builder and planner
- Image upload support
- GPT-based recommendations
- Weather/location integration
- Auth and user profiles

---

## 🐛 Troubleshooting

- If nothing shows up, confirm `.env` is correctly set to your IP
- Use this to debug:

```js
console.log("📱 Using FLASK_API_BASE_URL:", process.env.FLASK_API_BASE_URL);
```

- Restart the Expo server after editing `.env`
- Docker must be running with the backend container up
- Ensure phone and computer are on the same Wi-Fi network

---

## 🧑‍💻 Author

Built with ❤️ by [@anovick1](https://github.com/anovick1)
