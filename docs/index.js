const PlayerTop = 0;
const PlayerBottom = 1;


class PieceType {
    static Lion = 0;
    static Elephant = 1;
    static Giraffe = 2;
    static Chick = 3;
    static Chicken = 4;

    constructor(id, directions) {
        this.id = id;
        this.directions = directions;
    }
};

const Lion = new PieceType(PieceType.Lion,
    [[-1, 1], [0, 1], [1, 1],
    [-1, 0], [1, 0],
    [-1, -1], [0, -1], [1, -1]])
const Elephant = new PieceType(PieceType.Elephant,
    [[-1, -1], [1, -1], [-1, 1], [1, 1]])
const Giraffe = new PieceType(PieceType.Giraffe,
    [[0, -1], [-1, 0], [1, 0], [0, 1]])
const Chick = new PieceType(PieceType.Chick, [[0, -1]])
const Chicken = new PieceType(PieceType.Chicken,
    [[-1, -1], [0, -1], [1, -1],
    [-1, 0], [0, 1], [1, 0]])


class Piece {
    constructor(type, player) {
        this.type = type;
        this.player = player;
    }
}

const ImageFiles = {
    [PieceType.Lion]: "img/lion.png",
    [PieceType.Elephant]: "img/elephant.png",
    [PieceType.Giraffe]: "img/giraffe.png",
    [PieceType.Chick]: "img/chick.png",
    [PieceType.Chicken]: "img/chicken.png"
}


function remove_and_add(element, removeList, addList) {
    removeList.forEach((c) => {
        element.classList.remove(c);
    })
    addList.forEach((c) => {
        element.classList.add(c);
    })
}

// piece is on `pos`
function getDestinations(pos, piece) {
    const [x0, y0] = pos;
    const cells = [];
    piece.type.directions.forEach((direction) => {
        const rev = piece.player == PlayerBottom ? 1 : -1;
        const x = x0 + direction[0] * rev;
        const y = y0 + direction[1] * rev;
        if (x >= 0 && x < 3 && y >= 0 && y < 4) {
            cells.push([x, y])
        }
    })

    return cells;
}

class Game {
    constructor() {
        this.pieces = new Array(12); // array of piece
        this.currentPlayer = PlayerBottom;
        this.reserves = [[], []];
        this.finished = false;

        // Exclusive
        this.selectedCell = null; // [x, y]
        this.selectedBenchPiece = null; // Piece

        this.board = null;

        for (let i = 0; i < 12; ++i) {
            this.pieces[i] = null;
        }
    }

    _getPieceOn(pos) {
        return this.pieces[pos[0] + pos[1] * 3];
    }

    _setPiece(pos, piece) {
        // piece can be null
        this.pieces[pos[0] + pos[1] * 3] = piece;
    }

    _swapPlayer() {
        this.currentPlayer =
            this.currentPlayer == PlayerTop ? PlayerBottom : PlayerTop;
    }

    // piece is on from_
    getMovableCells(from_, piece) {
        return getDestinations(from_, piece).filter((pos) => {
            const p = this._getPieceOn(pos);
            return p == null || p.player != piece.player;
        });
    }

    isMovable(piece, from_, to) {
        return this.getMovableCells(from_, piece).some((pos) => {
            return pos[0] == to[0] && pos[1] == to[1];
        });
    }

    _checkTry() {
        if (this.currentPlayer == PlayerTop) {
            for (let x = 0; x < 3; ++x) {
                const p = this._getPieceOn([x, 0]);
                if (p != null && p.player == PlayerBottom && p.type == Lion)
                    return PlayerBottom;
            }
        } else {
            for (let x = 0; x < 3; ++x) {
                const p = this._getPieceOn([x, 3]);
                if (p != null && p.player == PlayerTop && p.type == Lion)
                    return PlayerTop;
            }
        }
        return null;
    }

