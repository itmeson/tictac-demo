class Agent {
    constructor(piece, isHuman = false) {
      this.piece = piece;
      this.isHuman = isHuman;
      this.moveCallback = null;
      console.log("made a human", this.isHuman)
    }
  
    async move(board) {
        if (this.isHuman) {
          console.log(`Agent (${this.piece}) human move initiated, waiting for move...`)
            return new Promise((resolve) => {
                this.moveCallback = resolve;
            });
            } else {
            return this.randomMove(board);
            }
        }
  
    randomMove(board) {
      console.log('making a random move')
      const available = board.map((cell, idx) => (cell === "-" ? idx : null)).filter(idx => idx !== null);
      return available[Math.floor(Math.random() * available.length)];
    }
  }
  
class Menace extends Agent {
  constructor(piece, playbookFile = null) {
    super(piece, false);
    this.playbook = null; // Initialize the playbook as null
    this.playbookLoaded = false;
    console.log("Menace playbook path:", playbookFile);
    if (playbookFile) {
        this.loadPlaybook(playbookFile);
    }
  }

  async loadPlaybook(playbookFile) {
    try {
        const response = await fetch(playbookFile);
        this.playbook = await response.json();
        this.playbookLoaded = true; // Mark playbook as loaded
        console.log("Menace playbook loaded:", this.playbook);
    } catch (error) {
        console.error("Error loading Menace playbook:", error);
    }
  }

  async move(board) {
    if (!this.playbookLoaded) {
        console.warn("Playbook not loaded yet, waiting...");
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.playbookLoaded) {
                    clearInterval(interval);
                    resolve();
                }
            }, 10); // Check every 10ms
        });
    }
      const key = board.join('');
      //console.log(key, this.playbook[key])
      if (!this.playbook[key]) {
        console.log(`${key} note found, making random move`)
      return this.randomMove(board);
      }
      console.log('using playbook', key, this.playbook[key])
      const moves = Object.keys(this.playbook[key]);
      const weights = Object.values(this.playbook[key]);
      return this.weightedRandomChoice(moves, weights);
  }

  weightedRandomChoice(moves, weights) {
      const sum = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * sum;
      for (let i = 0; i < moves.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
          return parseInt(moves[i], 10);
      }
      }
  }
}
  
class Game {
constructor(agentX, agentO, board, boardElement, statusElement, botDelay=0) {
    this.board = board; // Use the Board instance as the state manager
    this.agents = { X: agentX, O: agentO };
    this.currentPlayer = "X";
    this.boardElement = boardElement;
    this.statusElement = statusElement;
    this.winner = null;
    this.botDelay = botDelay * 1000;
}

async play() {
    this.board.display(); // Initial board rendering
  
    while (!this.isGameOver()) {
      console.log(`current player: ${this.currentPlayer}`);
      const currentAgent = this.agents[this.currentPlayer];
  
      if (!currentAgent.isHuman) {
          console.log(`Bot (${this.currentPlayer}) is making a move...`);
          const move = await this.triggerBotMove(currentAgent);
          await this.handleMove(move); // Process the move sequentially
      } else {
        // Wait for the human player's move (handled via click events)
        console.log(`this is a human, Waiting for human (${this.currentPlayer}) move...`);

            // Reset the updateCallback for the board
            this.board.updateCallback = (index) => {
              console.log(`Updating callback for human move: index=${index}`);
              currentAgent.moveCallback(index); // Resolve the human agent's move
          };
          // Call the Agent.move method for human players
          const move = await currentAgent.move(this.board.positions);
          console.log(`Human chose move: ${move}`);
          await this.handleMove(move); // Process the move sequentially
      }
    }
  
    // Declare the game result
    this.statusElement.textContent = this.winner
      ? `Player ${this.winner} wins!`
      : "It's a tie!";
    this.endGame(); // Disable further interactions
  }
  

