const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// Store player positions, velocities, and names
const players = {};

// Define canvas boundaries
const canvasWidth = 800;
const canvasHeight = 600;
const playerSize = 20;

// Set up the game loop to run at 60 FPS
const frameRate = 1000 / 60;

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle player registration
    socket.on('register', (data) => {
        const name = data.name.substring(0, 15); // Ensure name is not longer than 15 characters
        players[socket.id] = {
            ...getSafeSpawnPosition(),
            color: getRandomColor(),
            name: name
        };

        socket.on('disconnect', () => {
            console.log('User disconnected');
            delete players[socket.id];
            io.emit('updatePlayers', players);
        });

        // Handle movement events
        socket.on('move', (data) => {
            const player = players[socket.id];
            if (player) {
                if (data.direction === 'up') player.vy = -5;
                if (data.direction === 'down') player.vy = 5;
                if (data.direction === 'left') player.vx = -5;
                if (data.direction === 'right') player.vx = 5;
                if (data.direction === 'stopUp') player.vy = 0;
                if (data.direction === 'stopDown') player.vy = 0;
                if (data.direction === 'stopLeft') player.vx = 0;
                if (data.direction === 'stopRight') player.vx = 0;
            }
        });
    });
});

// Helper function to check collision between two players
function isColliding(player1, player2) {
    return (
        player1.x < player2.x + playerSize &&
        player1.x + playerSize > player2.x &&
        player1.y < player2.y + playerSize &&
        player1.y + playerSize > player2.y
    );
}

// Helper function to get a safe spawn position
function getSafeSpawnPosition() {
    let position;
    let collisionDetected;

    do {
        collisionDetected = false;
        position = {
            x: Math.random() * (canvasWidth - playerSize),
            y: Math.random() * (canvasHeight - playerSize),
            vx: 0,
            vy: 0
        };

        for (const id in players) {
            if (isColliding(position, players[id])) {
                collisionDetected = true;
                break;
            }
        }
    } while (collisionDetected);

    return position;
}

// Helper function to get a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Game loop
function gameLoop() {
    for (const id in players) {
        const player = players[id];

        const originalPosition = { x: player.x, y: player.y };

        // Update player positions
        player.x += player.vx;
        player.y += player.vy;

        // Collision detection with canvas boundaries
        if (player.x < 0) player.x = 0;
        if (player.x > canvasWidth - playerSize) player.x = canvasWidth - playerSize;
        if (player.y < 0) player.y = 0;
        if (player.y > canvasHeight - playerSize) player.y = canvasHeight - playerSize;

        // Collision detection with other players
        let collisionDetected = false;
        for (const otherId in players) {
            if (otherId !== id) {
                const otherPlayer = players[otherId];
                if (isColliding(player, otherPlayer)) {
                    collisionDetected = true;
                    break;
                }
            }
        }

        // If collision is detected, revert to original position
        if (collisionDetected) {
            player.x = originalPosition.x;
            player.y = originalPosition.y;
        }
    }

    // Broadcast updated player positions to all clients
    io.emit('updatePlayers', players);

    setTimeout(gameLoop, frameRate);
}

// Start the game loop
gameLoop();

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
