// Snake Game - Vanilla JavaScript Implementation
class SnakeGame {
    constructor() {
        // Game configuration
        this.CELL_SIZE = 20;
        this.BOARD_WIDTH = 25;
        this.BOARD_HEIGHT = 20;
        this.INITIAL_SNAKE_LENGTH = 3;
        
        // Game state
        this.gameState = 'IDLE'; // IDLE, PLAYING, PAUSED, GAME_OVER, COUNTDOWN
        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        this.score = 0;
        this.highScore = 0;
        this.speed = 150; // milliseconds
        this.difficulty = 'MEDIUM';
        this.wrapMode = false;
        this.countdownValue = 3;
        
        // Game loop
        this.gameLoop = null;
        this.countdownTimer = null;
        
        // DOM elements
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentScoreEl = document.getElementById('current-score');
        this.highScoreEl = document.getElementById('high-score');
        this.gameStatusEl = document.getElementById('game-status');
        this.speedIndicatorEl = document.getElementById('speed-indicator');
        this.speedTextEl = document.getElementById('speed-text');
        this.countdownOverlay = document.getElementById('countdown-overlay');
        this.countdownNumber = document.getElementById('countdown-number');
        this.difficultySelect = document.getElementById('difficulty-select');
        this.wrapModeToggle = document.getElementById('wrap-mode');
        
        // Buttons
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resumeBtn = document.getElementById('resume-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.shareBtn = document.getElementById('share-btn');
        
        // Modal elements
        this.gameOverModal = document.getElementById('game-over-modal');
        this.modalTitle = document.getElementById('modal-title-text');
        this.modalDescription = document.getElementById('modal-description');
        this.finalScore = document.getElementById('final-score');
        this.scoreRating = document.getElementById('score-rating');
        this.highScoreText = document.getElementById('high-score-text');
        this.modalHighScore = document.getElementById('modal-high-score');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.modalShareBtn = document.getElementById('modal-share-btn');
        
        // Mobile controls
        this.mobileControls = document.getElementById('mobile-controls');
        this.dpadButtons = document.querySelectorAll('.dpad-btn');
        this.swipeArea = document.getElementById('swipe-area');
        
        // Touch handling
        this.touchStart = { x: 0, y: 0 };
        this.touchEnd = { x: 0, y: 0 };
        
        // Initialize game
        this.init();
    }
    
    init() {
        this.loadHighScore();
        this.setupCanvas();
        this.setupEventListeners();
        this.checkMobileDevice();
        this.updateUI();
        this.initializeGame();
        this.render();
    }
    
    setupCanvas() {
        // Set canvas size based on screen size
        this.updateCanvasSize();
        window.addEventListener('resize', () => this.updateCanvasSize());
    }
    
    updateCanvasSize() {
        const screenWidth = window.innerWidth;
        
        if (screenWidth <= 640) { // Mobile
            this.BOARD_WIDTH = 15;
            this.BOARD_HEIGHT = 20;
        } else if (screenWidth <= 768) { // Tablet
            this.BOARD_WIDTH = 20;
            this.BOARD_HEIGHT = 25;
        } else { // Desktop
            this.BOARD_WIDTH = 25;
            this.BOARD_HEIGHT = 20;
        }
        
        this.canvas.width = this.BOARD_WIDTH * this.CELL_SIZE;
        this.canvas.height = this.BOARD_HEIGHT * this.CELL_SIZE;
        
        if (this.gameState === 'IDLE') {
            this.initializeGame();
        }
    }
    
    checkMobileDevice() {
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isMobile && window.innerWidth <= 768) {
            this.mobileControls.style.display = 'flex';
        }
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Button controls
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.shareBtn.addEventListener('click', () => this.shareScore());
        
        // Settings
        this.difficultySelect.addEventListener('change', (e) => this.changeDifficulty(e.target.value));
        this.wrapModeToggle.addEventListener('change', (e) => this.wrapMode = e.target.checked);
        
        // Modal controls
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.modalShareBtn.addEventListener('click', () => this.shareScore());
        this.gameOverModal.addEventListener('click', (e) => {
            if (e.target === this.gameOverModal) {
                this.closeModal();
            }
        });
        
        // Mobile controls
        this.dpadButtons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = btn.getAttribute('data-direction');
                this.changeDirection(direction);
            });
        });
        
        // Swipe controls
        this.swipeArea.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.swipeArea.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.swipeArea.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    
    handleKeyPress(e) {
        if (this.gameState === 'PLAYING') {
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    e.preventDefault();
                    this.changeDirection('UP');
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    e.preventDefault();
                    this.changeDirection('DOWN');
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    e.preventDefault();
                    this.changeDirection('LEFT');
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    e.preventDefault();
                    this.changeDirection('RIGHT');
                    break;
                case 'Space':
                    e.preventDefault();
                    this.pauseGame();
                    break;
            }
        } else {
            // Global shortcuts
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'IDLE') {
                    this.startGame();
                } else if (this.gameState === 'PAUSED') {
                    this.resumeGame();
                } else if (this.gameState === 'GAME_OVER') {
                    this.restartGame();
                }
            }
        }
    }
    
    handleTouchStart(e) {
        if (this.gameState !== 'PLAYING') return;
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStart.x = touch.clientX;
        this.touchStart.y = touch.clientY;
    }
    
    handleTouchMove(e) {
        if (this.gameState !== 'PLAYING') return;
        e.preventDefault();
        const touch = e.touches[0];
        this.touchEnd.x = touch.clientX;
        this.touchEnd.y = touch.clientY;
        
        const deltaX = this.touchEnd.x - this.touchStart.x;
        const deltaY = this.touchEnd.y - this.touchStart.y;
        const threshold = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > threshold) {
                this.changeDirection(deltaX > 0 ? 'RIGHT' : 'LEFT');
                this.touchStart.x = this.touchEnd.x;
                this.touchStart.y = this.touchEnd.y;
            }
        } else {
            if (Math.abs(deltaY) > threshold) {
                this.changeDirection(deltaY > 0 ? 'DOWN' : 'UP');
                this.touchStart.x = this.touchEnd.x;
                this.touchStart.y = this.touchEnd.y;
            }
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
    }
    
    initializeGame() {
        // Create initial snake
        this.snake = [];
        for (let i = 0; i < this.INITIAL_SNAKE_LENGTH; i++) {
            this.snake.push({
                x: this.INITIAL_SNAKE_LENGTH - i - 1,
                y: Math.floor(this.BOARD_HEIGHT / 2)
            });
        }
        
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        this.score = 0;
        this.generateFood();
        this.updateUI();
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.BOARD_WIDTH),
                y: Math.floor(Math.random() * this.BOARD_HEIGHT)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        this.food = newFood;
    }
    
    startGame() {
        this.initializeGame();
        this.setDifficultySpeed();
        this.startCountdown();
    }
    
    startCountdown() {
        this.gameState = 'COUNTDOWN';
        this.countdownValue = 3;
        this.updateUI();
        this.showCountdown();
        
        this.countdownTimer = setInterval(() => {
            this.countdownValue--;
            if (this.countdownValue <= 0) {
                clearInterval(this.countdownTimer);
                this.hideCountdown();
                this.gameState = 'PLAYING';
                this.updateUI();
                this.startGameLoop();
            } else {
                this.updateCountdown();
            }
        }, 1000);
    }
    
    pauseGame() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
            this.stopGameLoop();
            this.updateUI();
        }
    }
    
    resumeGame() {
        if (this.gameState === 'PAUSED') {
            this.gameState = 'PLAYING';
            this.updateUI();
            this.startGameLoop();
        }
    }
    
    restartGame() {
        this.gameState = 'IDLE';
        this.stopGameLoop();
        this.hideCountdown();
        this.closeModal();
        this.setDifficultySpeed();
        this.initializeGame();
        this.updateUI();
    }
    
    gameOver() {
        this.gameState = 'GAME_OVER';
        this.stopGameLoop();
        this.updateHighScore();
        this.updateUI();
        this.showGameOverModal();
    }
    
    startGameLoop() {
        this.stopGameLoop();
        this.gameLoop = setInterval(() => {
            this.update();
            this.render();
        }, this.speed);
    }
    
    stopGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }
    
    update() {
        if (this.gameState !== 'PLAYING') return;
        
        // Update direction
        this.direction = this.nextDirection;
        
        // Move snake
        const head = { ...this.snake[0] };
        
        switch (this.direction) {
            case 'UP':
                head.y -= 1;
                break;
            case 'DOWN':
                head.y += 1;
                break;
            case 'LEFT':
                head.x -= 1;
                break;
            case 'RIGHT':
                head.x += 1;
                break;
        }
        
        // Handle wrap mode
        if (this.wrapMode) {
            head.x = (head.x + this.BOARD_WIDTH) % this.BOARD_WIDTH;
            head.y = (head.y + this.BOARD_HEIGHT) % this.BOARD_HEIGHT;
        } else {
            // Check wall collision
            if (head.x < 0 || head.x >= this.BOARD_WIDTH || head.y < 0 || head.y >= this.BOARD_HEIGHT) {
                this.gameOver();
                return;
            }
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.showToast('🍎 +10 points!', 'success');
            
            // Increase speed every 50 points
            if (this.score % 50 === 0 && this.speed > 50) {
                this.speed = Math.max(this.speed - 10, 50);
                this.showToast(`⚡ Speed increased!`, 'info');
            }
            
            this.generateFood();
        } else {
            this.snake.pop();
        }
        
        this.updateUI();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--game-board').trim();
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--game-grid').trim();
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.CELL_SIZE, 0);
            this.ctx.lineTo(x * this.CELL_SIZE, this.BOARD_HEIGHT * this.CELL_SIZE);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.CELL_SIZE);
            this.ctx.lineTo(this.BOARD_WIDTH * this.CELL_SIZE, y * this.CELL_SIZE);
            this.ctx.stroke();
        }
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            this.ctx.fillStyle = isHead 
                ? getComputedStyle(document.documentElement).getPropertyValue('--snake-head').trim()
                : getComputedStyle(document.documentElement).getPropertyValue('--snake-body').trim();
            
            const x = segment.x * this.CELL_SIZE;
            const y = segment.y * this.CELL_SIZE;
            
            // Draw rounded rectangle
            this.ctx.beginPath();
            this.ctx.roundRect(x + 1, y + 1, this.CELL_SIZE - 2, this.CELL_SIZE - 2, 4);
            this.ctx.fill();
            
            // Add eyes to head
            if (isHead) {
                this.ctx.fillStyle = '#ffffff';
                const eyeSize = 3;
                const eyeOffset = 6;
                this.ctx.beginPath();
                this.ctx.roundRect(x + eyeOffset, y + 5, eyeSize, eyeSize, 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.roundRect(x + this.CELL_SIZE - eyeOffset - eyeSize, y + 5, eyeSize, eyeSize, 2);
                this.ctx.fill();
            }
        });
        
        // Draw food
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--snake-food').trim();
        const foodX = this.food.x * this.CELL_SIZE;
        const foodY = this.food.y * this.CELL_SIZE;
        
        // Draw food with glow effect
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-food').trim();
        this.ctx.beginPath();
        this.ctx.arc(foodX + this.CELL_SIZE / 2, foodY + this.CELL_SIZE / 2, this.CELL_SIZE / 2 - 2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Draw game over overlay
        if (this.gameState === 'GAME_OVER') {
            this.ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    changeDirection(newDirection) {
        if (this.gameState !== 'PLAYING') return;
        
        const opposites = {
            UP: 'DOWN',
            DOWN: 'UP',
            LEFT: 'RIGHT',
            RIGHT: 'LEFT'
        };
        
        if (opposites[newDirection] !== this.direction) {
            this.nextDirection = newDirection;
        }
    }
    
    changeDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.setDifficultySpeed();
    }
    
    setDifficultySpeed() {
        const speeds = {
            EASY: 200,
            MEDIUM: 150,
            HARD: 100
        };
        this.speed = speeds[this.difficulty];
    }
    
    getSpeedLevel() {
        if (this.speed <= 80) return 'TURBO';
        if (this.speed <= 120) return 'FAST';
        if (this.speed <= 160) return 'NORMAL';
        return 'SLOW';
    }
    
    getScoreRating(score) {
        if (score === 0) return { text: 'Try again!', class: 'secondary' };
        if (score < 50) return { text: 'Good start!', class: 'secondary' };
        if (score < 100) return { text: 'Getting better!', class: 'default' };
        if (score < 200) return { text: 'Nice score!', class: 'default' };
        if (score < 300) return { text: 'Great job!', class: 'default' };
        if (score < 500) return { text: 'Excellent!', class: 'default' };
        return { text: 'Snake Master!', class: 'default' };
    }
    
    updateUI() {
        // Update scores
        this.currentScoreEl.textContent = this.score.toLocaleString();
        this.highScoreEl.textContent = this.highScore.toLocaleString();
        
        // Update game status
        const statusText = {
            IDLE: 'Ready',
            PLAYING: 'Playing',
            PAUSED: 'Paused',
            GAME_OVER: 'Game Over',
            COUNTDOWN: 'Starting...'
        };
        this.gameStatusEl.textContent = statusText[this.gameState];
        
        // Update speed indicator
        if (this.gameState === 'PLAYING' && this.speed < 200) {
            this.speedIndicatorEl.style.display = 'block';
            this.speedTextEl.textContent = this.getSpeedLevel();
        } else {
            this.speedIndicatorEl.style.display = 'none';
        }
        
        // Update buttons
        this.startBtn.style.display = this.gameState === 'IDLE' ? 'flex' : 'none';
        this.pauseBtn.style.display = this.gameState === 'PLAYING' ? 'flex' : 'none';
        this.resumeBtn.style.display = this.gameState === 'PAUSED' ? 'flex' : 'none';
        this.restartBtn.style.display = ['GAME_OVER', 'PAUSED'].includes(this.gameState) ? 'flex' : 'none';
        this.shareBtn.style.display = this.gameState === 'GAME_OVER' && this.score > 0 ? 'flex' : 'none';
    }
    
    showCountdown() {
        this.countdownOverlay.style.display = 'flex';
        this.updateCountdown();
    }
    
    updateCountdown() {
        this.countdownNumber.textContent = this.countdownValue;
    }
    
    hideCountdown() {
        this.countdownOverlay.style.display = 'none';
    }
    
    showGameOverModal() {
        const isNewRecord = this.score > 0 && this.score >= this.highScore;
        const rating = this.getScoreRating(this.score);
        
        // Update modal content
        if (isNewRecord) {
            this.modalTitle.innerHTML = `
                <svg class="icon trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                    <path d="M4 22h16"></path>
                    <path d="M10 14.66V17c0 .55.47.98.97 1.21C11.85 18.75 12 19.24 12 20"></path>
                    <path d="M14 14.66V17c0 .55-.47.98-.97 1.21C12.15 18.75 12 19.24 12 20"></path>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
                New Record!
            `;
            this.modalDescription.textContent = "Congratulations! You've set a new high score!";
            this.showToast('🏆 New high score!', 'success');
        } else {
            this.modalTitle.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                </svg>
                Game Over
            `;
            this.modalDescription.textContent = "Better luck next time! Keep practicing to improve your score.";
        }
        
        this.finalScore.textContent = this.score.toLocaleString();
        this.scoreRating.textContent = rating.text;
        this.scoreRating.className = `score-rating ${rating.class}`;
        
        if (!isNewRecord && this.highScore > 0) {
            this.highScoreText.style.display = 'block';
            this.modalHighScore.textContent = this.highScore.toLocaleString();
        } else {
            this.highScoreText.style.display = 'none';
        }
        
        this.gameOverModal.style.display = 'flex';
    }
    
    closeModal() {
        this.gameOverModal.style.display = 'none';
    }
    
    playAgain() {
        this.closeModal();
        this.restartGame();
        this.startGame();
    }
    
    shareScore() {
        const text = `🐍 I just scored ${this.score} points in Snake! Can you beat my score?`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Snake Game Score',
                text: text,
                url: window.location.href
            }).catch(() => {
                // Silently handle share cancellation
            });
        } else {
            // Fallback: copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showToast('Score copied to clipboard!', 'success');
                }).catch(() => {
                    this.showToast('Failed to copy score', 'error');
                });
            } else {
                this.showToast('Sharing not supported', 'error');
            }
        }
    }
    
    showSettings() {
        this.showToast('Settings coming soon!', 'info');
    }
    
    loadHighScore() {
        const saved = localStorage.getItem('snakeHighScore');
        if (saved) {
            this.highScore = parseInt(saved, 10);
        }
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});