
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



