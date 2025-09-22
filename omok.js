class OmokGame {
    constructor() {
        // DOM 요소 가져오기
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.modal = document.getElementById('gameModeModal');
        this.gameContainer = document.getElementById('gameContainer');
        this.backToMenuBtn = document.getElementById('backToMenuBtn');
        
        // 게임 설정
        this.boardSize = 19; // 19x19 오목판
        this.cellSize = this.canvas.width / this.boardSize;
        
        // 게임 상태 변수
        this.board = [];
        this.currentPlayer = 1; // 1: 흑돌, 2: 백돌
        this.gameMode = null; // '1v1' 또는 'ai'
        this.gameOver = false;
        this.isAiThinking = false;
        this.moveHistory = [];
        
        // 점수
        this.blackScore = 0;
        this.whiteScore = 0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 모드 선택 버튼
        document.getElementById('vsPlayerBtn').addEventListener('click', () => this.startGame('1v1'));
        document.getElementById('vsAiBtn').addEventListener('click', () => this.startGame('ai'));

        // 게임 보드 이벤트
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // 게임 컨트롤 버튼
        this.backToMenuBtn.addEventListener('click', () => this.goBackToMenu());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
    }

    startGame(mode) {
        this.gameMode = mode;
        this.modal.style.display = 'none';
        this.gameContainer.style.display = 'block';
        this.resetGame();
    }

    goBackToMenu() {
        this.gameContainer.style.display = 'none';
        this.modal.style.display = 'flex';
        this.gameMode = null;

        // 점수 및 플레이어 이름 초기화
        this.blackScore = 0;
        this.whiteScore = 0;
        document.getElementById('black-score').textContent = '0';
        document.getElementById('white-score').textContent = '0';
        document.querySelector('.white-player .player-name').textContent = '백돌';
    }
    
    initializeBoard() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
    }
    
    drawBoard() {
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.boardSize; i++) {
            const pos = i * this.cellSize + this.cellSize / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, this.cellSize / 2);
            this.ctx.lineTo(pos, this.canvas.height - this.cellSize / 2);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.cellSize / 2, pos);
            this.ctx.lineTo(this.canvas.width - this.cellSize / 2, pos);
            this.ctx.stroke();
        }
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] !== 0) {
                    this.drawStone(i, j, this.board[i][j]);
                }
            }
        }
    }
    
    drawStone(row, col, player) {
        const x = col * this.cellSize + this.cellSize / 2;
        const y = row * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.4;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        const gradient = player === 1 
            ? this.ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius)
            : this.ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);

        if (player === 1) { // 흑돌
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
            this.ctx.fillStyle = gradient;
        } else { // 백돌
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
            this.ctx.fillStyle = gradient;
        }
        
        this.ctx.fill();
    }
    
    handleClick(e) {
        if (this.gameOver || !this.gameMode || this.isAiThinking) {
            return;
        }

        if (this.gameMode === 'ai' && this.currentPlayer === 2) {
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.round((x - this.cellSize / 2) / this.cellSize);
        const row = Math.round((y - this.cellSize / 2) / this.cellSize);
        
        if (this.isValidMove(row, col)) {
            this.makeMove(row, col);
        }
    }
    
    isValidMove(row, col) {
        return row >= 0 && row < this.boardSize && 
               col >= 0 && col < this.boardSize && 
               this.board[row][col] === 0;
    }
    
    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.moveHistory.push({row, col, player: this.currentPlayer});
        
        this.drawBoard();
        this.drawStone(row, col, this.currentPlayer);
        
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.updateScore();
            const winnerName = this.currentPlayer === 1 ? '흑돌' : (this.gameMode === 'ai' ? '컴퓨터' : '백돌');
            this.showMessage(`${winnerName} 승리!`);
        } else if (this.isBoardFull()) {
            this.gameOver = true;
            this.showMessage('무승부!');
        } else {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updateUI();

            if (!this.gameOver && this.gameMode === 'ai' && this.currentPlayer === 2) {
                this.isAiThinking = true;
                this.showMessage('컴퓨터가 생각 중...');
                setTimeout(() => this.makeAiMove(), 1000);
            }
        }
    }

    makeAiMove() {
        const emptyCells = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }

        if (emptyCells.length === 0) return;

        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const { row, col } = emptyCells[randomIndex];
        
        this.makeMove(row, col);
        this.isAiThinking = false;
    }
    
    checkWin(row, col) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (let [dx, dy] of directions) {
            let count = 1;
            for (let dir = -1; dir <= 1; dir += 2) {
                for (let i = 1; i < 5; i++) {
                    const newRow = row + dx * i * dir;
                    const newCol = col + dy * i * dir;
                    if (this.isValidPosition(newRow, newCol) && this.board[newRow][newCol] === this.currentPlayer) {
                        count++;
                    } else {
                        break;
                    }
                }
            }
            if (count >= 5) return true;
        }
        return false;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }
    
    isBoardFull() {
        return this.moveHistory.length === this.boardSize * this.boardSize;
    }
    
    updateScore() {
        if (this.currentPlayer === 1) this.blackScore++;
        else this.whiteScore++;
        document.getElementById('black-score').textContent = this.blackScore;
        document.getElementById('white-score').textContent = this.whiteScore;
    }
    
    updateUI() {
        const player2Name = this.gameMode === 'ai' ? '컴퓨터' : '백돌';
        document.querySelector('.white-player .player-name').textContent = player2Name;
        const currentPlayerText = this.currentPlayer === 1 ? '흑돌' : player2Name;
        document.getElementById('current-player').textContent = currentPlayerText;
        
        const blackPlayer = document.querySelector('.black-player');
        const whitePlayer = document.querySelector('.white-player');
        
        blackPlayer.style.transform = this.currentPlayer === 1 ? 'scale(1.1)' : 'scale(1)';
        whitePlayer.style.transform = this.currentPlayer === 2 ? 'scale(1.1)' : 'scale(1)';
    }
    
    showMessage(message) {
        const msgEl = document.getElementById('gameMessage');
        msgEl.textContent = message;
        msgEl.className = 'message';
        if (message.includes('승리')) msgEl.classList.add('win');
        if (message.includes('무승부')) msgEl.classList.add('draw');
    }
    
    handleMouseMove(e) {
        if (this.gameOver || !this.gameMode || this.isAiThinking) {
            this.canvas.style.cursor = 'default';
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.round((x - this.cellSize / 2) / this.cellSize);
        const row = Math.round((y - this.cellSize / 2) / this.cellSize);
        
        this.canvas.style.cursor = this.isValidMove(row, col) ? 'pointer' : 'default';
    }
    
    resetGame() {
        this.initializeBoard();
        this.currentPlayer = 1;
        this.gameOver = false;
        this.isAiThinking = false;
        this.moveHistory = [];
        this.drawBoard();
        this.updateUI();
        this.showMessage('게임을 시작하세요!');
    }
    
    undoMove() {
        if (this.gameMode === 'ai') {
            this.showMessage('AI 대전에서는 되돌리기를 사용할 수 없습니다.');
            setTimeout(() => this.updateUI(), 2000);
            return;
        }
        if (this.moveHistory.length === 0 || this.gameOver) return;

        const lastMove = this.moveHistory.pop();
        this.board[lastMove.row][lastMove.col] = 0;
        
        this.currentPlayer = lastMove.player;
        this.gameOver = false;
        
        this.drawBoard();
        this.updateUI();
        this.showMessage('한 수 되돌렸습니다.');
    }
}

// DOM이 로드되면 OmokGame 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    new OmokGame();
});
