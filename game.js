import { getGameStart } from "./mainmenu.js";


// import { pauseGame } from "./pause.js"


let gameRunning = false;

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

let enemies = [];

const enemyTypes = ['basic', 'shooter']; // Kaksi vihollistyypit, toinen vaan liikkuu pelaajaa kohti ja toinen liikkee horizontaalisesti ja ampuu


let fireRate = 200; // Millisekunteina
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
    speed: 200
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
    if (event.code === 'Escape' && !event.repeat && canvas) { // Pausetaan ESCillä
        gameRunning = !gameRunning;
    }
});




export function gameStart() {
    gameRunning = true;

    canvas = document.createElement('canvas'); // Luodaan canvas
    canvas.width = window.innerWidth; // Canvaksen koko
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    context = canvas.getContext('2d');

    previousTime = performance.now(); // Asetetaan nykyinen aika ennen ekaa game looppia, koska requestAnimationFrame antaa automaattisesti sivun nykyisen
                                      // ajan. Jos ei aseteta tätä, ensimmäinen frame on turhaa pitkä 
                                      // (ei kylläkään vaikuta sinänsä mihinkään koska me capataan jokanen frame 0.05 sekuntiin joka tapauksessa)
    requestAnimationFrame(gameLoop); // Alotetaan game looppi
}


function roundHandler() {
    if (!roundOngoing) {
        roundOngoing = true;
        enemiesLeft = enemyAmount;
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


function spawnEnemy() {
    let enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    if (enemyType === enemyTypes[0]) {
        const enemy = {
            x: Math.random() * (window.innerWidth),
            y: Math.random() * (window.innerHeight / 4), // Spawnataan vihu canvaksen yläosaan
            speed: enemySpeed,
            type: enemyType
        };
        enemies.push(enemy);
    }
    else{
        const enemy = {
            x: Math.random() * (window.innerWidth),
            y: window.innerHeight / 6,
            speed: enemySpeed,
            type: enemyType,
            direction: Math.random() < 0.5 ? -1 : 1 // Valitaa satunnaisesti vihollisen aloitussuunta
        };
        enemies.push(enemy);
    }

    
}

function spawnEnemies() {
    for (let i = 0; i < enemyAmount; i++) {
        setTimeout(spawnEnemy, i * 200); 
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
        spawnBullet(player.x + playerSize / 2, player.y + playerSize / 2, directionX, directionY);
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
            gameRunning = false;
            alert('Game Over!');
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
                break;
            }
        }
    }

    for (const bullet of enemyBullets) { // Checkataan osuuko vihun luoti pelaajaan
        const dx = bullet.x - player.x;
        const dy = bullet.y - player.y;

        const distance = Math.hypot(dx, dy);

        if (distance < playerSize - bulletSize) {
            gameRunning = false;
            alert('Game Over!');
            break;
        }
    }
}



function drawEnemies() {
    for (const enemy of enemies) {
        if(enemy.type === enemyTypes[1]){ // Vihollisen väri tyypin mukaan, muutetaan myöhemmin tätä kun käytetään kuvia
            context.fillStyle = 'blue'; 
        }else{
            context.fillStyle = 'red'; 
        }
        context.beginPath();
        context.arc(enemy.x, enemy.y, enemySize / 2, 0, Math.PI * 2); // Piirretään ympyrä, tää muuttuu kuvaksi myöhemmin
        context.fill();
    }
}

function drawPlayer() {
    context.fillStyle = 'green';
    context.fillRect(player.x - playerSize / 2, player.y - playerSize / 2, playerSize, playerSize);
    // Piirretään pelaaja neliönä, joudutaan miinustamaan pelaajan sijainnista puolet koosta, jotta pelaajan grafiikan keskipiste on pelaajan oikea sijainti.
}

function drawBullets() {
    context.fillStyle = 'yellow';
    for (const bullet of bullets) {
        context.beginPath();
        context.arc(bullet.x, bullet.y, bulletSize, 0, Math.PI * 2);
        context.fill();
    }
}
function drawEnemyBullets() {
    context.fillStyle = 'orange';
    for (const bullet of enemyBullets) {
        context.beginPath();
        context.arc(bullet.x, bullet.y, bulletSize, 0, Math.PI * 2);
        context.fill();
    }
}

function drawRoundText() {
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.fillText(`Round: ${round}`, 10, 30);
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Kumitetaan kaikki canvakselta
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
    checkPlayerCollision();


    handleEnemyShooting(deltaTime);


    clearCanvas(); // TÄRKEÄ, muuten vanhat piirrokset jää näkyviin
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawEnemyBullets();
    drawRoundText();

    
    if (enemiesLeft <= 0) {
        roundOngoing = false;
        
        setTimeout(roundHandler, 1000); //Pieni väli ennen seuraavaa rundia
           
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