  async handleMove(index) {
    console.log(`handling move for index: ${index}, state: ${this.board.positions[index]}, player: ${this.currentPlayer}`);
    if (this.board.positions[index] === "-") {
      this.board.positions[index] = this.currentPlayer; // Update board state
      this.board.display(); // Re-render the board
  
      if (this.isGameOver()) {
        this.statusElement.textContent = this.winner
          ? `Player ${this.winner} wins!`
          : "It's a tie!";
        this.endGame(); // Stop further interactions
        return;
      }
  
      // Switch to the next player
      this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
      this.statusElement.textContent = `Player ${this.currentPlayer}'s turn`;

         // Resolve the updateCallback if it's a human's move
      if (this.board.updateCallback) {
        console.log("Resolving board update callback")
        const callback = this.board.updateCallback; // Temporarily store the callback
        this.board.updateCallback = null; // Clear the callback to prevent multiple resolutions
        callback(); // Resolve the waiting Promise (or is it callback(index)?)
      } 
  
      // If the next player is a bot, trigger its move
      const currentAgent = this.agents[this.currentPlayer];
      if (!currentAgent.isHuman) {
        this.triggerBotMove(currentAgent);
      }

      //if (this.board.updateCallback) {
       // this.board.updateCallback(index); // Notify the game loop
      //}

      // If the next player is a bot, trigger their move
      //const currentAgent = this.agents[this.currentPlayer];
      //if (!currentAgent.isHuman) {
      //  await this.triggerBotMove(currentAgent);
      //}
    }
  }
  
  async triggerBotMove(agent) {
    console.log("triggering a bot move", this.botDelay, agent.piece, this.board.positions )
    if (this.botDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.botDelay));
    }
    const move = await agent.move(this.board.positions);
    //this.handleMove(move);
    return move;
  }
  

  endGame() {
    const cells = document.querySelectorAll(".board-cell");
    cells.forEach((cell) => {
      cell.style.pointerEvents = "none"; // Disable clicks on all cells
    });
  }
  
  

  isGameOver() {
    const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
    ];

    for (const combo of winningCombinations) {
    const [a, b, c] = combo;
    if (
        this.board.positions[a] !== "-" &&
        this.board.positions[a] === this.board.positions[b] &&
        this.board.positions[a] === this.board.positions[c]
    ) {
        this.winner = this.board.positions[a];
        return true;
    }
    }

    if (this.board.positions.every((cell) => cell !== "-")) {
    return true; // Tie
    }

    return false; // Game not over
}
}
  

class Board {
constructor(mode = "html_table", updateCallback = null) {
    this.positions = Array(9).fill("-"); // Shared board state
    this.mode = mode; // Display mode
    this.updateCallback = updateCallback; // Notify Game of moves
}

display() {
    if (this.mode === "html_table") {
    this.htmlTableDisplay();
    } else if (this.mode === "text_display") {
    this.textDisplay();
    } else if (this.mode === "no_display") {
    // No rendering
    }
}

htmlTableDisplay() {
    const container = document.getElementById("board-container");
    container.innerHTML = ""; // Clear existing board

    const table = document.createElement("table");
    table.className = "board-table";

    let row;
    this.positions.forEach((value, index) => {
    if (index % 3 === 0) {
        row = document.createElement("tr");
        table.appendChild(row);
    }

    const cell = document.createElement("td");
    cell.className = "board-cell";
    cell.textContent = value === "-" ? "" : value;

    if (value === "-") {
        cell.addEventListener("click", () => {
          console.log(`Cell clicked: index=${index}, value=${value}`)
          if (this.updateCallback) {
            console.log("updating callback", index)
              this.updateCallback(index); // Notify Game
          }
              // Resolve the agent's move callback for human players
          if (this.moveCallback) {
            console.log("resolving human move callbaxk with index: ", index)
            const callback = this.moveCallback; // Store the callback temporarily
            this.moveCallback = null; // Prevent duplicate calls
            callback(index); // Resolve the move promise
          }
        });
    }

    row.appendChild(cell);
    });

    container.appendChild(table);
}

textDisplay() {
    console.clear();
    for (let i = 0; i < 3; i++) {
    console.log(this.positions.slice(i * 3, i * 3 + 3).join(" | "));
    }
}
}
  
  
class Experiment {
constructor(agentX, agentO, trials, display = false) {
    this.agentX = agentX;
    this.agentO = agentO;
    this.trials = trials;
    this.display = display;
}

runExperiment(callback) {
    for (let i = 0; i < this.trials; i++) {
    const game = new Game(this.agentX, this.agentO);
    const result = game.play();
    if (this.display) {
        callback(`Game ${i + 1}: ${result}`);
    }
    }
}
}
  