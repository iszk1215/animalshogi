const PlayerTop = 0;
const PlayerBottom = 1;


class PieceType {
    static Lion = 0;
    static Chick = 1;

    constructor(id, image, directions) {
        this.id = id;
        this.image = image;
        this.directions = directions;
    }
};

class Piece {
    constructor(type, player) {
        this.type = type;
        this.player = player;
    }
}

const ImageFiles = {
    0: "l.svg",
    1: "c.svg"
}

function getMovableCells(app, cell) {
    // cell should have a piece
    const cells = [];
    cell.piece.type.directions.forEach((direction) => {
        const rev = cell.piece.player == PlayerBottom ? 1 : -1;
        const x = cell.x + direction[0] * rev;
        const y = cell.y + direction[1] * rev;
        if (x >= 0 && x < 3 && y >= 0 && y < 4) {
            cells.push(app.cells[x + y * 3]);
        }
    })

    return cells;
}

function selectPieceOn(app, cell) {
    clearAllCellBorders(app);
    cell.setBorderBlue();
    getMovableCells(app, cell).forEach((c) => {
        if (c.piece == null || c.piece.player != app.currentPlayer)
            c.setBorderGreen();
    })

    app.selectedCell = cell;
}

function isMovable(app, cell) {
    return getMovableCells(app, app.selectedCell).includes(cell);
}

function clearAllCellBorders(app) {
    app.cells.forEach((c) => {
        c.clearBorder();
    })
}

function movePieceTo(app, cell) {
    const piece = app.selectedCell.removePiece()

    if (cell.piece != null) {
        const p = cell.removePiece()
        p.player = app.currentPlayer;
        app.reserves[app.currentPlayer].push(p)
    }

    //console.log(piece);
    cell.setPiece(piece);
    app.selectedCell = null;
    clearAllCellBorders(app);
    app.currentPlayer = app.currentPlayer == PlayerTop ? PlayerBottom : PlayerTop;
}

function onCellClicked(app, cell) {
    if (cell.hasPiece() && cell.piece.player == app.currentPlayer) {
        console.log(cell.piece.player, app.currentPlayer)
        selectPieceOn(app, cell);
    } else if (app.selectedCell && isMovable(app, cell)) {
        console.log(app.currentPlayer)
        // console.log("Move to", cell.x, cell.y);
        movePieceTo(app, cell);
        console.log(app.currentPlayer)
    }
}

class Cell {
    constructor(x, y, onclick) {
        const cell = document.createElement("div")
        // cell.className = "border border-black aspect-square flex items-center justify-center caret-transparent"
        cell.className = "aspect-square flex items-center justify-center caret-transparent"
        this.element = cell;
        this.x = x;
        this.y = y;
        this.borderClassesUnselected = ["border", "border-black"]
        this.currentBorderClasses = []
        this.changeBorder(this.borderClassesUnselected);
        this.piece = null;

        const self = this;
        cell.addEventListener("click", function(e) {
            onclick(self)
        }
        );
    }

    hasPiece() {
        return this.piece != null;
    }

    changeBorder(classNames) {
        this._remove_and_add(this.currentBorderClasses, classNames);
        this.currentBorderClasses = classNames;
    }

    setBorderBlue() {
        this.changeBorder(["border-4", "border-blue-400"])
    }

    setBorderGreen() {
        this.changeBorder(["border-4", "border-green-400"])
    }

    clearBorder() {
        this.changeBorder(this.borderClassesUnselected);
    }

    _remove_and_add(r, a) {
        r.forEach((c) => {
            this.element.classList.remove(c);
        })
        a.forEach((c) => {
            this.element.classList.add(c);
        })
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
        img.src = piece.type.image;
        if (piece.player == PlayerTop) {
            img.className = "rotate-180";
        }
        this.element.appendChild(img);
    }
};

class Bench {
    constructor() {
        const element = document.createElement("div")
        element.className = "w-screen grid grid-cols-6";

        const slots = [];
        for (let i = 0; i < 6; ++i) {
            const cell = document.createElement("div")
            cell.className = "aspect-square"
            element.appendChild(cell)
            slots.push(cell)
        }

        this.num = 0;
        this.element = element;
        this.slots = slots
    }

    append(piece) {
        const img = new Image();
        img.src = piece.type.image;
        if (piece.player == PlayerTop) {
            img.className = "rotate-180";
        }

        this.slots[this.num++].appendChild(img);
    }
}

export function init() {
    const root = document.getElementById("animal")

    const app = {
        cells: new Array(12),
        currentPlayer: PlayerBottom,
        selectedCell: null,
        reserves: [[], []],

        cell: function(x, y) {
            return this.cells[x + y * 3];
        },
    };


    const header = document.createElement("div")
    header.appendChild(document.createTextNode("help"))

    const benchTop = new Bench();
    const benchBottom = new Bench();

    const board = document.createElement("div")
    board.className = "p-2 w-screen grid grid-flow-row grid-flows-4"

    for (var j = 0; j < 4; ++j) {
        const row = document.createElement("div")
        row.className = "grid grid-cols-3"

        for (var i = 0; i < 3; ++i) {
            const cell = new Cell(i, j, (c) => { onCellClicked(app, c); });
            app.cells[j * 3 + i] = cell;
            row.appendChild(cell.element)
        }

        board.appendChild(row)
    }

    const Lion = new PieceType(PieceType.Lion, "l.svg", [[-1, 1], [0, 1], [1, 1],
    [-1, 0], [1, 0],
    [-1, -1], [0, -1], [1, -1]])
    const Chick = new PieceType(PieceType.Chick, "c.svg", [[0, -1]])

    app.cell(1, 0).setPiece(new Piece(Lion, PlayerTop));
    app.cell(1, 1).setPiece(new Piece(Chick, PlayerTop));

    app.cells[2 * 3 + 1].setPiece(new Piece(Chick, PlayerBottom));
    app.cells[3 * 3 + 1].setPiece(new Piece(Lion, PlayerBottom));

    root.appendChild(header)
    root.appendChild(benchTop.element)
    root.appendChild(board)
    root.appendChild(benchBottom.element)
}
