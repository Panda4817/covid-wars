import Player from "./Player.mjs";
import Collectible from "./Collectible.mjs";
import { canvasCalcs } from "./canvas-data.mjs";

const socket = io();
const canvas = document.getElementById("game-window");
const context = canvas.getContext("2d");

// Preload game assets
const loadImage = (src) => {
	const img = new Image();
	img.src = src;
	return img;
};

let tick;
let currPlayers = [];
let mainPlayer;
let collectedItem;
let avoidItem;

const vaccine = loadImage("../assets/vaccine.png");
const virus = loadImage("../assets/corona.png");
const mainPlayerArt = loadImage("../assets/me.png");
const otherPlayerArt = loadImage("../assets/other.png");

const init = () => {
	socket.on("init", ({ id, players, vaccine, virus }) => {
		collectedItem = new Collectible(vaccine);
		avoidItem = new Player(virus);
		let playerEntity = players.filter(
			(x) => x.id === id
		)[0];
		mainPlayer = new Player(playerEntity);
		currPlayers = players;

		document.onkeydown = (e) => {
			let dir = null;
			switch (e.keyCode) {
				case 87:
				case 38:
					dir = "up";
					break;
				case 83:
				case 40:
					dir = "down";
					break;
				case 65:
				case 37:
					dir = "left";
					break;
				case 68:
				case 39:
					dir = "right";
					break;
			}
			if (dir) {
				mainPlayer.movePlayer(dir, mainPlayer.speed);
				socket.emit("update", mainPlayer);
			}
		};

		socket.on(
			"update",
			({ players, vaccine, virus, playerList }) => {
				currPlayers = players;
				collectedItem = new Collectible(vaccine);
				avoidItem = new Player(virus);
				playerList.map((player) => {
					if (player.id === mainPlayer.id) {
						mainPlayer = new Player(player);
					}
				});
			}
		);
	});

	window.requestAnimationFrame(update);
};

const update = () => {
	context.clearRect(0, 0, canvas.width, canvas.height);

	// Set background color
	context.fillStyle = "#220";
	context.fillRect(0, 0, canvas.width, canvas.height);

	// Create border for play field
	context.strokeStyle = "red";
	context.strokeRect(
		canvasCalcs.playFieldMinX,
		canvasCalcs.playFieldMinY,
		canvasCalcs.playFieldWidth,
		canvasCalcs.playFieldHeight
	);

	// Controls text
	context.fillStyle = "white";
	context.font = `13px 'Press Start 2P'`;
	context.textAlign = "center";
	context.fillText("Controls: WASD", 100, 32.5);

	// // Game title
	// context.font = `16px 'Press Start 2P'`;
	// context.fillText("COVID Wars", 300, 32.5);

	// Calculate score and draw players each frame
	if (mainPlayer) {
		mainPlayer.draw(context, mainPlayerArt);
		context.font = `13px 'Press Start 2P'`;
		context.fillText(
			mainPlayer.calculateRank(currPlayers),
			360,
			32.5
		);
		context.fillText(
			`Health: ${mainPlayer.score}`,
			600,
			32.5
		);
		currPlayers.forEach((player) => {
			if (player.id != mainPlayer.id) {
				let p = new Player(player);
				p.draw(context, otherPlayerArt);
			}
		});

		// Draw current vaccine
		collectedItem.draw(context, vaccine);
		avoidItem.draw(context, virus);
	}

	tick = window.requestAnimationFrame(update);
};

init();
