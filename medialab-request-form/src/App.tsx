import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './features/landing/LandingPage';
import { RequestFormPage } from './features/request-form/RequestFormPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/form" element={<RequestFormPage />} />
      </Routes>
    </Router>
  );
}

export default App;