    movePieceTo(piece, from_, to) {
        const captured = this._getPieceOn(to);

        this.selectedCell = null;
        this._setPiece(from_, null);
        this._setPiece(to, piece);

        if (captured != null) {
            captured.player = this.currentPlayer;
            if (captured.type == Chicken)
                captured.type = Chick;
            this.reserves[this.currentPlayer].push(captured);
        }

        if (piece.type == Chick &&
            (this.currentPlayer == PlayerTop && to[1] == 3
                || this.currentPlayer == PlayerBottom && to[1] == 0)) {
            // console.log("chick reached at last row");
            piece.type = Chicken;
        }


        this.board.movePieceTo(piece, from_, to, captured);

        if (captured != null && captured.type == Lion) {
            this.finished = true;
            this.board.finish(this.currentPlayer);
            return;
        }

        const winner = this._checkTry();
        if (winner != null) {
            this.finished = true;
            this.board.finish(winner);
            return;
        }

        this._swapPlayer();
        this.board.changePlayer(this.currentPlayer)
    }

    putPieceFromBench(to) {
        const piece = this.selectedBenchPiece;
        console.assert(this.currentPlayer == piece.player)

        const index = this.reserves[this.currentPlayer].findIndex((p) => {
            return p == piece;
        })

        this.reserves[this.currentPlayer].splice(index, 1);
        this._setPiece(to, piece);
        this.selectedBenchPiece = null;
        this._swapPlayer();

        this.board.putPieceFromBench(piece, to);
        this.board.changePlayer(this.currentPlayer)
    }

    selectPieceOn(pos, piece) {
        this.selectedCell = pos;
        this.selectedBenchPiece = null;

        this.board.selectPieceOn(pos, this.getMovableCells(pos, piece));
    }

    selectReserveOn(piece) {
        this.selectedCell = null;
        this.selectedBenchPiece = piece;

        this.board.selectReserveOn();
    }

    setPiece(pos, piece) {
        this._setPiece(pos, piece);
        this.board.setPiece(pos, piece);
    }

    onBenchPieceClicked(piece) {
        if (this.finished || piece.player != this.currentPlayer)
            return;

        this.selectReserveOn(piece);
    }

    onCellClicked(pos) {
        // console.log("Game.onCellClicked:", x, y);
        if (this.finished)
            return;

        const piece = this._getPieceOn(pos);
        if (piece && piece.player == this.currentPlayer) {
            this.selectPieceOn(pos, piece);
        } else if (this.selectedCell != null) {
            const selectedPiece = this._getPieceOn(this.selectedCell);
            if (this.isMovable(selectedPiece, this.selectedCell, pos)) {
                this.movePieceTo(selectedPiece, this.selectedCell, pos);
            }
        } else if (this.selectedBenchPiece != null) {
            this.putPieceFromBench(pos);
        }
    }
}

class Cell {
    constructor(onclick) {
        const cell = document.createElement("div")
        // cell.className = "border border-black aspect-square flex items-center justify-center caret-transparent"
        cell.className = "aspect-square flex items-center justify-center caret-transparent"
        this.element = cell;
        this.borderClassesUnselected = ["outline", "outline-1", "outline-black"]
        this.currentBorderClasses = []
        this.changeBorder(this.borderClassesUnselected);
        this.piece = null;

        cell.addEventListener("click", function(e) {
            onclick();
        });
    }

    hasPiece() {
        return this.piece != null;
    }

    changeBorder(classNames) {
        this._remove_and_add(this.currentBorderClasses, classNames);
        this.currentBorderClasses = classNames;
    }

    setBorderBlue() {
        // this.changeBorder(["outline", "outline-4", "outline-blue-400"])
        this.changeBorder(["outline", "outline-1", "outline-black", "border", "border-8", "border-blue-400"])
    }

    setBorderGreen() {
        // this.changeBorder(["outline", "outline-4", "outline-green-400"])
        // this.changeBorder(["outline", "outline-1", "outline-black", "border", "border-4", "border-green-400"])
        this.changeBorder(["outline", "outline-1", "outline-black", "border", "border-8", "border-green-600"])
    }

