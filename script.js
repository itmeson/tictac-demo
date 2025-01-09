document.addEventListener("DOMContentLoaded", () => {
  const boardElement = document.getElementById("board-container");
  const statusElement = document.getElementById("status");
  const playerModeForm = document.getElementById("player-mode-form");
  const startButton = document.getElementById("start-game");

  let board, game;

  // Event handler for starting the game
  startButton.addEventListener("click", () => {
    // Read player modes from the form
    const player1Mode = document.querySelector('input[name="player1-mode"]:checked').value;
    const player2Mode = document.querySelector('input[name="player2-mode"]:checked').value;
    const botDelay = parseFloat(document.getElementById("bot-delay").value) || 0;
    console.log(player1Mode, 'vs', player2Mode);

    // Create agents based on selected modes
    const player1 = createAgent("X", player1Mode);
    const player2 = createAgent("O", player2Mode);

    // Initialize board and game
    board = new Board("html_table", handleMove);
    game = new Game(player1, player2, board, boardElement, statusElement, botDelay);
    window.currentGame = game;
    // Start the game
    game.play();
  });

  // Create an Agent based on the selected mode
  function createAgent(piece, mode) {
    switch (mode) {
      case "human":
        return new Agent(piece, true); // Human agent
      case "beginner":
        return new Agent(piece, false); // Beginner bot
      case "trained":
        return new Menace(piece, "./playbooks/xo_transformed.json"); // Trained bot with playbook
      default:
        throw new Error(`Invalid player mode: ${mode}`);
    }
  }

  // Handle moves from the Board
  const handleMove = (index) => {
    if (game) {
      game.handleMove(index); // Pass the move to the game
    }
  };

});


document.getElementById("show-playbook").addEventListener("click", () => {
  const playbookContainer = document.getElementById("playbook-container");
  const playbookGrid = document.getElementById("playbook-grid");

  // Clear any previous playbook display
  playbookGrid.innerHTML = "";
  playbookContainer.style.display = "block"; // Show the playbook container

  // Get the current game and player
  const game = window.currentGame; // Assuming `currentGame` is globally accessible
  const currentAgent = game.agents[game.currentPlayer];

  if (currentAgent instanceof Menace && currentAgent.playbook) {
      const boardKey = game.board.positions.join("");
      const weights = currentAgent.playbook[boardKey];

      if (weights) {
          // Create a 3x3 grid of weights
          for (let i = 0; i < 3; i++) {
              const row = document.createElement("div");
              row.style.display = "flex";

              for (let j = 0; j < 3; j++) {
                  const index = i * 3 + j;
                  const weight = weights[index] || 0; // Default to 0 if no weight exists

                  const cell = document.createElement("div");
                  cell.textContent = weight;
                  cell.style.width = "50px";
                  cell.style.height = "50px";
                  cell.style.textAlign = "center";
                  cell.style.border = "1px solid black";

                  row.appendChild(cell);
              }

              playbookGrid.appendChild(row);
          }
      } else {
          playbookGrid.innerHTML = "<p>No playbook entry for this board state.</p>";
      }
  } else {
      playbookGrid.innerHTML = "<p>The current player is not a trained bot.</p>";
  }
});
