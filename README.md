# 📦 Electron.js + React + TailwindCSS + React Router Boilerplate

A modern and minimal starter boilerplate to build **cross-platform desktop apps** using:

- **Electron.js** for Desktop Environment
- **React** for Frontend
- **Vite** for ultra-fast building
- **TailwindCSS v4** for styling
- **React Router** for page routing

---

## 🛠️ Technologies Used

- **Electron.js** — Desktop application framework.
- **React.js** — Frontend library.
- **Vite** — Fast development server and build tool.
- **TailwindCSS v4** — Utility-first CSS framework.
- **React Router** — Routing for React apps.
- **ESLint** — JavaScript/React linting.
- **Prettier** — Code formatting.

---

## ⚡ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/devshojol/Electron-js-boilerplate.git
cd Electron-js-boilerplate
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the React Frontend

```bash
npm run build:react
```

### 4. Start in Development Mode

Run the Electron app with React frontend (Vite server):

```bash
npm run dev
```

✅ This starts:

- Electron main process.
- React frontend served by Vite.
- Hot Reload when you edit code.

### 5. Build for Production

Launch the Electron app using production-built files:

```bash
npm run build
```

✅ Output files will be generated in the `dist/` folder.

---

## 📦 Project Structure

```bash
├── public/               # Static files (favicon, etc.)
├── src/
│   ├── assets/           # Images, SVGs
│   ├── components/       # Reusable React components
│   ├── pages/            # Pages for routing
│   ├── routes/           # Routes definitions
│   ├── App.jsx           # Main App Component
│   └── main.jsx          # React entry point
├── Electron/                 # Electron main process files
│   └── main.js
├── dist/                 # Production frontend output (after build)
├── package.json          # Project configurations and scripts
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # TailwindCSS configuration
├── postcss.config.js     # PostCSS configuration
└── README.md             # Project readme (this file)
```

---

## 📜 Available Scripts

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Run development mode (Vite + Electron) |
| `npm run build`       | Build the frontend (Vite)              |
| `npm run react:build` | Start the built frontend               |
| `npm run lint`        | Run ESLint to lint and format code     |

---

## ✨ Features

- ✅ React + Vite fast HMR (Hot Module Replacement)
- ✅ TailwindCSS v4 preconfigured
- ✅ Routing with React Router
- ✅ Hot reload for frontend changes
- ✅ Clean code with ESLint & Prettier
- ✅ Production-ready build setup
- ✅ Easy to extend and customize

---

## 📜 License

This project is licensed under the **MIT License**.

---
