import { getGameStart } from "./mainmenu.js";


// import { pauseGame } from "./pause.js"


let gameRunning = false;
const pauseDialog = document.getElementById('pause-dialog');
const resumeButton = document.getElementById('resume-button');
const restartButton = document.getElementById('restart-button');
const pauseTitle = document.getElementById('pause-title');
const pauseContent = document.getElementById('pause-content');
const gameOverContent = document.getElementById('game-over-content');
const balanceDisplay = document.getElementById('balance');
const dialogBalanceDisplay = document.getElementById('dialog-balance');
const finalRoundDisplay = document.getElementById('final-round');
const finalBalanceDisplay = document.getElementById('final-balance');
const upgradeCosts = [10, 50, 100, 500];
const purchasedUpgrades = {
    'fire-rate': new Set(),
    movement: new Set()
};
let balance = 0;
let gameOver = false;
let gameLoopStarted = false;
let enemySpawnTimeouts = [];
let nextRoundTimeout = null;

function updateBalanceDisplay() {
    balanceDisplay.textContent = balance;
    dialogBalanceDisplay.textContent = balance;
    updateUpgradeButtons();
}

function updateUpgradeButtons() {
    for (const button of pauseDialog.querySelectorAll('[data-upgrade][data-level]')) {
        const upgrade = button.dataset.upgrade;
        const level = Number(button.dataset.level);
        const cost = upgradeCosts[level - 1];
        const purchasedLevels = purchasedUpgrades[upgrade];
        const isPurchased = purchasedLevels.has(level);
        const previousLevelPurchased = level === 1 || purchasedLevels.has(level - 1);

        button.disabled = isPurchased || !previousLevelPurchased || balance < cost;
        button.textContent = isPurchased
            ? `Level ${level} purchased`
            : `Level ${level} · ${cost} points`;
    }
}

function buyUpgrade(button) {
    const upgrade = button.dataset.upgrade;
    const level = Number(button.dataset.level);
    const cost = upgradeCosts[level - 1];
    const purchasedLevels = purchasedUpgrades[upgrade];

    if (
        purchasedLevels.has(level)
        || (level > 1 && !purchasedLevels.has(level - 1))
        || balance < cost
    ) {
        return;
    }

    balance -= cost;
    purchasedLevels.add(level);
    if (upgrade === 'fire-rate') {
        fireRate = Math.max(50, fireRate - 50);
    } else {
        player.speed += 50;
    }
    updateBalanceDisplay();
}

pauseDialog.querySelectorAll('[data-upgrade][data-level]').forEach((button) => {
    button.addEventListener('click', () => buyUpgrade(button));
});
updateBalanceDisplay();

function resumeGame() {
    if (gameOver) return;
    pauseDialog.close();
    gameRunning = true;
}

resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', startNewGame);

document.addEventListener('DOMContentLoaded', () => {
    getGameStart();
});


const keys = {
    'KeyW': false,
    'KeyA': false,
    'KeyS': false,
    'KeyD': false
};


// Kaiken maailman variableja
let canvas = null;
let context = null;


let enemySize = 20;
let enemySpeed = 100;
let stars = [];
const playerSpriteSize = 48;
const enemySpriteSize = 48;
const enemyBulletSpriteSize = 36;
const playerSprite = new Image();
playerSprite.src = new URL('./01ship.png', import.meta.url);
const basicEnemySprite = new Image();
basicEnemySprite.src = new URL('./02agroM.png', import.meta.url);
const shooterEnemySprite = new Image();
shooterEnemySprite.src = new URL('./03shooterM.png', import.meta.url);
const enemyBulletSprite = new Image();
enemyBulletSprite.src = new URL('./04shooterB.png', import.meta.url);

let enemies = [];

const enemyTypes = ['basic', 'shooter']; // Kaksi vihollistyypit, toinen vaan liikkuu pelaajaa kohti ja toinen liikkee horizontaalisesti ja ampuu


let fireRate = 400; // Millisekunteina
let bulletSize = 5;
let bulletSpeed = 300;
let bullets = [];

let enemyBullets = []; // Tehään vihuille omat luodit niin ei tarvii kikkailla sillä, että osuuko pelaajan oma luoti itseensä
let enemyBulletSpeed = 400; 
let enemyShootChance = 0.001; // Vihujen ampumisen todennäköisyys, ampuminen callataan joka frame eli täytyy olla pieni.


let roundOngoing = false;
let round = 1;
let isFirstRound = true;
let enemyAmount = 10;
let enemiesLeft = 0;
let enemiesThisRound = 0;


