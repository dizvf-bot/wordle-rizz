// Import additional words - static extensive word list
import { additionalWords } from './wordbank.js';

// Word list - combine original words with additional words
const words = [
    "APPLE", "BRAVE", "CHILL", "DANCE", "EARTH", "FAITH", "GLAZE", "HOUSE", "IVORY", "JUICE",
    "KNOWS", "LIGHT", "MANGO", "NIGHT", "OCEAN", "PIANO", "QUILT", "ROUND", "SUGAR", "THINK",
    "UMBRA", "VIVID", "WATER", "XEROX", "YOUNG", "ZESTY",
    ...additionalWords
];

// Game state
let targetWord = getRandomWord();
let currentRow = 0;
let currentTile = 0;
let gameOver = false;

// Player stats object
let playerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayed: null,
    guessDistribution: [0, 0, 0, 0, 0, 0], // Wins in 1-6 guesses
    bestTime: null,
    averageTime: 0,
    totalPlayTime: 0,
    lettersUsed: {},
    totalGuesses: 0,
    fastestWin: null,
    favoriteStartingWord: null,
    startingWordCount: {} 
};

// Load stats from local storage
function loadStats() {
    const savedStats = localStorage.getItem('wordleStats');
    if (savedStats) {
        const loadedStats = JSON.parse(savedStats);
        playerStats = {
            ...playerStats,
            ...loadedStats
        };
        if (!playerStats.startingWordCount) {
            playerStats.startingWordCount = {};
        }
    }
    updateStatsDisplay();
}

// Save stats to local storage
function saveStats() {
    localStorage.setItem('wordleStats', JSON.stringify(playerStats));
    updateStatsDisplay();
}

// Update the stats display
function updateStatsDisplay() {
    document.getElementById('games-played').textContent = playerStats.gamesPlayed;
    
    const winPercentage = playerStats.gamesPlayed > 0 
        ? Math.round((playerStats.gamesWon / playerStats.gamesPlayed) * 100) 
        : 0;
    document.getElementById('win-percentage').textContent = winPercentage + '%';
    
    document.getElementById('current-streak').textContent = playerStats.currentStreak;
    document.getElementById('max-streak').textContent = playerStats.maxStreak;
    
    // Update last played date
    if (playerStats.lastPlayed) {
        const date = new Date(playerStats.lastPlayed);
        document.getElementById('last-played-date').textContent = date.toLocaleDateString();
    } else {
        document.getElementById('last-played-date').textContent = 'Never';
    }
    
    // Update guess distribution graph
    updateGuessDistribution();
    
    // Update advanced stats
    updateAdvancedStats();
}

// New function to update advanced stats display
function updateAdvancedStats() {
    // Average guesses per game
    const avgGuesses = playerStats.gamesPlayed > 0 
        ? (playerStats.totalGuesses / playerStats.gamesPlayed).toFixed(1) 
        : "N/A";
    document.getElementById('avg-guesses').textContent = avgGuesses;
    
    // Fastest win
    if (playerStats.fastestWin) {
        document.getElementById('fastest-win').textContent = `${playerStats.fastestWin}s`;
    } else {
        document.getElementById('fastest-win').textContent = "N/A";
    }
    
    // Favorite starting word
    let favoriteWord = "N/A";
    let maxCount = 0;
    
    if (playerStats.startingWordCount) {
        for (const [word, count] of Object.entries(playerStats.startingWordCount)) {
            if (count > maxCount) {
                maxCount = count;
                favoriteWord = word;
            }
        }
    }
    
    document.getElementById('favorite-word').textContent = favoriteWord;
    
    // Total play time
    const totalMinutes = Math.floor(playerStats.totalPlayTime / 60);
    document.getElementById('total-playtime').textContent = 
        totalMinutes > 0 ? `${totalMinutes}m ${playerStats.totalPlayTime % 60}s` : `${playerStats.totalPlayTime}s`;
}

