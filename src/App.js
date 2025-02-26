import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QuizSelection from './components/QuizSelection';
import QuizAttempt from './components/QuizAttempt';
import QuizResult from './components/QuizResult';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Quiz Application</h1>
      <Router>
        <Routes>
          <Route path="/" element={<QuizSelection />} />
          <Route path="/quiz/:quizName" element={<QuizAttempt />} />
          <Route path="/result/:quizName" element={<QuizResult />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
