import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MainPage from "./pages/MainPage";

function App() {

  return (
    <>
    <Router>
      <Routes>

        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route  path="/" element={<MainPage/>}/>

      </Routes>
    </Router>
    </>
  )
}

export default App
