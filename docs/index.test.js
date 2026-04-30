import { describe, it, expect, beforeEach } from "vitest";
import {
  Game,
  Piece,
  Lion,
  Elephant,
  Giraffe,
  Chick,
  Chicken,
  PlayerTop,
  PlayerBottom,
  getDestinations,
  COLS,
  ROWS,
} from "./index.js";

describe("getDestinations", () => {
  it("returns 8 directions for lion", () => {
    const piece = new Piece(Lion, PlayerBottom);
    const dests = getDestinations([1, 2], piece);
    expect(dests).toContainEqual([0, 1]);
    expect(dests).toContainEqual([1, 1]);
    expect(dests).toContainEqual([2, 1]);
    expect(dests).toContainEqual([0, 2]);
    expect(dests).toContainEqual([2, 2]);
    expect(dests).toContainEqual([0, 3]);
    expect(dests).toContainEqual([1, 3]);
    expect(dests).toContainEqual([2, 3]);
    expect(dests.length).toBe(8);
  });

  it("returns 4 diagonal directions for elephant", () => {
    const piece = new Piece(Elephant, PlayerBottom);
    const dests = getDestinations([1, 2], piece);
    expect(dests).toContainEqual([0, 1]);
    expect(dests).toContainEqual([2, 1]);
    expect(dests).toContainEqual([0, 3]);
    expect(dests).toContainEqual([2, 3]);
    expect(dests.length).toBe(4);
  });

  it("returns 4 cross directions for giraffe", () => {
    const piece = new Piece(Giraffe, PlayerBottom);
    const dests = getDestinations([1, 2], piece);
    expect(dests).toContainEqual([1, 1]);
    expect(dests).toContainEqual([0, 2]);
    expect(dests).toContainEqual([2, 2]);
    expect(dests).toContainEqual([1, 3]);
    expect(dests.length).toBe(4);
  });

  it("returns 1 forward direction for chick (PlayerBottom moves toward y=0)", () => {
    const piece = new Piece(Chick, PlayerBottom);
    const dests = getDestinations([1, 2], piece);
    expect(dests).toEqual([[1, 1]]);
    expect(dests.length).toBe(1);
  });

  it("returns 6 directions for chicken", () => {
    const piece = new Piece(Chicken, PlayerBottom);
    const dests = getDestinations([1, 2], piece);
    expect(dests).toContainEqual([0, 1]);
    expect(dests).toContainEqual([1, 1]);
    expect(dests).toContainEqual([2, 1]);
    expect(dests).toContainEqual([0, 2]);
    expect(dests).toContainEqual([1, 3]);
    expect(dests).toContainEqual([2, 2]);
    expect(dests.length).toBe(6);
  });

  it("clips destinations to board boundaries", () => {
    const piece = new Piece(Lion, PlayerBottom);
    const dests = getDestinations([1, 0], piece);
    expect(dests.some(([x, y]) => y < 0)).toBe(false);
    expect(dests.some(([x, y]) => y >= ROWS)).toBe(false);
    expect(dests.some(([x, y]) => x < 0)).toBe(false);
    expect(dests.some(([x, y]) => x >= COLS)).toBe(false);
  });

  it("reverses directions for PlayerTop", () => {
    const chick = new Piece(Chick, PlayerTop);
    const dests = getDestinations([1, 2], chick);
    expect(dests).toEqual([[1, 3]]);
  });
});

describe("Game initial state", () => {
  let game;

  beforeEach(() => {
    game = new Game();
  });

  it("starts with empty board", () => {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        expect(game._getPieceOn([x, y])).toBeNull();
      }
    }
  });

  it("starts with PlayerBottom's turn", () => {
    expect(game.currentPlayer).toBe(PlayerBottom);
  });

  it("starts with empty reserves", () => {
    expect(game.reserves[PlayerTop]).toEqual([]);
    expect(game.reserves[PlayerBottom]).toEqual([]);
  });

  it("starts with game not finished", () => {
    expect(game.finished).toBe(false);
  });
});