    clearBorder() {
        this.changeBorder(this.borderClassesUnselected);
    }

    _remove_and_add(r, a) {
        remove_and_add(this.element, r, a);
    }

    removePiece() {
        const piece = this.piece;
        this.element.innerHTML = ""; // clear current image
        this.piece = null;
        return piece;
    }

    setPiece(piece) {
        this.piece = piece

        const img = new Image();
        //img.className = "p-1";
        img.src = ImageFiles[piece.type.id];
        if (piece.player == PlayerTop) {
            img.classList.add("rotate-180");
        }
        this.element.appendChild(img);
    }
};

class Bench {
    constructor(pieceClickHandler) {
        const element = document.createElement("div")
        element.className = "w-full grid grid-cols-6 gap gap-[1px]";

        const slots = []; // Cell
        for (let i = 0; i < 6; ++i) {
            const cell = new Cell(() => { this._onclick(i); });
            cell.element.classList.add("p-1");
            cell.borderClassesUnselected = []
            cell.clearBorder()
            element.appendChild(cell.element)
            slots.push(cell)
        }

        this.num = 0;
        this.element = element;
        this.slots = slots;
        this.pieceClickHandler = pieceClickHandler;
    }

    _onclick(index) {
        if (index < this.num)
            this.pieceClickHandler(this.slots[index].piece);
    }

    removePiece(piece) {
        const index = this.slots.findIndex((cell) => {
            return cell.piece == piece
        });

        this.slots[index].removePiece();

        for (let i = index + 1; i < this.num; ++i) {
            let removed = this.slots[i].removePiece();
            this.slots[i - 1].setPiece(removed);
        }
        --this.num;

    }

    addPiece(piece) {
        // assert this.num < 6
        this.slots[this.num++].setPiece(piece)
    }
}

class Message {
    constructor() {
        const element = document.createElement("div");
        element.className = "rounded w-full text-center bg-white text-xl";

        this.element = element;
        this.currentBackgroundColor = "bg-white";
        this.currentTextColor = "text-black";
    }

    reverse() {
        this.element.classList.add("rotate-180");
    }

    setText(text) {
        this.element.innerText = text;
    }

    changeBackgroundColor(color) {
        remove_and_add(this.element, [this.currentBackgroundColor], [color])
        this.currentBackgroundColor = color;
    }

    changeTextColor(color) {
        remove_and_add(this.element, [this.currentTextColor], [color])
        this.currentTextColor = color;
    }

    setBold() {
        this.element.classList.add("font-bold");
    }
}

class Board {
    constructor(config, onCellClicked, onBenchPieceSelected) {
        const root = document.createElement("div")
        root.className = "px-2";
        root.classList.add(config.colors.background);

        const messageTop = new Message()
        const messageBottom = new Message()
        messageTop.reverse();

        const board = document.createElement("div")
        board.className = "w-full grid grid-cols-3 gap gap-[1px]"

        const cells = new Array(12);
        for (var y = 0; y < 4; ++y) {
            for (var x = 0; x < 3; ++x) {
                const pos = [x, y];
                const cell = new Cell(() => { onCellClicked(pos); });
                cell.element.classList.add(config.colors.board);
                cells[x + y * 3] = cell;
                board.appendChild(cell.element)
            }
        }

        const benchTop = new Bench(onBenchPieceSelected);
        const benchBottom = new Bench(onBenchPieceSelected);

        root.appendChild(messageTop.element)
        root.appendChild(benchTop.element)
        root.appendChild(board)
        root.appendChild(benchBottom.element)
        root.appendChild(messageBottom.element)

        this.config = config;
        this.benchTop = benchTop;
        this.benchBottom = benchBottom;
        this.messageTop = messageTop;
        this.messageBottom = messageBottom;
        this.element = root;
        this.cells = cells;

        this.cellClickHandler = null;

        this.changePlayer(PlayerBottom)
    }

    _getCell(pos) {
        return this.cells[pos[0] + pos[1] * 3];
    }

