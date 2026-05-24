import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReactDOM from "react-dom/client";
import './style.css';
import './normalize.css';

import LinkProvider from './LinkContext';
import LanguageProvider from './LanguageContext';
import { AuthProvider } from './AuthContext';
import App from "./App";
import About from './About';
import Calendar from './Calendar';
import Login from './Login';
import Settings from './Settings';
import YouBikePage from './YouBikePage';

ReactDOM.createRoot(document.getElementById("root")).render(
  <LanguageProvider>
    <AuthProvider>
      <LinkProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/about" element={<About />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/youbike" element={<YouBikePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </BrowserRouter>
      </LinkProvider>
    </AuthProvider>
  </LanguageProvider>,
);
