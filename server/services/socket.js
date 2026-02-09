const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Allow all origins for remote access
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    let users = [];

    const addUser = (userId, socketId) => {
        !users.some((user) => user.userId === userId) &&
            users.push({ userId, socketId });
    };

    const removeUser = (socketId) => {
        users = users.filter((user) => user.socketId !== socketId);
    };

    const getUser = (userId) => {
        return users.find((user) => user.userId === userId);
    };

    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);

        // Take userId and socketId from user
        socket.on("addUser", (userId) => {
            addUser(userId, socket.id);
            io.emit("getUsers", users);
        });

        // Send and get message
        socket.on("sendMessage", ({ senderId, receiverId, text, media, type, iv }) => {
            const user = getUser(receiverId);
            if (user) {
                io.to(user.socketId).emit("getMessage", {
                    senderId,
                    text,
                    media,
                    type,
                    iv
                });
            }
        });
        
        // Call Logic
        socket.on("callUser", ({ userToCall, signalData, from, name, isVideo }) => {
            const user = getUser(userToCall);
            if(user) {
                io.to(user.socketId).emit("callUser", { signal: signalData, from, name, isVideo });
            }
        });

        socket.on("answerCall", (data) => {
            const user = getUser(data.to);
             if(user) {
                io.to(user.socketId).emit("callAccepted", data.signal);
            }
        });
        
        socket.on("ice-candidate", ({ to, candidate }) => {
            const user = getUser(to);
             if(user) {
                io.to(user.socketId).emit("ice-candidate", { candidate });
            }
        });

        socket.on("disconnect", () => {
            console.log("a user disconnected!");
            removeUser(socket.id);
            io.emit("getUsers", users);
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIo };
