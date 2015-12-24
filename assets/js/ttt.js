function TicTacToe() {
    // turn is true for X, false for O
    this.turn = true;
    this.moves = 0;
    this.state = new State();

    this.reset = function() {
        this.state.newBoard();
        this.turn = true;
        this.moves = 0;
    }

    this.doMove = function(x, y) {
        if (!this.state.isMarked(x, y)) {

            this.state.mark(x, y, this.turn);
            this.moves++;
            

            if (this.isFull()) {
                Materialize.toast("It is a draw. No winner!", 5000);
                this.reset();
                return null;
            }

            var whoWon = this.state.checkWinner(x, y, this.turn);
            
            if (whoWon != null) {
                if (whoWon) {
                    Materialize.toast("Player X is the winner!", 5000);
                    this.reset();
                    return null;
                } else {
                    Materialize.toast("Player O is the winner!", 5000);
                    this.reset();
                    return null;
                }
            }

            this.turn = !this.turn;

            if (!this.turn) {
                return "X";
            }
            return "O";
        }
    }

    this.isFull = function() {
        return this.moves === 9;
    }


}

function State() {
    this.board = [Array(3), Array(3), Array(3)];

    this.newBoard = function() {
        this.board = [Array(3), Array(3), Array(3)];
    }
    
    this.isMarked = function(x, y) {
        return this.board[x][y] != undefined;
    }

    this.mark = function(x, y, player) {
        // if player is X
        if (player) {
            this.board[x][y] = true;
        // else player must be O
        } else { 
            this.board[x][y] = false;
        }    
    }

    this.checkWinner = function(x, y, lastMove) {
        //console.log("x: " + x + "\ny: " + y + "\nlastMove: " + lastMove);
        for (var i = 0; i < 3; i++) {
            if (this.board[x][i] != lastMove) {
                //console.log("Break caused by col at " + x + "," + i + ": " + this.board[x][i]);
                break;
            }
            if (i == 2) {
                return lastMove;
            }
        }

        for (var i = 0; i < 3; i++) {
            if (this.board[i][y] != lastMove) {
                //console.log("Break caused by row at " + i + "," + y + ": " + this.board[i][y]);
                break;
            }
            if (i == 2) {
                return lastMove;
            }
        }

        if (x === y) {
            for (var i = 0; i < 3; i++) {
                if (this.board[i][i] != lastMove) {
                    //console.log("Break caused by diag at " + i + "," + i + ": " + this.board[i][i]);
                    break;
                }
                if (i === 2) {
                    return lastMove;
                }
            }
        }

        for (var i = 0; i < 3; i++) {
            if (this.board[i][2-i] != lastMove) {
                //console.log("Break caused by rev-diag at " + i + "," + (2-i) + ": " + this.board[i][2-i]);
                break;
            }
            if (i === 2) {
                return lastMove;
            }
        }

        return null;
    }
}