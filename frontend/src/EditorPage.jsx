import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import Avatar from 'react-avatar'
import { assets } from './assets/assets.jsx';

const socket = io("https://realtime-code-editor-1-fhzn.onrender.com");

const EditorPage = () => {
    
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState(state.roomId);
  const [userName, setUserName] = useState(state.userName);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('console.log("Hello world !")');
  const [users, setUsers] = useState([]); 
  const [typing, setTyping] = useState('');
  const [isModified ,setIsModified] = useState(false)
  const [output,setOutput] = useState('')
  const [version , setVersion] = useState('*')
  
  // State for controlling sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard!');
  };

  useEffect(() => {
    socket.emit('join', { roomId, userName });
    setJoined(true);

    socket.on("userJoined", (users) => setUsers(users));
    socket.on("codeUpdate", (newCode) => setCode(newCode));
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is typing`);
      setTimeout(() => setTyping(''), 2000);
    });
    socket.on("languageUpdate", (newLanguage) => setLanguage(newLanguage));

    socket.on("codeResponse",(response)=>{setOutput(response.run.output)})

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("codeResponse")
    };
  }, [roomId, userName]);

  const leaveRoom = () => {
    setRoomId('');
    setUserName('');
    socket.emit("leaveRoom");
    setCode('console.log("Hello world !")');
    setLanguage("javascript");
    navigate('/'); // Navigate back to HomePage
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setIsModified(true)
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
    if (!isModified) {
      if (newLanguage === 'javascript' ) {
        setCode('console.log("Hello world !");');
      } else if (newLanguage === 'python') {
        setCode('print("Hello world !")');
      } else if (newLanguage === 'java') {
        setCode('public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello world!");\n    }\n}');
      } else if (newLanguage === 'cpp') {
        setCode('#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World!";\n    return 0;\n}');
      }
    }
  };

  const runCode = () => {
    socket.emit("compileCode", { code, roomId, language, version });
  };

  return (
    <div className='editor-container'>
      <div className='sidebar'>
        <div className='room-info'>
          <img src={assets.jpeg} alt="" />
          <h2>Room ID: {roomId}</h2>
          <button className='copy-button' onClick={copyRoomId}>
            Copy ID 
          </button>
        </div>
        <h3>Users in Room:</h3>
        <ul>
          {users.map((user, index) => (
            <Avatar key={user} className='user-list' name={user} size="40" textSizeRatio={1.75} round="10px"/>
          ))}
        </ul>
        
        <p className='typing-indicator'>{typing}</p>
  
        <button className='leave-button' onClick={leaveRoom}>
            Leave Room
        </button>
      </div> 

      <div className='editor-wrapper'> 
        
        <div className='choose-language'>
          <div className='compile-code'>
            <button className='run-btn' onClick={runCode}>Run</button>
            <button className='stop-btn'>Stop</button>
          </div>
          
          <div className='lang-div'>
            <label>Language</label>
            <select className='language-selector' onChange={handleLanguageChange} value={language} >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </div>
        
        <Editor
          height={"60%"}
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
        <div className='input'><p>Input</p></div>
        <textarea className='output-console' value={output} readOnly placeholder='Output will appear here...'></textarea>
      </div>
      <ToastContainer /> 
    </div>
  );
};

export default EditorPage;
