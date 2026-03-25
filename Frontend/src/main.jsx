import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReactDOM from "react-dom/client";
import './style.css';
import './normalize.css';

import LinkProvider from './LinkContext';
import LanguageProvider from './LanguageContext';
import App from "./App";
import About from './About';
import Calendar from './Calendar';

ReactDOM.createRoot(document.getElementById("root")).render(
  <LanguageProvider>
    <LinkProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path='/about' element={<About />} />
          <Route path='/calendar' element={<Calendar />} />
        </Routes>
      </BrowserRouter>
    </LinkProvider>
  </LanguageProvider>,
);