let shooting = false;
let canShoot = true;


let mouseX = 0;
let mouseY = 0;


let playerSize = 20;
const playerSpawnX = window.innerWidth / 2 - playerSize / 2; // Laitetaan pelaajan spawn point keskelle
const playerSpawnY = window.innerHeight / 2 - playerSize / 2;

let player = { // Luodaan pelaaja
    x: playerSpawnX,
    y: playerSpawnY,
    speed: 100
};



document.addEventListener('pointerdown', (event) => {
    if(event.button === 0) // Ammutaan vaan jos left clickataan
        shooting = true;
});

document.addEventListener('pointerup', (event) => {
    if(event.button === 0) // Lopetataan vaan left clickistä
        shooting = false;
});

document.addEventListener('pointermove', (event) => { // Päivitetään hiiren koordinaatit
    mouseX = event.clientX;
    mouseY = event.clientY;
});



document.addEventListener('keydown', (event) => { // Päivitetään näppäimien tilat
    keys[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && !event.repeat && canvas) {
        event.preventDefault();
        if (gameOver) return;
        if (pauseDialog.open) {
            resumeGame();
        } else {
            gameRunning = false;
            pauseTitle.textContent = 'Game Paused';
            pauseContent.hidden = false;
            gameOverContent.hidden = true;
            resumeButton.hidden = false;
            pauseDialog.showModal();
        }
    }
});




export function gameStart() {
    gameRunning = true;

    canvas = document.createElement('canvas'); // Luodaan canvas
    canvas.width = window.innerWidth; // Canvaksen koko
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    context = canvas.getContext('2d');
    stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.3 + 0.1
    }));
    roundHandler();

    previousTime = performance.now(); // Asetetaan nykyinen aika ennen ekaa game looppia, koska requestAnimationFrame antaa automaattisesti sivun nykyisen
                                      // ajan. Jos ei aseteta tätä, ensimmäinen frame on turhaa pitkä 
                                      // (ei kylläkään vaikuta sinänsä mihinkään koska me capataan jokanen frame 0.05 sekuntiin joka tapauksessa)
    if (!gameLoopStarted) {
        gameLoopStarted = true;
        requestAnimationFrame(gameLoop); // Alotetaan game looppi
    }
}

function clearGameTimers() {
    for (const timeout of enemySpawnTimeouts) {
        clearTimeout(timeout);
    }
    enemySpawnTimeouts = [];
    clearTimeout(nextRoundTimeout);
    nextRoundTimeout = null;
}

function finishGame() {
    if (gameOver) return;

    gameRunning = false;
    gameOver = true;
    shooting = false;
    clearGameTimers();
    pauseTitle.textContent = 'Game Over';
    pauseContent.hidden = true;
    gameOverContent.hidden = false;
    resumeButton.hidden = true;
    finalRoundDisplay.textContent = round;
    finalBalanceDisplay.textContent = balance;
    if (!pauseDialog.open) {
        pauseDialog.showModal();
    }
}

function startNewGame() {
    clearGameTimers();
    balance = 0;
    purchasedUpgrades['fire-rate'].clear();
    purchasedUpgrades.movement.clear();
    fireRate = 400;
    player.speed = 100;
    player.x = window.innerWidth / 2;
    player.y = window.innerHeight / 2;
    enemies = [];
    bullets = [];
    enemyBullets = [];
    roundOngoing = false;
    round = 1;
    isFirstRound = true;
    enemyAmount = 10;
    enemiesLeft = 0;
    enemiesThisRound = 0;
    canShoot = true;
    shooting = false;
    for (const key of Object.keys(keys)) {
        keys[key] = false;
    }
    gameOver = false;
    gameRunning = true;
    pauseTitle.textContent = 'Game Paused';
    pauseContent.hidden = false;
    gameOverContent.hidden = true;
    resumeButton.hidden = false;
    pauseDialog.close();
    updateBalanceDisplay();
    clearCanvas();
    roundHandler();
}


function roundHandler() {
    if (!roundOngoing) {
        roundOngoing = true;
        enemiesLeft = enemyAmount;
        enemiesThisRound = enemyAmount;
        spawnEnemies();
        if (isFirstRound) { // Checkataan onko eka erä, koska jos on ja lisätään erän lukuun, niin aloitettaisiin tokasta erästä
            isFirstRound = false;
            enemyAmount += 5;
            return;
        }
        round++; 
        enemyAmount += 5;
    }
}

