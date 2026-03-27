
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/signup';
import JobPostingFeed from './pages/job_posting_feed';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Candidates from './pages/candidates';
import CandidateProfile from './pages/candidate';
import SentimentAnalysis from './pages/setiment_analysis';
import Interviews from './pages/interviews';
import Assessments from './pages/assessments';
import AssessmentPortal from './pages/assessment_portal';
import MainLayout from './components/MainLayout';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/signup" />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/jobs" element={<MainLayout><JobPostingFeed /></MainLayout>} />
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/candidates" element={<MainLayout><Candidates /></MainLayout>} />
          <Route path="/candidate/:id" element={<MainLayout><CandidateProfile /></MainLayout>} />
          <Route path="/sentiment-analysis" element={<MainLayout><SentimentAnalysis /></MainLayout>} />
          <Route path="/interviews" element={<MainLayout><Interviews /></MainLayout>} />
          <Route path="/assessments" element={<MainLayout><Assessments /></MainLayout>} />
          <Route path="/portal/assessment-portal" element={<AssessmentPortal />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
