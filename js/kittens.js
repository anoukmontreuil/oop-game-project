// ***[ CONSTANTS ]******************************************************************************************

// This section contains some game constants. It is not super interesting
const GAME_WIDTH = 375;
const GAME_HEIGHT = 500;
const LEVEL_THRESHOLD = 25000; // ADDED for the purpose of calculating levels & enemy speed @ spawn¸

const SHOT_SPEED = 2; // ADDED for the purpose of customizing shot speed.
const MAX_ACTIVE_SHOTS = 1; // ADDED for the purpose of limiting the size of the shots array.

const BG_MUSIC = 'audio/Chacarron_Loop.mp3';
const GAME_OVER_PLAYER_CRY = 'audio/Crying_Steven.mp3';
const GAME_OVER_BG_MUSIC = 'audio/Game_Over_FFI_Organ.mp3';
const ENEMY_IMPACT_SFX_ARRAY = ['audio/Thud_1.mp3', 'audio/Thud_2.mp3'];
const JEWELY_SND = 'audio/Jewely.mp3';

const ENEMY_WIDTH = 75;
const ENEMY_HEIGHT = 156;
const ENEMY_TOP_BUFFER = 58;
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
['upRainbowLaser.png', 'leftRainbowLaser.png', 'rightRainbowLaser.png', 'downRainbowLaser.png',
'enemy.png', 'cookie_cat_8-bit_starry_background.png', 'player.png', 'player_hit.png', 
'lion_licker_static_bg_DARK.gif', 'playerGameOver.png'].forEach(imgName => {
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

class Shot extends Entity {
    constructor(xPos, yPos, direction) {
        super();
        this.x = xPos;
        this.y = yPos;
        this.direction = direction;
        this.speed = SHOT_SPEED;
        this.sprite = images[direction + 'RainbowLaser.png'];
    }

    update(timeDiff) {
        switch (this.direction) {
            case UP: this.y = this.y - timeDiff * this.speed; break;
            case LEFT: this.x = this.x - timeDiff * this.speed; break;
            case RIGHT: this.x = this.x + timeDiff * this.speed; break;
            case DOWN: this.y = this.y + timeDiff * this.speed; break;
        }
    }
}

class Enemy extends Entity {
    constructor(xPos, level) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];
        // Each enemy should have a different speed
        this.speed = Math.random() / 3.5 + (level * 0.033) + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }

    collidesWithHitBox(xPos, yPos) {
        if (xPos >= this.x && xPos < this.x + ENEMY_WIDTH
            && yPos >= this.y + ENEMY_TOP_BUFFER
            && yPos < (this.y + ENEMY_TOP_BUFFER) + (ENEMY_HEIGHT - ENEMY_TOP_BUFFER)) {
            return true;
        } else {
            return false;
        }
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
        gameEngine.addShot(this.x, this.y, direction);
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
        // Set the level
        this.level = 1;

        // Set the bonus;
        this.bonus = 0;

        // Setup the player
        this.player = new Player();

        // Setup enemies, making sure there are always three
        this.setupEnemies();
        this.setupShots();

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
        var enemySpots = Math.floor(GAME_WIDTH / ENEMY_WIDTH);

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (this.enemies[enemySpot]) { // Removed: !enemySpot || so that lane 0 (leftmost) can spawn enemies
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH, this.level);
    }

    /* ORIGINAL 'addShot'
    addShot(xPos, yPos, direction) {
        this.shots.push(new Shot(xPos + (PLAYER_WIDTH / 2), yPos + (PLAYER_HEIGHT / 2), direction));
    }*/

    addShot(xPos, yPos, direction) {
        // If the length of active shots is smaller than the allowed numbers of shots;
        // store the new shot into the first free spot in the 'shots' array. (Otherwise: do nothing.)
        if (this.shots.filter(s => s).length < MAX_ACTIVE_SHOTS) {
            let shotIdx = 0;
            while (typeof this.shots[shotIdx] === 'object' && shotIdx < MAX_ACTIVE_SHOTS) {
                shotIdx++;
            }
            this.shots[shotIdx] = new Shot(xPos + (PLAYER_WIDTH / 2), yPos + (PLAYER_HEIGHT / 2), direction);
            // Plays a sound whenever a shot is actually fired.
            let sound = new Audio();
            sound.src = JEWELY_SND;
            sound.play();
        }
    }

    // ADDED: Setting up the shots array so that, eventually, shots can be deleted if they're off canvas.
    setupShots() {
        if (!this.shots) {
            this.shots = [];
        }
    }

    // This method kicks off the game
    start() {
        this.score = 1;
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

        // TODO: Add Splash Screen...
    
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

        // Recalculate level with each new score
        this.level = Math.ceil(this.score / LEVEL_THRESHOLD);

        // ADDED: Call update on all shots 
        this.shots.forEach(shot => shot.update(timeDiff));

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));

        // Draw everything!
        this.ctx.drawImage(images['cookie_cat_8-bit_starry_background.png'], 0, 0); // draw the cookie cat background
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player
        this.shots.forEach(shot => shot.render(this.ctx)); // * ADDED

        // Check if any enemies should die; if player's lives decrement, or if shots should be deleted.
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            } else if (enemy.collidesWithHitBox(this.player.x, this.player.y)) {
                let impactThud = new Audio(ENEMY_IMPACT_SFX_ARRAY[Math.round(Math.random())]); // TODO
                impactThud.play();
                this.player.numLives--;
                delete this.enemies[enemyIdx];
            }
            this.shots.forEach((shot, shotIdx) => {
                if (enemy.collidesWithHitBox(shot.x, shot.y)) {
                    delete this.enemies[enemyIdx];
                    delete this.shots[shotIdx];
                    this.bonus += 100;
                }   
            });
        });

        // Check if any off-canvas shots should be deleted
        this.shots.forEach((shot, shotIndex) => {
            if (shot.x > GAME_WIDTH || shot.x < 0 || shot.y > GAME_HEIGHT || shot.y < 0) {
                delete this.shots[shotIndex];
            }
        });

        this.setupEnemies();
        this.setupShots();

        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            bgMusic.pause();
            bgMusic.currentTime = 0;
            gameOverPlayerCry.play();
            //gameOverBgMusic.play();
            this.player.sprite = images['playerGameOver.png'];
            this.ctx.drawImage(images['lion_licker_static_bg_DARK.gif'], 0, 0);
            this.player.render(this.ctx);
            this.ctx.font = 'bold 26px "Press Start 2P"';
            this.ctx.fillStyle = '#fffba6';
            this.ctx.fillText('Ugh...', (GAME_WIDTH / 4), (GAME_HEIGHT / 12) * 1);
            this.ctx.font = 'bold 14px "Press Start 2P"';
            this.ctx.fillText('Lion Lickers OVERLOAD!', (GAME_WIDTH / 15), (GAME_HEIGHT / 12) * 2);
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillText('SCORE: ' + this.score, (GAME_WIDTH / 15) * 2, (GAME_HEIGHT / 12) * 5);
            this.ctx.fillText('BONUS: ' + this.bonus, (GAME_WIDTH / 15) * 2, (GAME_HEIGHT / 12) * 6);
            this.ctx.fillStyle = '#FF0';
            this.ctx.fillText('TOTAL: ' + (this.score + this.bonus), (GAME_WIDTH / 15) * 2, (GAME_HEIGHT / 12) * 8);
        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 14px "Press Start 2P"';
            this.ctx.fillStyle = '#fffba6';
            this.ctx.fillText('SCORE: ' + this.score, 5, GAME_HEIGHT / 15);
            this.ctx.fillText('BONUS: ' + this.bonus, 5, (GAME_HEIGHT / 15) * 2);
            this.ctx.fillStyle = '#fffba6';
            this.ctx.fillText('LIVES: ' + this.player.numLives, (GAME_WIDTH / 11) * 7, GAME_HEIGHT / 15);
            this.ctx.fillText('LEVEL: ' + this.level, (GAME_WIDTH / 11) * 7, (GAME_HEIGHT / 15) * 2);
            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    isPlayerDead() {
        if (!this.player.numLives > 0) {
            return true;
        } else {
            return false;
        }
    }
}


// ***[ LAUNCH ]******************************************************************************************

// This section will start the game
var gameEngine = new Engine(document.getElementById('game'));

gameEngine.start();

let bgMusic = new Audio(BG_MUSIC);
bgMusic.loop = true;
bgMusic.play();

//let gameOverBgMusic = new Audio(GAME_OVER_BG_MUSIC);
let gameOverPlayerCry = new Audio(GAME_OVER_PLAYER_CRY);