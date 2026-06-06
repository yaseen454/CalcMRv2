# CalcMRv2: Warframe Mastery Calculator

**Live Demo:** [https://calcmr.netlify.app/](https://calcmr.netlify.app/)

CalcMR is a specialized, responsive web application designed specifically for **Warframe** players. It takes the guesswork out of ranking up by calculating the exact number of Weapons and Deployables (Warframes, Companions, Archwings, etc.) needed to reach your upcoming Mastery Ranks. 

## ✨ Features

- **Real-time Mastery Projections:** Simply input your current Mastery XP to instantly generate a detailed table showing precisely how much XP is needed for your next ranks.
- **Custom XP Distribution:** Use the interactive slider to adjust your focus ratio between Weapons (averaging 3,000 XP) and Deployables (6,000 XP). 
- **Smart Optimization Engine:** Click the **"Optimize Next Rank"** button to let the app automatically calculate the most efficient Weapon-to-Deployable ratio, ensuring you reach your next rank with the absolute minimum wasted XP (overshoot).
- **Cloud Progress Syncing:** Powered by Firebase Authentication and Cloud Firestore, users can log in securely to save their current Mastery XP and distribution preferences, keeping progress synchronized across all devices.
- **Warframe-Themed UI:** Features a sleek, dark-mode visual identity mimicking Warframe's own sleek aesthetic, complete with fluid Framer Motion animations and responsive, mobile-first data tables.
- **Input Formatting:** Built-in dynamic comma formatting makes it easy to read and input large six-to-seven-digit XP numbers without losing track.

## 🛠️ Tech Stack

- **Framework:** [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend & Auth:** [Firebase](https://firebase.google.com/) (Authentication & Cloud Firestore)

## 🚀 Running Locally

To run this project locally, you will need Node.js installed on your machine. You will also need a Firebase project set up.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yaseen454/CalcMRv2.git
   cd CalcMRv2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and add your Firebase configuration variables (you can find these in your Firebase Project Settings):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is licensed under the MIT License.
