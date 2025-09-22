class OmokGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 19; // 19x19 오목판
        this.cellSize = this.canvas.width / this.boardSize;
        this.board = [];
        this.currentPlayer = 1; // 1: 흑돌, 2: 백돌
        this.gameOver = false;
        this.moveHistory = [];
        this.blackScore = 0;
        this.whiteScore = 0;
        
        this.initializeBoard();
        this.drawBoard();
        this.setupEventListeners();
        this.updateUI();
    }
    
    initializeBoard() {
        this.board = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = 0; // 0: 빈 칸, 1: 흑돌, 2: 백돌
            }
        }
    }
    
    drawBoard() {
        // 배경 그리기
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 격자 그리기
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.boardSize; i++) {
            // 세로선
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize + this.cellSize / 2, this.cellSize / 2);
            this.ctx.lineTo(i * this.cellSize + this.cellSize / 2, this.canvas.height - this.cellSize / 2);
            this.ctx.stroke();
            
            // 가로선
            this.ctx.beginPath();
            this.ctx.moveTo(this.cellSize / 2, i * this.cellSize + this.cellSize / 2);
            this.ctx.lineTo(this.canvas.width - this.cellSize / 2, i * this.cellSize + this.cellSize / 2);
            this.ctx.stroke();
        }
        
        // 돌 그리기
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
        
        if (player === 1) { // 흑돌
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fill();
            this.ctx.strokeStyle = '#000';
        } else { // 백돌
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.fill();
            this.ctx.strokeStyle = '#2c3e50';
        }
        
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
    }
    
    handleClick(e) {
        if (this.gameOver) {
            console.log('게임이 끝났습니다.');
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 클릭 좌표를 보드 좌표로 변환
        const col = Math.round((x - this.cellSize / 2) / this.cellSize);
        const row = Math.round((y - this.cellSize / 2) / this.cellSize);
        
        console.log(`클릭 좌표: (${x}, ${y}), 보드 좌표: (${row}, ${col}), 셀 크기: ${this.cellSize}`);
        console.log(`현재 플레이어: ${this.currentPlayer}, 게임 상태: ${this.gameOver}`);
        
        if (this.isValidMove(row, col)) {
            console.log(`유효한 수입니다. 돌을 놓습니다.`);
            this.makeMove(row, col);
        } else {
            console.log(`유효하지 않은 수: (${row}, ${col})`);
            if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
                console.log('보드 범위를 벗어났습니다.');
            } else if (this.board[row][col] !== 0) {
                console.log('이미 돌이 놓여있는 위치입니다.');
            }
            // 시각적 피드백
            this.showClickFeedback(x, y);
        }
    }
    
    isValidMove(row, col) {
        return row >= 0 && row < this.boardSize && 
               col >= 0 && col < this.boardSize && 
               this.board[row][col] === 0;
    }
    
    makeMove(row, col) {
        console.log(`돌을 놓습니다: (${row}, ${col}), 플레이어: ${this.currentPlayer}`);
        this.board[row][col] = this.currentPlayer;
        this.moveHistory.push({row, col, player: this.currentPlayer});
        
        console.log(`보드 상태 업데이트됨. 현재 보드[${row}][${col}] = ${this.board[row][col]}`);
        
        this.drawBoard();
        
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.updateScore();
            this.showMessage(`${this.currentPlayer === 1 ? '흑돌' : '백돌'} 승리!`);
        } else if (this.isBoardFull()) {
            this.gameOver = true;
            this.showMessage('무승부!');
        } else {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updateUI();
        }
    }
    
    checkWin(row, col) {
        const directions = [
            [0, 1],   // 가로
            [1, 0],   // 세로
            [1, 1],   // 대각선 \
            [1, -1]   // 대각선 /
        ];
        
        for (let [dx, dy] of directions) {
            let count = 1;
            
            // 양방향으로 체크
            for (let direction of [1, -1]) {
                let newRow = row + dx * direction;
                let newCol = col + dy * direction;
                
                while (this.isValidPosition(newRow, newCol) && 
                       this.board[newRow][newCol] === this.currentPlayer) {
                    count++;
                    newRow += dx * direction;
                    newCol += dy * direction;
                }
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }
    
    isBoardFull() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    updateScore() {
        if (this.currentPlayer === 1) {
            this.blackScore++;
        } else {
            this.whiteScore++;
        }
        document.getElementById('black-score').textContent = this.blackScore;
        document.getElementById('white-score').textContent = this.whiteScore;
    }
    
    updateUI() {
        const currentPlayerText = this.currentPlayer === 1 ? '흑돌' : '백돌';
        document.getElementById('current-player').textContent = currentPlayerText;
        
        // 현재 플레이어 하이라이트
        const blackPlayer = document.querySelector('.black-player');
        const whitePlayer = document.querySelector('.white-player');
        
        blackPlayer.style.transform = this.currentPlayer === 1 ? 'scale(1.1)' : 'scale(1)';
        whitePlayer.style.transform = this.currentPlayer === 2 ? 'scale(1.1)' : 'scale(1)';
    }
    
    showMessage(message) {
        const messageElement = document.getElementById('gameMessage');
        messageElement.textContent = message;
        
        if (message.includes('승리')) {
            messageElement.className = 'message win';
        } else if (message.includes('무승부')) {
            messageElement.className = 'message draw';
        } else {
            messageElement.className = 'message';
        }
    }
    
    handleMouseMove(e) {
        if (this.gameOver) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 클릭 가능한 위치인지 확인
        const col = Math.round((x - this.cellSize / 2) / this.cellSize);
        const row = Math.round((y - this.cellSize / 2) / this.cellSize);
        
        if (this.isValidMove(row, col)) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    showClickFeedback(x, y) {
        // 클릭 위치에 빨간 원 그리기 (잠시 동안)
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.fill();
        this.ctx.restore();
        
        // 0.5초 후 다시 보드 그리기
        setTimeout(() => {
            this.drawBoard();
        }, 500);
    }
    
    resetGame() {
        this.initializeBoard();
        this.currentPlayer = 1;
        this.gameOver = false;
        this.moveHistory = [];
        this.drawBoard();
        this.updateUI();
        this.showMessage('게임을 시작하세요!');
    }
    
    undoMove() {
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

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    new OmokGame();
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        document.getElementById('resetBtn').click();
    } else if (e.key === 'u' || e.key === 'U') {
        document.getElementById('undoBtn').click();
    }
});
