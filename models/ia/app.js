const { Console } = require(`./console`);

const console = new Console();

class ClosedInterval {

    #min;
    #max;

    constructor(min, max) {
        this.#min = min;
        this.#max = max;
    }

    isIncluded(value) {
        return this.#min <= value && value <= this.#max;
    }

    toString() {
        return `[${this.min}, ${this.max}]`;
    }

}

class Color {

    static RED = new Color(`Red`);
    static YELLOW = new Color(`Yellow`);
    static NULL = new Color(` `);

    #string;

    constructor(string) {
        this.#string = string;
    }

    static get(ordinal) {
        return Color.#values()[ordinal];
    }

    static #values() {
        return [Color.RED, Color.YELLOW, Color.NULL];
    }

    write() {
        console.write(` ${this.#string[0]} `);
    }

    toString() {
        return this.#string;
    }

    static PLAYERS = [Color.RED, Color.YELLOW];

    getOpposite() {
        return Color.#values()[(this.ordinal() + 1) % Color.PLAYERS.length];
    }

    ordinal() {
        for(let i = 0; i < Color.PLAYERS.length; i++){
            if (this == Color.PLAYERS[i]){
                return i;
            }
        }
        return -1;
    }

    getCode() {
        if (this == Color.NULL) {
            return ' ';
        }
        return this.toString().charAt(0);
    }

}

class Coordinate {

    static ORIGIN = new Coordinate(0, 0);
    static NUMBER_ROWS = 6;
    static #ROWS = new ClosedInterval(0, Coordinate.NUMBER_ROWS - 1);
    static NUMBER_COLUMNS = 7;
    static #COLUMNS = new ClosedInterval(0, Coordinate.NUMBER_COLUMNS - 1);

    #row;
    #column;

    constructor(row, column) {
        this.#row = row;
        this.#column = column;
    }

    shifted(coordinate) {
        return new Coordinate(this.#row + coordinate.#row,
            this.#column + coordinate.#column);
    }

    isValid() {
        return Coordinate.#isRowValid(this.getRow())
            && Coordinate.isColumnValid(this.getColumn());
    }

    static isColumnValid(column) {
        return Coordinate.#COLUMNS.isIncluded(column);
    }

    static #isRowValid(row) {
        return Coordinate.#ROWS.isIncluded(row);
    }

    getRow() {
        return this.#row;
    }

    getColumn() {
        return this.#column;
    }

    equals(coordinate) {
        if (this == coordinate)
            return true;
        if (coordinate == null)
            return false;
        return this.#column === coordinate.#column && this.#row === coordinate.#row;
    }

    toString() {
        return `Coordinate [row= ${this.#row} column= ${this.#column}]`;
    }

}

class Direction {
    static NORTH = new Direction(1, 0);
    static NORTH_EAST = new Direction(1, 1);
    static EAST = new Direction(0, 1);
    static SOUTH_EAST = new Direction(-1, 1);
    static SOUTH = new Direction(-1, 0);
    static SOUTH_WEST = new Direction(-1, -1);
    static WEST = new Direction(0, -1);
    static NORTH_WEST = new Direction(1, -1);

    #coordinate;

    constructor(row, column) {
        this.#coordinate = new Coordinate(row, column);
    }

    getOpposite() {
        for (let direction of Direction.values()) {
            if (direction.#coordinate.shifted(this.#coordinate).equals(Coordinate.ORIGIN)) {
                return direction;
            }
        }
        return null;
    }

    static values() {
        return [Direction.NORTH, Direction.NORTH_EAST, Direction.EAST, Direction.SOUTH_EAST,
        Direction.SOUTH, Direction.SOUTH_WEST, Direction.WEST, Direction.NORTH_WEST];
    }

    getCoordinate() {
        return this.#coordinate;
    }

    next(coordinate) {
		return new Coordinate(
			this.#coordinate.getRow() + coordinate.getRow(),
			this.#coordinate.getColumn() + coordinate.getColumn());
	}

}

class Message {
    static TITLE = new Message(`--- CONNECT 4 ---`);
    static HORIZONTAL_LINE = new Message(`-`);
    static VERTICAL_LINE = new Message(`|`);
    static TURN = new Message(`Turn: `);
    static ENTER_COLUMN_TO_DROP = new Message(`Enter a column to drop a token: `);
    static INVALID_COLUMN = new Message(`Invalid columnn!!! Values [1-7]`);
    static COMPLETED_COLUMN = new Message(`Invalid column!!! It's completed`);
    static PLAYER_WIN = new Message(`#colorS WIN!!! : -)`);
    static PLAYERS_TIED = new Message(`TIED!!!`);
    static RESUME = new Message(`Do you want to continue`);

    #string;

    constructor(string) {
        this.#string = string;
    }

    write() {
        console.write(this.#string);
    }

    writeln() {
        console.writeln(this.#string);
    }

    toString() {
        return this.#string;
    }

}

class Line {

    static LENGTH = 4;
    #origin;
    #coordinates;
    #oppositeDirection;

    constructor(coordinate) {
        this.#origin = coordinate;
    }

    set(direction) {
        this.#coordinates = [this.#origin];
        for (let i = 1; i < Line.LENGTH; i++) {
            this.#coordinates[i] = this.#coordinates[i - 1].shifted(direction.getCoordinate());
        }
        this.#oppositeDirection = direction.getOpposite();
    }

    shift() {
        for (let i = 0; i < Line.LENGTH; i++) {
            this.#coordinates[i] = this.#coordinates[i].shifted(this.#oppositeDirection.getCoordinate());
        }
    }

    getCoordinates() {
        return this.#coordinates;
    }
}

class Board {

    #colors;
    #lastDrop;
    static ROWS = 6;
    static COLUMNS = 7;

    constructor() {
        this.#colors = [];
        for (let i = 0; i < Coordinate.NUMBER_ROWS; i++) {
            this.#colors[i] = [];
        }
        this.reset();
    }

    reset() {
        for (let i = 0; i < Coordinate.NUMBER_ROWS; i++) {
            for (let j = 0; j < Coordinate.NUMBER_COLUMNS; j++) {
                this.#colors[i][j] = Color.NULL;
            }
        }
    }

    dropToken(column, color) {
        this.#lastDrop = new Coordinate(0, column);
        while (!this.isEmpty(this.#lastDrop)) {
            this.#lastDrop = this.#lastDrop.shifted(Direction.NORTH.getCoordinate());
        }
        this.setColor(this.#lastDrop, color);
    }

    setColor(coordinate, color) {
        this.#colors[coordinate.getRow()][coordinate.getColumn()] = color;
    }

    isComplete(column) {
        if (column !== undefined) {
            return !this.isEmpty(new Coordinate(Coordinate.NUMBER_ROWS - 1, column));
        }
        for (let i = 0; i < Coordinate.NUMBER_COLUMNS; i++) {
            if (!this.isComplete(i)) {
                return false;
            }
        }
        return true;
    }

    isFinished() {
        return this.isComplete() || this.isWinner();
    }

    isWinner() {
        if (this.#lastDrop === undefined) {
            return false;
        }
        let line = new Line(this.#lastDrop);
        for (let direction of Direction.values().splice(0, 3)) {
            line.set(direction);
            for (let i = 0; i < Line.LENGTH; i++) {
                if (this.isConnect4(line)) {
                    return true;
                }
                line.shift();
            }
        }
        return false;
    }

    isConnect4(line) {
        let coordinates = line.getCoordinates();
        for (let i = 0; i < Line.LENGTH; i++) {
            if (!coordinates[i].isValid()) {
                return false;
            }
            if (i > 0 && this.getColor(coordinates[i - 1]) != this.getColor(coordinates[i])) {
                return false;
            }
        }
        return true;
    }

    writeln() {
        this.#writeHorizontal();
        for (let i = Coordinate.NUMBER_ROWS - 1; i >= 0; i--) {
            Message.VERTICAL_LINE.write();
            for (let j = 0; j < Coordinate.NUMBER_COLUMNS; j++) {
                this.getColor(new Coordinate(i, j)).write();
                Message.VERTICAL_LINE.write();
            }
            console.writeln();
        }
        this.#writeHorizontal();
    }

    #writeHorizontal() {
        for (let i = 0; i < 4 * Coordinate.NUMBER_COLUMNS; i++) {
            Message.HORIZONTAL_LINE.write();
        }
        Message.HORIZONTAL_LINE.writeln();
    }

    isOccupied(coordinate, color) {
        return this.getColor(coordinate) == color;
    }

    getColor(coordinate) {
        return this.#colors[coordinate.getRow()][coordinate.getColumn()];
    }

    getUncompletedColumns() {
        let uncompletedColumns = [];
        for (let j = 0; j < Board.COLUMNS; j++) {
            if (!this.isComplete(j)) {
                uncompletedColumns.push(j);
            }
        }
        return uncompletedColumns;
    }

    removeTop(column) {
        this.setColor(this.getTop(column), Color.NULL);
    }

    isTop(column, color) {
        if (this.isEmpty(column)) {
            return false;
        }
        return this.getColor(this.getTop(column)) == color;
    }

    getTop(column) {
        let coordinate = new Coordinate(Board.ROWS - 1, column);
        while (this.isEmpty(coordinate)) {
            coordinate = Direction.SOUTH.next(coordinate);
        }
        return coordinate;
    }

    isEmpty(value) {
        if (value != undefined){
            if (typeof value == "number"){
                return this.isEmpty(new Coordinate(0, value));
            } 
            return this.isOccupied(value, Color.NULL);
        }
        for (let i = 0; i < Board.COLUMNS; i++) {
            if (!this.isEmpty(i)) {
                return false;
            }
        }
        return true;
    }

}

class Player {

    color;
    board;

    constructor(color, board) {
        this.color = color;
        this.board = board;
    }

    play() {
        Message.TURN.write();
        console.writeln(this.color.toString());
        let column = this.getColumn();
        this.board.dropToken(column, this.color);
    }

    writeWinner() {
        let message = Message.PLAYER_WIN.toString();
        message = message.replace(`#color`, this.color.toString());
        console.writeln(message);
    }

    isComplete(column) {
        return this.board.isComplete(column);
    }

}

class UserPlayer extends Player {

    getColumn() {
        let column;
        let valid;
        do {
            column = console.readNumber(Message.ENTER_COLUMN_TO_DROP.toString()) - 1;
            valid = Coordinate.isColumnValid(column);
            if (!valid) {
                Message.INVALID_COLUMN.writeln();
            } else {
                valid = !this.isComplete(column);
                if (!valid) {
                    Message.COMPLETED_COLUMN.writeln();
                }
            }
        } while (!valid);
        return column;
    }

}

class RandomPlayer extends Player {

    getColumn() {
        let column;
        do {
            column = Math.floor(Math.random() * Coordinate.NUMBER_COLUMNS);
        } while (this.isComplete(column));
        console.writeln(`Aleatoriamente en la columna: ${column}`);
        return column;
    }
}

class MinMaxPlayer extends Player {

    static #MAX_STEPS = 4;
    static #MAX_COST = 1;
    static #OTHER_COST = 0;
    static #MIN_COST = -1;

    constructor(color, board) {
        super(color, board);
    }

    getColumn() {
        let uncompletedColumns = this.board.getUncompletedColumns();
        let bestColumn = uncompletedColumns[0];
        let maxCost = MinMaxPlayer.#MIN_COST;
        for (let column of uncompletedColumns) {
            this.board.dropToken(column, this.color);
            let minCost = this.#getMinCost(0);
            this.board.removeTop(column);
            if (minCost > maxCost) {
                maxCost = minCost;
                bestColumn = column;
            }
        }
        console.writeln(`Inteligentemente en la columna: ${bestColumn}`);
        return bestColumn;
    }

    #getMinCost(steps) {
        if (this.#isEnd(steps)) {
            return this.#getCost();
        }
        let minCost = MinMaxPlayer.#MAX_COST;
        for (let column of this.board.getUncompletedColumns()) {
            this.board.dropToken(column, this.color.getOpposite());
            let maxCost = this.#getMaxCost(steps + 1);
            this.board.removeTop(column);
            if (maxCost < minCost)
                minCost = maxCost;
        }
        return minCost;
    }

    #getMaxCost(steps) {
        if (this.#isEnd(steps)) {
            return this.#getCost();
        }
        let maxCost = MinMaxPlayer.#MIN_COST;
        for (let column of this.board.getUncompletedColumns()) {
            this.board.dropToken(column, this.color);
            let cost = this.#getMinCost(steps + 1);
            this.board.removeTop(column);
            if (cost > maxCost)
                maxCost = cost;
        }
        return maxCost;
    }

    #isEnd(steps) {
        return steps == MinMaxPlayer.#MAX_STEPS || this.board.isFinished();
    }

    #getCost() {
        if (this.board.isWinner(this.color)) {
            return MinMaxPlayer.#MAX_COST;
        }
        if (this.board.isWinner(this.color.getOpposite())) {
            return MinMaxPlayer.#MIN_COST;
        }
        return MinMaxPlayer.#OTHER_COST;
    }

}

class Turn {

