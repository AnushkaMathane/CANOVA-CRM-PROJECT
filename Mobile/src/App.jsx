import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home"; 
import Leads from "./pages/mobleads"; 
import Schedule from "./pages/schedule"; 
import Profile from "./pages/profile"; 

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/mobleads" element={<Leads />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/profile" element={<Profile />} />  
      </Routes>
    </Router>
  );
};

export default App;