// Update the guess distribution graph
function updateGuessDistribution() {
    const graphContainer = document.getElementById('guess-graph');
    graphContainer.innerHTML = '';
    
    // Calculate max value for scaling
    const maxValue = Math.max(...playerStats.guessDistribution, 1);
    
    // Create a bar for each guess count (1-6)
    for (let i = 0; i < 6; i++) {
        const value = playerStats.guessDistribution[i];
        const percentage = Math.max((value / maxValue) * 100, 5); // At least 5% width
        
        const row = document.createElement('div');
        row.className = 'graph-row';
        
        const label = document.createElement('div');
        label.className = 'graph-label';
        label.textContent = i + 1;
        
        const bar = document.createElement('div');
        bar.className = 'graph-bar';
        if (currentRow - 1 === i && gameOver && targetWord === getCurrentGuess()) {
            bar.classList.add('highlight');
        }
        bar.style.width = percentage + '%';
        bar.textContent = value;
        
        row.appendChild(label);
        row.appendChild(bar);
        graphContainer.appendChild(row);
    }
}

// Get the current guess
function getCurrentGuess() {
    let guess = '';
    for (let i = 0; i < 5; i++) {
        const tile = document.querySelector(`.tile[data-row="${currentRow-1}"][data-col="${i}"]`);
        guess += tile.textContent;
    }
    return guess;
}

// Update stats when a game is completed
function updateGameStats(isWin) {
    playerStats.gamesPlayed++;
    playerStats.totalGuesses += currentRow;
    
    if (!playerStats.startingWordCount) {
        playerStats.startingWordCount = {};
    }
    
    // Track first word of the game if available
    const firstWordRow = document.querySelector('.row:first-child');
    if (firstWordRow) {
        let firstWord = '';
        for (let i = 0; i < 5; i++) {
            const tile = firstWordRow.children[i];
            if (tile && tile.textContent) {
                firstWord += tile.textContent;
            }
        }
        
        if (firstWord.length === 5) {
            playerStats.startingWordCount[firstWord] = 
                (playerStats.startingWordCount[firstWord] || 0) + 1;
        }
    }
    
    if (isWin) {
        playerStats.gamesWon++;
        playerStats.currentStreak++;
        playerStats.guessDistribution[currentRow - 1]++;
        
        // Calculate time to win (mock implementation)
        const winTime = Math.floor(Math.random() * 120) + 10; // Random time between 10-130s
        
        if (!playerStats.fastestWin || winTime < playerStats.fastestWin) {
            playerStats.fastestWin = winTime;
        }
        
        playerStats.totalPlayTime += winTime;
        
        if (playerStats.currentStreak > playerStats.maxStreak) {
            playerStats.maxStreak = playerStats.currentStreak;
        }
    } else {
        playerStats.currentStreak = 0;
        
        // Add time for losses too
        playerStats.totalPlayTime += Math.floor(Math.random() * 90) + 30;
    }
    
    playerStats.lastPlayed = new Date().toISOString();
    saveStats();
}

// Sound effects
const keyPressSound = new Audio('key_press.mp3');
const correctGuessSound = new Audio('correct_guess.mp3');
const wrongGuessSound = new Audio('wrong_guess.mp3');
const winSound = new Audio('win_sound.mp3');

// Initialize the game
function initGame() {
    createBoard();
    addKeyboardEventListeners();
    document.getElementById('play-again').addEventListener('click', resetGame);
    
    // Display word count
    const wordCountElement = document.getElementById('word-count');
    wordCountElement.textContent = `${words.length} words loaded`;
    
    // Load player stats
    loadStats();
    
    // Set up leaderboard panel
    const leaderboardToggle = document.querySelector('.leaderboard-toggle');
    const leaderboardPanel = document.querySelector('.leaderboard-panel');
    const closeLeaderboard = document.querySelector('.close-leaderboard');
    
    leaderboardToggle.addEventListener('click', () => {
        leaderboardPanel.classList.toggle('hidden');
        
        // If opening the leaderboard, update the stats
        if (!leaderboardPanel.classList.contains('hidden')) {
            updateStatsDisplay();
        }
    });
    
    closeLeaderboard.addEventListener('click', () => {
        leaderboardPanel.classList.add('hidden');
    });
    
    // Set up instructions modal
    const helpButton = document.getElementById('help-button');
    const instructionsModal = document.getElementById('instructions-modal');
    const closeButton = document.querySelector('.close-button');
    
    helpButton.addEventListener('click', () => {
        instructionsModal.classList.remove('hidden');
    });
    
    closeButton.addEventListener('click', () => {
        instructionsModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === instructionsModal) {
            instructionsModal.classList.add('hidden');
        }
    });
    
    // Show instructions on first visit
    if (!localStorage.getItem('wordleInstructionsViewed')) {
        instructionsModal.classList.remove('hidden');
        localStorage.setItem('wordleInstructionsViewed', 'true');
    }
}

