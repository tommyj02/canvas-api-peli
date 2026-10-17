import { gameStart } from "./game.js";

const menuDiv = document.createElement('div');
menuDiv.id = 'menu';
menuDiv.classList.add('menuClass');

const startButton = document.createElement('button');
startButton.textContent = 'Start Game';

startButton.addEventListener('click', () => {
    gameStart();
    document.body.removeChild(menuDiv);
});

export function getGameStart(){
    document.body.appendChild(menuDiv);
    menuDiv.appendChild(startButton);
}