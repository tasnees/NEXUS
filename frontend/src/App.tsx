
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/signup';
import JobPostingFeed from './pages/job_posting_feed';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Candidates from './pages/candidates';
import CandidateProfile from './pages/candidate';
import SentimentAnalysis from './pages/setiment_analysis';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/jobs" element={<JobPostingFeed />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/candidate/:id" element={<CandidateProfile />} />
        <Route path="/sentiment-analysis" element={<SentimentAnalysis />} />
      </Routes>
    </Router>
  );
}

export default App;
