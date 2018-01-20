// ***[ CONSTANTS ]******************************************************************************************

// This section contains some game constants. It is not super interesting
const GAME_WIDTH = 375;
const GAME_HEIGHT = 500;

const ENEMY_WIDTH = 75;
const ENEMY_HEIGHT = 156;
const ENEMY_RAINBOW_BUFFER = 58;
const MAX_ENEMIES = 3;

const PLAYER_WIDTH = 75;
const PLAYER_HEIGHT = 70; // originally: 54
const PLAYER_TOP_BUFFER = 10; // ADDED as a constant instead of keeping it hard-coded.
const PLAYER_START_NUM_LIVES = 5; // ADDED

// These two constants keep us from using "magic numbers" in our code
const LEFT_ARROW_CODE = 37;
const UP_ARROW_CODE = 38; // ADDED
const RIGHT_ARROW_CODE = 39;
const DOWN_ARROW_CODE = 40; // ADDED

// Added directionality to the shooting...
const LEFT_SHOOT_CODE = 65; // ADDED
const RIGHT_SHOOT_CODE = 68; // ADDED
const UP_SHOOT_CODE = 87; // ADDED
const DOWN_SHOOT_CODE = 83; // ADDED

// These two constants allow us to DRY
const LEFT = 'left';
const RIGHT = 'right';
const UP = 'up'; // ADDED
const DOWN = 'down'; // ADDED

// Preload game images
const images = {};
['upRainbowLaser.png', 'leftRainbowLaser.png', 'rightRainbowLaser.png', 'downRainbowLaser.png','enemy.png', 'cookie_cat_8-bit_starry_background.png', 'player.png', 'lion_licker_static_bg.gif', 'playerGameOver.png', 'smallfullheart.png', 'smallemptyheart.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});



// ***[ CLASSES ]******************************************************************************************

// This section is where you will be doing most of your coding

class Entity {
    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}

class Enemy extends Entity {
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];
        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }
}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - PLAYER_TOP_BUFFER;
        this.numLives = PLAYER_START_NUM_LIVES;
        this.sprite = images['player.png'];
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
        else if (direction === UP && this.y > 0) {
            this.y = this.y - PLAYER_HEIGHT;
        }
        else if (direction === DOWN && this.y < GAME_HEIGHT - (2 * PLAYER_HEIGHT)) {
            this.y = this.y + PLAYER_HEIGHT;
        }
    }

    shoot(direction) {
        console.log("shootin' " + direction + "!");
    }
}



// ***[ ENGINE ]******************************************************************************************

/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        // Setup enemies, making sure there are always three
        this.setupEnemies();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => e).length < MAX_ENEMIES) { // removed !! after arrow: unnecessary.
            this.addEnemy();
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = (GAME_WIDTH / ENEMY_WIDTH);

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (this.enemies[enemySpot]) { // Removed: !enemySpot || so that lane 0 (leftmost) can spawn enemies
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
    }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.lastFrame = Date.now();

        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            switch (e.keyCode) {
                case LEFT_ARROW_CODE: this.player.move(LEFT); break;
                case RIGHT_ARROW_CODE: this.player.move(RIGHT); break;
                case UP_ARROW_CODE: this.player.move(UP); break;
                case DOWN_ARROW_CODE: this.player.move(DOWN); break;

                case LEFT_SHOOT_CODE: this.player.shoot(LEFT); break;
                case RIGHT_SHOOT_CODE: this.player.shoot(RIGHT); break;
                case UP_SHOOT_CODE: this.player.shoot(UP); break;
                case DOWN_SHOOT_CODE: this.player.shoot(DOWN); break;
            }
        });

        this.gameLoop();
    }

 // ***[ GAMELOOP ]******************************************************************************************
    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill
    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));

        // Draw everything!
        this.ctx.drawImage(images['cookie_cat_8-bit_starry_background.png'], 0, 0); // draw the cookie cat background
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });
        this.setupEnemies();

        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 16px "Press Start 2P"';
            this.ctx.fillStyle = '#fffba6';
            this.ctx.fillText('Ugh, Lion Lickers SUCK!', 5, 30);
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillText('SCORE: ' + this.score, 5, 60);
        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 16px "Press Start 2P"';
            this.ctx.fillStyle = '#fffba6';
            this.ctx.fillText('SCORE: ' + this.score, 5, 30);
            this.ctx.fillText('LIVES: ' + this.player.numLives, (GAME_WIDTH / 11) * 7, 30);
            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    isPlayerDead() {
        if (this.enemies.some((enemy) => (enemy.y + ENEMY_RAINBOW_BUFFER) + (ENEMY_HEIGHT - ENEMY_RAINBOW_BUFFER) >= this.player.y
                                         && (this.player.y + PLAYER_HEIGHT) > enemy.y + ENEMY_RAINBOW_BUFFER
                                         && enemy.x === this.player.x)) {
                if (!this.player.numLives > 0) {
                    this.player.sprite = images['playerGameOver.png'];
                    this.ctx.drawImage(images['lion_licker_static_bg.gif'], 0, 0);
                    this.player.render(this.ctx);
                    return true;
                } else {
                    this.player.numLives--;
                    // TODO: Set a 1 second timeout before player is able to be legally struck again; otherwise
                    // he'll keep dying on the first touch.
                    return false;
                }
            }
        }
    }


// ***[ LAUNCH ]******************************************************************************************

// This section will start the game
var gameEngine = new Engine(document.getElementById('game'));

gameEngine.start();