// HomePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import { assets } from './assets/assets';

const HomePage = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const joinRoom = () => {
    if (roomId && userName) {
        navigate('/editor', { state: { roomId, userName } });
    } else {
      toast.error('Please provide both room ID and your name!');
    }
  };

  return (
    <div className='join-container'>
      <div className='join-form'>
      <img src={assets.jpeg} alt="" />
        <h1>Join  Room</h1>
        <input
          type="text"
          placeholder='Room ID'
          onChange={(e) => setRoomId(e.target.value)}
        />
        <input
          type="text"
          placeholder='Your Name'
          onChange={(e) => setUserName(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
      <ToastContainer /> 
    </div>
  );
};

export default HomePage;
