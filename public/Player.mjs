import { canvasCalcs } from "./canvas-data.mjs";

class Player {
	constructor({
		x = 10,
		y = 10,
		w = 30,
		h = 30,
		bw = 90,
		bh = 90,
		score = 0,
		id,
	}) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		(this.bw = bw), (this.bh = bh);
		this.speed = 10;
		this.score = score;
		this.id = id;
	}

	draw(context, img) {
		context.drawImage(img, this.x, this.y);
	}

	movePlayer(dir, speed) {
		if (dir === "up")
			this.y - speed >= canvasCalcs.playFieldMinY
				? (this.y -= speed)
				: (this.y -= 0);
		if (dir === "down")
			this.y + speed <= canvasCalcs.playFieldMaxY
				? (this.y += speed)
				: (this.y += 0);
		if (dir === "left")
			this.x - speed >= canvasCalcs.playFieldMinX
				? (this.x -= speed)
				: (this.x -= 0);
		if (dir === "right")
			this.x + speed <= canvasCalcs.playFieldMaxX
				? (this.x += speed)
				: (this.x += 0);
	}

	collision(item) {
		if (
			this.x < item.x + item.w &&
			this.x + this.w > item.x &&
			this.y < item.y + item.h &&
			this.y + this.h > item.y
		)
			return true;
	}

	bubble_collision(item) {
		if (
			this.x < item.x + item.bw &&
			this.x + this.bw > item.x &&
			this.y < item.y + item.bh &&
			this.y + this.bh > item.y
		)
			return true;
	}

	calculateRank(arr) {
		const sortedScores = arr.sort(
			(a, b) => b.score - a.score
		);
		const mainPlayerRank =
			this.score === 0
				? arr.length
				: sortedScores.findIndex(
						(obj) => obj.id === this.id
				  ) + 1;

		return `Rank: ${mainPlayerRank}/${arr.length}`;
	}
}

try {
	module.exports = Player;
} catch (e) {}

export default Player;