    _getBench(player) {
        return player == PlayerTop ? this.benchTop : this.benchBottom;
    }

    _clearAllCellBorders() {
        this.cells.forEach((c) => {
            c.clearBorder();
        })
    }

    _updateMessage(curr, next) {
        const config = this.config.message;

        next.setText(config.text.your_turn);
        next.changeBackgroundColor(config.color.next_bg);
        next.changeTextColor(config.color.next_text);

        curr.setText(config.text.my_turn);
        curr.changeBackgroundColor(config.color.curr_bg);
        curr.changeTextColor(config.color.curr_text);
    }

    changePlayer(player) {
        if (player == PlayerTop) {
            this._updateMessage(this.messageTop, this.messageBottom);
        } else {
            this._updateMessage(this.messageBottom, this.messageTop);
        }
    }

    finish(winner) {
        let messageWinner;
        let messageLoser;
        if (winner == PlayerTop) {
            messageWinner = this.messageTop;
            messageLoser = this.messageBottom;
        } else {
            messageWinner = this.messageBottom;
            messageLoser = this.messageTop;
        }

        let config = this.config.message;

        messageWinner.setText(config.text.win);
        messageWinner.changeBackgroundColor(config.color.winner_bg);
        messageWinner.changeTextColor(config.color.winner_text);
        messageWinner.setBold();
        messageLoser.setText(config.text.lose);
    }

    movePieceTo(piece, from_, to, capturedPiece) {
        const srcCell = this._getCell(from_);
        srcCell.removePiece();

        const dstCell = this._getCell(to);
        if (dstCell.piece != null)
            dstCell.removePiece();

        dstCell.setPiece(piece);
        this._clearAllCellBorders();
        if (capturedPiece != null)
            this._getBench(capturedPiece.player).addPiece(capturedPiece)
    }

    putPieceFromBench(piece, to) {
        this._clearAllCellBorders();
        this._getBench(piece.player).removePiece(piece)
        this._getCell(to).setPiece(piece);
    }

    selectPieceOn(pos, movableCells) {
        this._clearAllCellBorders();
        this._getCell(pos).setBorderBlue();
        movableCells.forEach((p) => {
            this._getCell(p).setBorderGreen();
        })
    }

    // highlight empty cells
    selectReserveOn(piece) {
        this._clearAllCellBorders();
        this.cells.forEach((c) => {
            if (c.piece == null)
                c.setBorderGreen();
        });
    }

    setPiece(pos, piece) {
        this._getCell(pos).setPiece(piece);
    }
}

export function init() {
    const config = {
        colors: {
            background: "bg-lime-400",
            board: "bg-lime-200",
        },
        message: {
            text: {
                my_turn: "じぶんのばん",
                your_turn: "あいてのばん",
                win: "かち",
                lose: "まけ",
            },
            color: {
                curr_text: "text-white",
                next_text: "text-black",
                curr_bg: "bg-blue-400",
                next_bg: "bg-white",
                winner_bg: "bg-pink-300",
                winner_text: "text-red-700",
            },
        }
    };

    const game = new Game();

    const board = new Board(
        config,
        (pos) => { game.onCellClicked(pos); },
        (piece) => { game.onBenchPieceClicked(piece); });

    game.board = board;

    game.setPiece([1, 0], new Piece(Lion, PlayerTop));
    game.setPiece([1, 1], new Piece(Chick, PlayerTop));
    game.setPiece([0, 0], new Piece(Giraffe, PlayerTop));
    game.setPiece([2, 0], new Piece(Elephant, PlayerTop));

    game.setPiece([1, 2], new Piece(Chick, PlayerBottom));
    game.setPiece([1, 3], new Piece(Lion, PlayerBottom));
    game.setPiece([0, 3], new Piece(Elephant, PlayerBottom));
    game.setPiece([2, 3], new Piece(Giraffe, PlayerBottom));

    const root = document.getElementById("animal")
    root.className = "w-full h-full flex items-center";
    root.classList.add(config.colors.background);
    root.appendChild(board.element)
}