    static #NUMBER_PLAYERS = 2;
    #players;
    #activePlayer;
    #board;

    constructor(board) {
        this.#board = board;
        this.#players = [];
        this.reset();
    }

    reset() {
        this.#players[0] = new RandomPlayer(Color.get(0), this.#board);
        this.#players[1] = new MinMaxPlayer(Color.get(1), this.#board);
        this.#activePlayer = 0;
    }

    play() {
        this.#players[this.#activePlayer].play();
        if (!this.#board.isFinished()) {
            this.#activePlayer = (this.#activePlayer + 1) % Turn.#NUMBER_PLAYERS;
        }
    }

    writeResult() {
        if (this.#board.isWinner()) {
            this.#players[this.#activePlayer].writeWinner();
        } else {
            Message.PLAYERS_TIED.writeln();
        }
    }
}

class YesNoDialog {

    static #AFFIRMATIVE = `y`;
    static #NEGATIVE = `n`;
    static #SUFFIX = `? (` +
        YesNoDialog.#AFFIRMATIVE + `/` +
        YesNoDialog.#NEGATIVE + `): `;
    static #MESSAGE = `The value must be ${YesNoDialog.#AFFIRMATIVE} or ${YesNoDialog.#NEGATIVE}`;
    #answer;

    read(message) {
        let ok;
        do {
            console.write(message);
            this.#answer = console.readString(YesNoDialog.#SUFFIX);
            ok = this.isAffirmative() || this.isNegative();
            if (!ok) {
                console.writeln(YesNoDialog.#MESSAGE);
            }
        } while (!ok);
    }

    isAffirmative() {
        return this.getAnswer() === YesNoDialog.#AFFIRMATIVE;
    }

    isNegative() {
        return this.getAnswer() === YesNoDialog.#NEGATIVE;
    }

    getAnswer() {
        return this.#answer.toLowerCase()[0];
    }
}

class Connect4 {

    #board;
    #turn;

    constructor() {
        this.#board = new Board();
        this.#turn = new Turn(this.#board);
    }

    playGames() {
        do {
            this.playGame();
        } while (this.isResumed());
    }

    playGame() {
        Message.TITLE.writeln();
        this.#board.writeln();
        do {
            this.#turn.play();
            this.#board.writeln();
        } while (!this.#board.isFinished());
        this.#turn.writeResult();
    }

    isResumed() {
        let yesNoDialog = new YesNoDialog();
        yesNoDialog.read(Message.RESUME.toString());
        if (yesNoDialog.isAffirmative()) {
            this.#board.reset();
            this.#turn.reset();
        }
        return yesNoDialog.isAffirmative();
    }

}

new Connect4().playGames();
