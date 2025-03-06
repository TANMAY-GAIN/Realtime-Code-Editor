import express from 'express';
import http from 'http';
import { version } from 'os';
import { Server } from 'socket.io';
import axios from 'axios';
import path from 'path';


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("Client Connected", socket.id);

  let currentRoom = null;
  let currentUser = null;

  // Handle user joining a room
  socket.on("join", ({ roomId, userName }) => {
    // Handle leaving the previous room if the user was already in a room
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }

    // Set new room and user
    currentRoom = roomId;
    currentUser = userName;
    socket.join(roomId);

    // Add the user to the room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(userName);

    // Emit updated user list to the room
    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)));
  });

  // Handle code change in the editor
  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", code);
  });

  // Handle user typing
  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  // Handle language change
  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  socket.on("compileCode",async({code,roomId,language,version})=>{
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId)
      const response = await axios.post("https://emkc.org/api/v2/piston/execute",{
        language,
        version,
        files:[
          {
            content: code
          }
        ]
      })
      room.output = response.data.run.output
      io.to(roomId).emit("codeResponse",response.data)
    }
  })

  // Handle user leaving the room
  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
      socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    }
    console.log("User left the room");
  });

  // Handle unexpected disconnect
  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }
    console.log("User disconnected unexpectedly");
  });
});

const port = process.env.PORT || 5000;

const __dirname = path.resolve()
app.use(express.static(path.join(__dirname, "/frontend/dist")))
app.get("*",(req,res)=>{
  res.sendFile(path.join(__dirname,"frontend","dist","index.html"))
})

server.listen(port, () => {
  console.log(`Server is working on port ${port}`);
});
