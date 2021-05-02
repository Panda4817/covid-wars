require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const nocache = require("nocache");
const expect = require("chai");
const socket = require("socket.io");

const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner.js");

const app = express();
app.use(helmet.xssFilter());
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

module.exports = app; // For testing