function completeRound() {
    roundOngoing = false;
    balance += 10;
    updateBalanceDisplay();
    nextRoundTimeout = setTimeout(roundHandler, 1000);
}


function spawnEnemy() {
    let enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    if (enemyType === enemyTypes[0]) {
        const enemy = {
            x: Math.random() * (window.innerWidth),
            y: Math.random() * (window.innerHeight / 4), // Spawnataan vihu canvaksen yläosaan
            speed: enemySpeed,
            type: enemyType,
            movementPhase: Math.random() * Math.PI * 2
        };
        enemies.push(enemy);
    }
    else{
        const enemy = {
            x: Math.random() * (window.innerWidth),
            y: window.innerHeight / 6,
            speed: enemySpeed,
            type: enemyType,
            direction: Math.random() < 0.5 ? -1 : 1, // Valitaa satunnaisesti vihollisen aloitussuunta
            movementPhase: Math.random() * Math.PI * 2
        };
        enemies.push(enemy);
    }

    
}

function spawnEnemies() {
    for (let i = 0; i < enemyAmount; i++) {
        enemySpawnTimeouts.push(setTimeout(spawnEnemy, i * 200));
    }
}


function handleEnemyMovement(deltaTime) {
    for (const enemy of enemies) {
        if(enemy.type === enemyTypes[0]) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed * deltaTime; // Laitetaan vihu liikkumaan pelaajaa päin
                enemy.y += (dy / distance) * enemy.speed * deltaTime;
            }
        }
        else{
            const radius = enemySize / 2;
            const leftEdge = radius; // Lasketaan canvaksen rajat
            const rightEdge = canvas.width - radius; 
        

            enemy.x += enemy.direction * enemy.speed * deltaTime; // Liikutetaan vihollista vaakasuunnassa

            if (enemy.x >= rightEdge) { // Jos vihollinen osuu reunaan, vaihetaan sen suuntaa.
                enemy.x = rightEdge;
                enemy.direction = -1;
            } else if (enemy.x <= leftEdge) {
                enemy.x = leftEdge;
                enemy.direction = 1;
            }
        }
    }
}

function handleEnemyShooting() {
    for (const enemy of enemies) {
        if (enemy.type === enemyTypes[1]) { 
            if (Math.random() < enemyShootChance) { 
                const dx = Math.random() * 2 - 1; // Randomisoidaan luodin suunta horisontaalisesti
                const dy = 1;

                const distance = Math.hypot(dx, dy); 

                const directionX = dx / distance;
                const directionY = dy / distance;

                spawnEnemyBullet(enemy.x, enemy.y, directionX, directionY);
            }
        }
    }
}


function shoot(){
    if (!canShoot) return;
    canShoot = false;
    setTimeout(() => {
        canShoot = true;
    }, fireRate);

    const dx = mouseX - (player.x + playerSize / 2); // Lasketaan kuinka monta pixeliä ero hiiren ja pelaajan välillä on
    const dy = mouseY - (player.y + playerSize / 2);
    const distance = Math.hypot(dx, dy); // Lasketaan etäisyys hiiren ja pelaajan välillä
    if (distance > 0) {
        const directionX = dx / distance;
        const directionY = dy / distance;
        spawnBullet(player.x, player.y - playerSpriteSize / 2, directionX, directionY);
    }
}

function spawnBullet(x, y, directionX, directionY){
    const bullet = {
        x: x,
        y: y,
        speed: bulletSpeed,
        directionX: directionX,
        directionY: directionY
    };
    bullets.push(bullet);
}

function spawnEnemyBullet(x, y, directionX, directionY){
    const bullet = {
        x: x,
        y: y,
        speed: enemyBulletSpeed,
        directionX: directionX,
        directionY: directionY
    };
    enemyBullets.push(bullet);
}

function handleBulletMovement(deltaTime) {
    for (const bullet of bullets) {
        bullet.x += bullet.directionX * bullet.speed * deltaTime;
        bullet.y += bullet.directionY * bullet.speed * deltaTime;
    }
    for (const bullet of enemyBullets) {
        bullet.x += bullet.directionX * bullet.speed * deltaTime;
        bullet.y += bullet.directionY * bullet.speed * deltaTime;
    }
}



function checkPlayerCollision() {
    for (const enemy of enemies) {

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const distance = Math.hypot(dx, dy);

        if (distance < playerSize) { 
            finishGame();
            break;
        }
    }
}