// Create the game board
function createBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.row = i;
            tile.dataset.col = j;
            row.appendChild(tile);
        }
        
        board.appendChild(row);
    }
}

// Add event listeners for keyboard and on-screen keyboard
function addKeyboardEventListeners() {
    // Physical keyboard
    document.addEventListener('keydown', handleKeyDown);
    
    // On-screen keyboard
    const keys = document.querySelectorAll('#keyboard button');
    keys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.getAttribute('data-key');
            handleKeyPress(keyValue);
        });
    });
}

// Handle key press events
function handleKeyDown(e) {
    if (gameOver) return;
    
    const key = e.key.toLowerCase();
    
    if (key === 'enter') {
        submitGuess();
    } else if (key === 'backspace') {
        deleteLetter();
    } else if (/^[a-z]$/.test(key)) {
        addLetter(key);
    }
}

// Handle on-screen keyboard clicks
function handleKeyPress(key) {
    if (gameOver) return;
    
    if (key === 'enter') {
        submitGuess();
    } else if (key === 'backspace') {
        deleteLetter();
    } else {
        addLetter(key);
    }
}

// Add a letter to the current position
function addLetter(letter) {
    if (currentTile < 5) {
        keyPressSound.currentTime = 0;
        keyPressSound.play();
        
        const tile = document.querySelector(`.tile[data-row="${currentRow}"][data-col="${currentTile}"]`);
        tile.textContent = letter.toUpperCase();
        tile.classList.add('filled');
        tile.classList.add('bounce');
        setTimeout(() => {
            tile.classList.remove('bounce');
        }, 500);
        currentTile++;
    }
}

// Delete the last letter
function deleteLetter() {
    if (currentTile > 0) {
        keyPressSound.currentTime = 0;
        keyPressSound.play();
        
        currentTile--;
        const tile = document.querySelector(`.tile[data-row="${currentRow}"][data-col="${currentTile}"]`);
        tile.textContent = '';
        tile.classList.remove('filled');
    }
}

// Submit the current guess
function submitGuess() {
    if (currentTile !== 5) {
        wrongGuessSound.currentTime = 0;
        wrongGuessSound.play();
        
        showMessage("Not enough letters");
        shakeRow();
        return;
    }
    
    // Get the current guess
    let guess = '';
    for (let i = 0; i < 5; i++) {
        const tile = document.querySelector(`.tile[data-row="${currentRow}"][data-col="${i}"]`);
        guess += tile.textContent;
    }
    
    // Simple word validation (check if it's in our list)
    if (!words.includes(guess)) {
        wrongGuessSound.currentTime = 0;
        wrongGuessSound.play();
        
        showMessage("Not in word list");
        shakeRow();
        return;
    }
    
    // Check the guess against the target word
    checkGuess(guess);
    
    // Move to the next row
    currentRow++;
    currentTile = 0;
    
    // Check if game is over
    if (guess === targetWord) {
        setTimeout(() => {
            winSound.play();
            showGameOver(true);
        }, 1500);
        gameOver = true;
    } else if (currentRow === 6) {
        setTimeout(() => {
            wrongGuessSound.play();
            showGameOver(false);
        }, 1500);
        gameOver = true;
    }
}

