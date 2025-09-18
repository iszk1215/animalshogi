const PlayerTop = 0;
const PlayerBottom = 1;

class Piece {
    constructor(type, player) {
        this.type = type;
        this.player = player;
    }
}

class PieceType {
    constructor(type, image, directions) {
        this.type = type;
        this.image = image;
        this.directions = directions;
    }
};

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
}

function onCellClicked(app, cell) {
    if (cell.hasPiece() && cell.piece.player == app.currentPlayer) {
        selectPieceOn(app, cell);
    } else if (isMovable(app, cell)) {
        // console.log("Move to", cell.x, cell.y);
        movePieceTo(app, cell);
    }
}

class Cell {
    constructor(x, y, onclick) {
        const cell = document.createElement("div")
        cell.className = "border border-black aspect-square flex items-center justify-center caret-transparent"
        this.element = cell;
        this.x = x;
        this.y = y;
        this.borderClassesUnselected = ["border", "border-black"]
        this.currentBorderClasses = []
        this.change_border(this.borderClassesUnselected);
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

    change_border(classNames) {
        this._remove_and_add(this.currentBorderClasses, classNames);
        this.currentBorderClasses = classNames;
    }

    setBorderBlue() {
        this.change_border(["border-4", "border-blue-400"])
    }

    setBorderGreen() {
        this.change_border(["border-4", "border-green-400"])
    }

    clearBorder() {
        this.change_border(this.borderClassesUnselected);
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

export function init() {
    const root = document.getElementById("animal")

    const app = {
        cells: new Array(12),
        currentPlayer: PlayerBottom,
        selectedCell: null,
        reserves: [[], []],
    };


    const header = document.createElement("div")
    header.appendChild(document.createTextNode("help"))
    root.appendChild(header)

    const board = document.createElement("div")
    board.className = "w-screen grid grid-flow-row grid-flows-4"


    for (var j = 0; j < 4; ++j) {
        const row = document.createElement("div")
        row.className = "grid grid-cols-3"

        for (var i = 0; i < 3; ++i) {
            const cell = new Cell(i, j, (c) => { onCellClicked(app, cell); });

            app.cells[j * 3 + i] = cell;

            row.appendChild(cell.element)
        }

        board.appendChild(row)
    }

    const Lion = new PieceType(1, "l.svg", [[-1, -1], [0, -1], [1, -1]])
    const Chick = new PieceType(2, "c.svg", [[0, -1]])

    app.cells[0*3+1].setPiece(new Piece(Lion, PlayerTop));
    app.cells[2*3+1].setPiece(new Piece(Chick, PlayerBottom));
    app.cells[3*3+1].setPiece(new Piece(Lion, PlayerBottom));

    root.appendChild(board)
}