function checkBulletCollision() {
    for (const bullet of bullets) { // Checkataan osuuko pelaajan luoti viholliseen
        for (const enemy of enemies) {
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;

            const distance = Math.hypot(dx, dy);

            if (distance < enemySize - bulletSize) {
                enemies.splice(enemies.indexOf(enemy), 1); //poistetaan vihollinen
                bullets.splice(bullets.indexOf(bullet), 1); //poistetaan luoti
                enemiesLeft--;
                balance++;
                updateBalanceDisplay();
                break;
            }
        }
    }

    for (const bullet of enemyBullets) { // Checkataan osuuko vihun luoti pelaajaan
        const dx = bullet.x - player.x;
        const dy = bullet.y - player.y;

        const distance = Math.hypot(dx, dy);

        if (distance < playerSize - bulletSize) {
            finishGame();
            break;
        }
    }
}



function drawEnemies() {
    const time = performance.now() / 900;
    for (const enemy of enemies) {
        const sprite = enemy.type === enemyTypes[1] ? shooterEnemySprite : basicEnemySprite;
        if (sprite.complete && sprite.naturalWidth > 0) {
            const phase = ((time + enemy.movementPhase) / (Math.PI * 2)) % 1;
            const progress = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
            const easedProgress = progress * progress * (3 - 2 * progress);
            const yOffset = (easedProgress * 2 - 1) * 8;
            context.drawImage(
                sprite,
                enemy.x - enemySpriteSize / 2,
                enemy.y + yOffset - enemySpriteSize / 2,
                enemySpriteSize,
                enemySpriteSize
            );
        }
    }
}

function drawPlayer() {
    if (playerSprite.complete && playerSprite.naturalWidth > 0) {
        context.drawImage(
            playerSprite,
            player.x - playerSpriteSize / 2,
            player.y - playerSpriteSize / 2,
            playerSpriteSize,
            playerSpriteSize
        );
    }
}

function drawBullets() {
    for (const bullet of bullets) {
        context.save();
        context.translate(bullet.x, bullet.y);
        context.rotate(Math.atan2(bullet.directionY, bullet.directionX));
        context.fillStyle = '#fff36a';
        context.beginPath();
        context.moveTo(10, 0);
        context.lineTo(-7, -3);
        context.lineTo(-4, 0);
        context.lineTo(-7, 3);
        context.closePath();
        context.fill();
        context.restore();
    }
}
function drawEnemyBullets() {
    for (const bullet of enemyBullets) {
        if (enemyBulletSprite.complete && enemyBulletSprite.naturalWidth > 0) {
            context.drawImage(
                enemyBulletSprite,
                bullet.x - enemyBulletSpriteSize / 2,
                bullet.y - enemyBulletSpriteSize / 2,
                enemyBulletSpriteSize,
                enemyBulletSpriteSize
            );
        }
    }
}

function drawRoundText() {
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.fillText(`Round: ${round}`, 10, 30);
    context.fillText(`Kills: ${enemiesThisRound - enemiesLeft}/${enemiesThisRound}`, 10, 58);
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Kumitetaan kaikki canvakselta
}

function drawStars() {
    for (const star of stars) {
        context.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
    }
}


function update(deltaTime){
    if (!gameRunning) return;

    let dx = Number(keys['KeyD']) - Number(keys['KeyA']); // Muutetaan booleanit numeroiksi jotta voidaan helpommin checkata onko liike diagonaalinen
    let dy = Number(keys['KeyS']) - Number(keys['KeyW']); 

    if (dx !== 0 && dy !== 0) { // Diagonaalisen liikkeen normalisaatio
        dx = dx / Math.SQRT2;
        dy = dy / Math.SQRT2;
    }

    player.x += dx * player.speed * deltaTime;
    player.y += dy * player.speed * deltaTime;

    if (shooting) {
        shoot();
    }


    handleEnemyMovement(deltaTime);
    handleBulletMovement(deltaTime);
    checkBulletCollision();
    if (gameOver) return;
    checkPlayerCollision();
    if (gameOver) return;


    handleEnemyShooting(deltaTime);


    clearCanvas(); // TÄRKEÄ, muuten vanhat piirrokset jää näkyviin
    drawStars();
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawPlayer();
    drawRoundText();

    
    if (roundOngoing && enemiesLeft <= 0) {
        completeRound();
    }


}

let previousTime = 0;

function gameLoop(currentTime){

    const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.05); // Lasketaan ajan muutos, jos se on liian suuri, rajoitetaan se 0.05 jotta esim.
    previousTime = currentTime;                                            // Lagi ei teleporttaile pelaajaa yms

    if(gameRunning)
        update(deltaTime);

    requestAnimationFrame(gameLoop);
}
