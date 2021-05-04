require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const nocache = require("nocache");
const expect = require("chai");
const socket = require("socket.io");
const http = require("http");

const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner.js");

const app = express();

app.use(helmet.noSniff());
app.use(nocache());
app.use(
	"/public",
	express.static(process.cwd() + "/public")
);
app.use(
	"/assets",
	express.static(process.cwd() + "/assets")
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
	res.setHeader("x-powered-by", "PHP 7.4.3");
	next();
});
app.use(function (req, res, next) {
	res.setHeader("x-xss-protection", "1; mode=block");
	next();
});
// Index page (static HTML)
app.route("/").get(function (req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

//For FCC testing purposes
fccTestingRoutes(app);

// 404 Not Found Middleware
app.use(function (req, res, next) {
	res.status(404).type("text").send("Not Found");
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
	console.log(`Listening on port ${portNum}`);
	if (process.env.NODE_ENV === "test") {
		console.log("Running Tests...");
		setTimeout(function () {
			try {
				runner.run();
			} catch (error) {
				console.log("Tests are not valid:");
				console.error(error);
			}
		}, 1500);
	}
});

const Collectible = require("./public/Collectible");
const Player = require("./public/Player");
const {
	generateStartPos,
	canvasCalcs,
} = require("./public/canvas-data");
const io = socket(server);

const random = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomPosition = () => {
	let x = random(
		canvasCalcs.playFieldMinX + 50,
		canvasCalcs.playFieldMaxX - 50
	);
	let y = random(
		canvasCalcs.playFieldMinY + 50,
		canvasCalcs.playFieldMaxY - 50
	);
	x = Math.floor(x / 10) * 10;
	y = Math.floor(y / 10) * 10;

	return [x, y];
};

let [vaccineX, vaccineY] = getRandomPosition();
let current_players = [];

let vaccine = new Collectible({
	x: vaccineX,
	y: vaccineY,
	w: 15,
	h: 15,
	value: 1,
	id: new Date(),
});
let [virusX, virusY] = getRandomPosition();
let virus = new Player({
	x: virusX,
	y: virusY,
	w: 30,
	h: 30,
	score: 2,
	id: Date.now(),
});

io.on("connection", (socket) => {
	console.log(`${socket.id} has connected`);
	let [positionX, positionY] = getRandomPosition();
	let player = new Player({
		x: positionX,
		y: positionY,
		w: 30,
		h: 30,
		bw: 90,
		bh: 90,
		score: 10,
		id: socket.id,
	});
	current_players.push(player);

	socket.emit("init", {
		id: socket.id,
		players: current_players,
		vaccine: vaccine,
		virus: virus,
	});

	socket.on("update", (updatedUser) => {
		current_players.forEach((user) => {
			if (user.id === socket.id) {
				user.x = updatedUser.x;
				user.y = updatedUser.y;
				user.score = updatedUser.score;
			}
		});
		io.emit("update", {
			players: current_players,
			vaccine: vaccine,
			virus: virus,
			playerList: [],
		});
	});

	socket.on("disconnect", () => {
		socket.emit("remove-player", socket.id);
		current_players = current_players.filter(
			(player) => player.id !== socket.id
		);
		console.log(`${socket.id} disconnected`);
	});
});

let vx = 2;
let vy = 2;
const tick = () => {
	if (virus.x > canvasCalcs.playFieldMaxX) vx = -vx;
	if (virus.y > canvasCalcs.playFieldMaxY) vy = -vy;
	if (virus.x <= canvasCalcs.playFieldMinX) vx = -vx;
	if (virus.y <= canvasCalcs.playFieldMinY) vy = -vy;
	virus.x += vx;
	virus.y += vy;
	let playerUpdate = [];
	current_players.forEach((player) => {
		current_players.forEach((other) => {
			if (
				player.id !== other.id &&
				player.bubble_collision(other)
			) {
				[positionX, positionY] = getRandomPosition();
				player.x = positionX;
				player.y = positionY;
				player.score -= 1;
				[positionX, positionY] = getRandomPosition();
				other.x = positionX;
				other.y = positionY;
				other.score -= 1;
				playerUpdate.push(player);
				playerUpdate.push(other);
			}
		});

		let p = new Player(player);
		if (virus.collision(p)) {
			let [positionX, positionY] = getRandomPosition();
			player.x = positionX;
			player.y = positionY;
			player.score -= virus.score;
			playerUpdate.push(player);
		}
		p = new Player(player);
		if (p.collision(vaccine)) {
			player.score += vaccine.value;
			let [vaccineX, vaccineY] = getRandomPosition();
			vaccine = new Collectible({
				x: vaccineX,
				y: vaccineY,
				w: 25,
				h: 25,
				value: 1,
				id: new Date(),
			});
			playerUpdate.push(player);
		}
	});
	io.emit("update", {
		players: current_players,
		vaccine: vaccine,
		virus: virus,
		playerList: playerUpdate,
	});
};

setInterval(tick, 10);

module.exports = app; // For testing