// Check the guess and update the UI
function checkGuess(guess) {
    const targetLetters = targetWord.split('');
    const guessLetters = guess.split('');
    
    // First pass: Mark correct letters
    const correctIndices = [];
    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            correctIndices.push(i);
        }
    }
    
    // Track if this guess had any correct letters
    let hasCorrect = correctIndices.length > 0;
    
    // Second pass: Mark present and absent letters
    for (let i = 0; i < 5; i++) {
        const tile = document.querySelector(`.tile[data-row="${currentRow}"][data-col="${i}"]`);
        const keyButton = document.querySelector(`button[data-key="${guessLetters[i].toLowerCase()}"]`);
        
        // Animation delay
        setTimeout(() => {
            tile.classList.add('flip');
            
            setTimeout(() => {
                if (correctIndices.includes(i)) {
                    tile.classList.add('correct');
                    if (keyButton && !keyButton.classList.contains('correct')) {
                        keyButton.classList.add('correct');
                    }
                } else if (targetLetters.includes(guessLetters[i])) {
                    // Check if we haven't already accounted for this letter
                    let letterCount = targetLetters.filter(l => l === guessLetters[i]).length;
                    let correctCount = 0;
                    let presentCount = 0;
                    
                    // Count how many of this letter are already marked as correct
                    for (let j = 0; j < 5; j++) {
                        if (correctIndices.includes(j) && guessLetters[j] === guessLetters[i]) {
                            correctCount++;
                        }
                    }
                    
                    // Count how many of this letter are already marked as present
                    for (let j = 0; j < i; j++) {
                        if (!correctIndices.includes(j) && guessLetters[j] === guessLetters[i] && 
                            document.querySelector(`.tile[data-row="${currentRow}"][data-col="${j}"]`).classList.contains('present')) {
                            presentCount++;
                        }
                    }
                    
                    if (correctCount + presentCount < letterCount) {
                        tile.classList.add('present');
                        if (keyButton && !keyButton.classList.contains('correct') && !keyButton.classList.contains('present')) {
                            keyButton.classList.add('present');
                        }
                    } else {
                        tile.classList.add('absent');
                        if (keyButton && !keyButton.classList.contains('correct') && !keyButton.classList.contains('present')) {
                            keyButton.classList.add('absent');
                        }
                    }
                } else {
                    tile.classList.add('absent');
                    if (keyButton && !keyButton.classList.contains('correct') && !keyButton.classList.contains('present')) {
                        keyButton.classList.add('absent');
                    }
                }
                
                tile.classList.remove('flip');
                tile.classList.add('flip-back');
                
                // Play sound for the last tile
                if (i === 4) {
                    if (guess === targetWord) {
                        correctGuessSound.play();
                    } else if (hasCorrect) {
                        correctGuessSound.play();
                    } else {
                        wrongGuessSound.play();
                    }
                }
            }, 250);
            
        }, i * 300);
    }
}

// Show a message to the user
function showMessage(text) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.classList.remove('hidden');
    
    setTimeout(() => {
        message.classList.add('hidden');
    }, 1500);
}

// Shake the current row for invalid guesses
function shakeRow() {
    const row = document.querySelector(`.row:nth-child(${currentRow + 1})`);
    row.classList.add('shake');
    
    setTimeout(() => {
        row.classList.remove('shake');
    }, 500);
}

// Show game over screen
function showGameOver(isWin) {
    const gameOverScreen = document.getElementById('game-over');
    const resultMessage = document.getElementById('result-message');
    const answerElement = document.getElementById('answer');
    
    if (isWin) {
        resultMessage.textContent = "Congratulations!";
        if (currentRow === 1) {
            resultMessage.textContent += " Genius!";
        } else if (currentRow === 2) {
            resultMessage.textContent += " Magnificent!";
        } else if (currentRow === 3) {
            resultMessage.textContent += " Impressive!";
        } else if (currentRow === 4) {
            resultMessage.textContent += " Splendid!";
        } else if (currentRow === 5) {
            resultMessage.textContent += " Great!";
        } else {
            resultMessage.textContent += " Phew!";
        }
    } else {
        resultMessage.textContent = "Better luck next time!";
        answerElement.textContent = `The word was: ${targetWord}`;
    }
    
    gameOverScreen.classList.remove('hidden');
    
    // Update player stats
    updateGameStats(isWin);
}

// Get a random word from the list
function getRandomWord() {
    return words[Math.floor(Math.random() * words.length)];
}

// Reset the game
function resetGame() {
    targetWord = getRandomWord();
    currentRow = 0;
    currentTile = 0;
    gameOver = false;
    
    // Reset UI
    createBoard();
    document.getElementById('game-over').classList.add('hidden');
    
    // Reset keyboard colors
    const keys = document.querySelectorAll('#keyboard button');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame);