describe("Game piece movement", () => {
  let game;

  beforeEach(() => {
    game = new Game();
    game.setPiece([1, 0], new Piece(Lion, PlayerTop));
    game.setPiece([1, 1], new Piece(Chick, PlayerTop));
    game.setPiece([0, 0], new Piece(Giraffe, PlayerTop));
    game.setPiece([2, 0], new Piece(Elephant, PlayerTop));
    game.setPiece([1, 2], new Piece(Chick, PlayerBottom));
    game.setPiece([1, 3], new Piece(Lion, PlayerBottom));
    game.setPiece([0, 3], new Piece(Elephant, PlayerBottom));
    game.setPiece([2, 3], new Piece(Giraffe, PlayerBottom));
  });

  it("returns movable cells excluding own pieces", () => {
    const lion = game._getPieceOn([1, 3]);
    const cells = game.getMovableCells([1, 3], lion);
    expect(cells.some(([x, y]) => x === 0 && y === 3)).toBe(false);
    expect(cells.some(([x, y]) => x === 2 && y === 3)).toBe(false);
  });

  it("returns movable cells including enemy occupied cells", () => {
    const chick = game._getPieceOn([1, 2]);
    const cells = game.getMovableCells([1, 2], chick);
    expect(cells.some(([x, y]) => x === 1 && y === 1)).toBe(true);
  });

  it("switches player after move", () => {
    const chick = game._getPieceOn([1, 2]);
    game.movePieceTo(chick, [1, 2], [1, 1]);
    expect(game.currentPlayer).toBe(PlayerTop);
  });

  it("captures enemy piece and adds to reserves", () => {
    const chick = game._getPieceOn([1, 2]);
    game.movePieceTo(chick, [1, 2], [1, 1]);
    expect(game.reserves[PlayerBottom].length).toBe(1);
    const captured = game.reserves[PlayerBottom][0];
    expect(captured.player).toBe(PlayerBottom);
  });

  it("promotes chick to chicken when reaching last row", () => {
    const chick = new Piece(Chick, PlayerBottom);
    game.setPiece([1, 1], chick);
    game.movePieceTo(chick, [1, 1], [1, 0]);
    expect(chick.type.id).toBe(Chicken.id);
  });

  it("captures lion ends the game", () => {
    const simple = new Game();
    const lion = new Piece(Lion, PlayerTop);
    const giraffe = new Piece(Giraffe, PlayerBottom);
    simple.setPiece([1, 0], lion);
    simple.setPiece([1, 1], giraffe);
    simple.movePieceTo(giraffe, [1, 1], [1, 0]);
    expect(simple.finished).toBe(true);
  });
});

describe("Game try rule", () => {
  it("PlayerBottom wins when lion enters y=0", () => {
    const g = new Game();
    const lion = new Piece(Lion, PlayerBottom);
    g.setPiece([0, 0], new Piece(Elephant, PlayerTop));
    g.setPiece([1, 1], lion);
    g.currentPlayer = PlayerBottom;
    g.movePieceTo(lion, [1, 1], [1, 0]);
    expect(g.finished).toBe(false);
    g.movePieceTo(g._getPieceOn([0, 0]), [0, 0], [1, 1]);
    expect(g.finished).toBe(true);
  });

  it("PlayerTop wins when lion enters y=3", () => {
    const g = new Game();
    const lion = new Piece(Lion, PlayerTop);
    g.setPiece([0, 3], new Piece(Elephant, PlayerBottom));
    g.setPiece([1, 2], lion);
    g.currentPlayer = PlayerTop;
    g.movePieceTo(lion, [1, 2], [1, 3]);
    expect(g.finished).toBe(false);
    g.movePieceTo(g._getPieceOn([0, 3]), [0, 3], [1, 2]);
    expect(g.finished).toBe(true);
  });

  it("Try does not count if lion can be captured on next turn", () => {
    const g = new Game();
    const lion = new Piece(Lion, PlayerBottom);
    const elephant = new Piece(Elephant, PlayerTop);
    g.setPiece([1, 1], lion);
    g.setPiece([0, 1], elephant);
    g.currentPlayer = PlayerBottom;
    g.movePieceTo(lion, [1, 1], [1, 0]);
    expect(g.finished).toBe(false);
    g.movePieceTo(elephant, [0, 1], [1, 0]);
    expect(g.finished).toBe(true);
    expect(g.reserves[PlayerTop].some((p) => p.type.id === Lion.id)).toBe(true);
  });
});

describe("Game bench piece placement", () => {
  let game;

  beforeEach(() => {
    game = new Game();
    game.setPiece([1, 0], new Piece(Lion, PlayerTop));
    game.setPiece([1, 3], new Piece(Lion, PlayerBottom));
    const chick = new Piece(Chick, PlayerBottom);
    game.reserves[PlayerBottom].push(chick);
    game.selectReserveOn(chick);
  });

  it("places bench piece on empty cell", () => {
    game.putPieceFromBench([0, 0]);
    const piece = game._getPieceOn([0, 0]);
    expect(piece).not.toBeNull();
    expect(piece.type.id).toBe(Chick.id);
    expect(piece.player).toBe(PlayerBottom);
  });

  it("switches player after placing bench piece", () => {
    game.putPieceFromBench([0, 0]);
    expect(game.currentPlayer).toBe(PlayerTop);
  });

  it("removes piece from reserves after placement", () => {
    game.putPieceFromBench([0, 0]);
    expect(game.reserves[PlayerBottom].length).toBe(0);
  });

  it("cannot place bench piece on occupied cell", () => {
    game.putPieceFromBench([1, 3]);
    const piece = game._getPieceOn([1, 3]);
    expect(piece.type.id).toBe(Lion.id);
    expect(piece.player).toBe(PlayerBottom);
    expect(game.reserves[PlayerBottom].length).toBe(1);
  });
});

describe("Game finished state", () => {
  let game;

  beforeEach(() => {
    game = new Game();
    game.setPiece([1, 0], new Piece(Lion, PlayerTop));
    game.setPiece([1, 3], new Piece(Lion, PlayerBottom));
  });

  it("cannot move after game is finished", () => {
    game.finished = true;
    game.onCellClicked([1, 3]);
    expect(game.selectedCell).toBeNull();
  });

  it("cannot place bench piece after game is finished", () => {
    game.finished = true;
    const chick = new Piece(Chick, PlayerBottom);
    game.onBenchPieceClicked(chick);
    expect(game.selectedBenchPiece).toBeNull();
  });
});
