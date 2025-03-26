import React from 'react';
import Header from './components/Header';
import Projects from './components/Projects';
import './App.css';
import HomePage from './pages/HomePage';

// Removed HomePage component to move it to a separate file in the components directory.

function App() {
  return (
    <HomePage />
  );
}

export default App;
