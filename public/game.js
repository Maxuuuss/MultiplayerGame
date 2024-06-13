const socket = io();

const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

const menuScreen = document.getElementById('menuScreen');
const nameInput = document.getElementById('nameInput');
const startButton = document.getElementById('startButton');
const playerNamesList = document.getElementById('playerNames');

let players = {};
let playerName = '';

// Show the menu screen and wait for the player to enter their name
startButton.addEventListener('click', () => {
    playerName = nameInput.value.trim();
    if (playerName) {
        playerName = playerName.substring(0, 15);
        socket.emit('register', { name: playerName });
        menuScreen.style.display = 'none';
        canvas.style.display = 'block';
    }
});

// Handle player movement
document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (key === 'w') socket.emit('move', { direction: 'up' });
    if (key === 's') socket.emit('move', { direction: 'down' });
    if (key === 'a') socket.emit('move', { direction: 'left' });
    if (key === 'd') socket.emit('move', { direction: 'right' });
});

document.addEventListener('keyup', (event) => {
    const key = event.key;
    if (key === 'w') socket.emit('move', { direction: 'stopUp' });
    if (key === 's') socket.emit('move', { direction: 'stopDown' });
    if (key === 'a') socket.emit('move', { direction: 'stopLeft' });
    if (key === 'd') socket.emit('move', { direction: 'stopRight' });
});

// Update players and redraw the canvas
socket.on('updatePlayers', (data) => {
    players = data;
    drawPlayers();
    updatePlayerList();
});

function drawPlayers() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const id in players) {
        const player = players[id];
        context.fillStyle = player.color;
        context.fillRect(player.x, player.y, 20, 20);

        context.fillStyle = '#000';
        context.font = '12px Arial';
        context.textAlign = 'center';
        context.fillText(player.name, player.x + 10, player.y - 5);
    }
}

function updatePlayerList() {
    playerNamesList.innerHTML = '';
    for (const id in players) {
        const li = document.createElement('li');
        li.textContent = players[id].name;
        playerNamesList.appendChild(li);
    }
}

// Client-side game loop to redraw the canvas
function gameLoop() {
    drawPlayers();
    requestAnimationFrame(gameLoop);
}

// Start the client-side game loop
gameLoop();
