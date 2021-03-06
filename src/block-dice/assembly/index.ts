import { Context, ContractPromiseBatch, logging, RNG, u128 } from "near-sdk-core";
import { AccountID, FEE, GameID, Profile } from "../utils";
import { Game, GameStatus, Player, ClaimedWin, GameReturnData } from "./model";
import { games, players, profiles } from "./storage";

/**
 *
 * @returns @GameID
 * creates a new game and return the game id
 * Needs minimun attached deposit to be 0.2 NEAR as fee
 */
export function createNewGame(): GameID {
  const sender = Context.sender;
  verifyGameFee(Context.attachedDeposit);
  const game = new Game();
  const gameId = game.id;

  //   increments the players count
  game.addNewPlayer();

  logging.log("Game: " + gameId + " created");

  //   sets storage data for new game
  games.push(game);

  addGameToProfile(gameId, sender);
  addToPlayersList(gameId, sender);

  return gameId;
}

/**
 *
 * @param gameId
 * @returns success message
 * Allows other users to join a  game using the gameId
 */

export function joinGame(gameId: GameID): string {
  const sender = Context.sender;
  verifyGameId(gameId);
  verifyGameFee(Context.attachedDeposit);
  for (let index = 0; index < games.length; index++) {
    if (games[index].id == gameId) {
      const game: Game = games[index];
      assert(game.canJoinGame(), "Cannot join, this game have already ended!");

      game.addNewPlayer();
      addGameToProfile(gameId, sender);
      addToPlayersList(gameId, sender);

      games.replace(index, game);
    }
  }

  return `You have joined game:  + ${gameId}`;
}

/**
 *
 * @param gameId
 * @returns an arraay of the value of dice rolled
 */
export function rollDice(gameId: GameID): Array<u32> {
  let roll1: u32;
  let roll2: u32;
  const sender = Context.sender;
  verifyGameId(gameId);

  for (let index = 0; index < games.length; index++) {
    if (games[index].id == gameId) {
      const game: Game = games[index];
      assert(game.canRollInGame(), "This game has ended!");

      if (game.status == GameStatus.Created) {
        const time = Context.blockTimestamp;
        game.status = GameStatus.Active;
        game.started = time;
        game.ended = time + 1800000000000;
        games.replace(index, game);
      }
    }
  }

  const gamePlayers = players.get(gameId) as Player[];

  const dice1 = new RNG<u32>(1, 5);
  const dice2 = new RNG<u32>(1, 5);
  roll1 = dice1.next() + 1;
  roll2 = dice2.next() + 1;

  for (let index = 0; index < gamePlayers.length; index++) {
    if (sender == gamePlayers[index].playerId) {
      const player = gamePlayers[index];
      assert(player.timeRolled <= 0, "You have already rolled");
      player.timeRolled = Context.blockTimestamp;
      player.roll1 = roll1;
      player.roll2 = roll2;

      // assign the mutated player to the game players array
      gamePlayers[index] = player;
      players.set(gameId, gamePlayers);
    }
  }

  return [roll1, roll2];
}

/**
 *
 * @param gameId
 * @returns an array of winners
 * @throws if game has not ended
 */
export function getWinners(gameId: GameID): Array<string> {
  verifyGameId(gameId);
  for (let index = 0; index < games.length; index++) {
    const game: Game = games[index];
    if (game.id == gameId) {
      if (game.status != GameStatus.Completed) {
        if (game.status == GameStatus.Active) {
          assert(game.ended <= Context.blockTimestamp, "Game is active but not ended yet!");
          game.status = GameStatus.Completed;
          games.replace(index, game);
        } else {
          assert(false, "Game is started but not completed");
        }
      }
    }
  }
  const gamePlayers = players.get(gameId) as Player[];
  const winners: string[] = [];
  let maxScore: u32 = 0;

  for (let index = 0; index < gamePlayers.length; index++) {
    const diceCount = gamePlayers[index].sumDiceRoll();
    maxScore = max(diceCount, maxScore);
  }

  for (let index = 0; index < gamePlayers.length; index++) {
    const player = gamePlayers[index];
    const diceCount = gamePlayers[index].sumDiceRoll();
    if (diceCount == maxScore) {
      winners.push(player.playerId);
    }
  }

  return winners;
}

/**
 *
 * @param gameId
 * @returns true if win is  claimed
 * @throws if you are not a winner
 * calls @function getWinners to access winners array
 * calculates the amount each winner gets from the pool
 */

export function claimWinnings(gameId: GameID): bool {
  const sender = Context.sender;
  let pool: u128 = u128.Zero;

  verifyGameId(gameId);
  const winners = getWinners(gameId);
  const gamePlayers = players.get(gameId) as Player[];

  for (let index = 0; index < games.length; index++) {
    if (games[index].id == gameId) {
      pool = games[index].prize;
    }
  }

  assert(winners.includes(sender), "You did not win for this game :(");

  for (let index = 0; index < gamePlayers.length; index++) {
    if (gamePlayers[index].playerId == sender) {
      const player = gamePlayers[index];
      assert(player.claimedWin != ClaimedWin.Claimed, "You have already claimed prize!");
      const prize = u128.div(pool, u128.from(winners.length));

      const transfer_win = ContractPromiseBatch.create(sender);
      transfer_win.transfer(prize);
      player.claimedWin = ClaimedWin.Claimed;
      gamePlayers[index] = player;

      players.set(gameId, gamePlayers);
    }
  }

  return true;
}

/**
 *
 * GETTER Functions
 */

/**
 *
 * @param gameId
 * @returns an array of all games
 */

export function getGameDetails(gameId: GameID): Game[] {
  verifyGameId(gameId);
  let result: Game[] = [];
  //   const gamePlayers = players.get(gameId) as Player[];

  for (let index = 0; index < games.length; index++) {
    if (games[index].id == gameId) {
      result.push(games[index]);
    }
  }

  return result;
}

/**
 *
 * @param gameId
 * @returns an array of players
 */

export function getPlayersDetails(gameId: GameID): Player[] {
  verifyGameId(gameId);

  const getGamePlayers = players.get(gameId) as Player[];

  return getGamePlayers;
}

/**
 *
 * @returns Profile/user profile with array of games
 */
export function getProfileDetails(account: AccountID): Profile {
  const sender = account;

  if (profiles.contains(sender)) {
    return profiles.get(sender) as Profile;
  }
  return [];
}

/**
 *
 * @param page
 * @returns GameReturnData
 * For additional information check
 * @function getGameType
 */

export function getActiveGames(): GameReturnData {
  return getGameType(GameStatus.Active);
}

export function getCompletedGames(): GameReturnData {
  return getGameType(GameStatus.Completed);
}

export function getCreatedGames(): GameReturnData {
  return getGameType(GameStatus.Created);
}

/**
 *
 * HELPER FUNCTIONS FOR MAIN DAPP
 */

/**
 * @param deposit
 * Verify that deposit attached is equal to or greater than the fee
 */
function verifyGameFee(deposit: u128): void {
  assert(deposit >= FEE, "You need to have at least 0.5 NEAR tokens to continue");
}

/**
 * @param gameId
 * updates the game id with
 */

function addGameToProfile(gameId: GameID, sender: AccountID): void {
  let profile: Profile = [];
  if (profiles.contains(sender)) {
    profile = profiles.get(sender) as Profile;
  }

  for (let index = 0; index < profile.length; index++) {
    assert(profile[index] != gameId, "Game id already added to profile");
  }

  profile.push(gameId);

  //   set to storage
  profiles.set(sender, profile);
}

/**
 * @param gameId
 * Adds a new player to a game
 */

/**
 *
 * @param gameId
 * @param playerId
 * adds the playerid passed to the list of players for a game
 */
function addToPlayersList(gameId: GameID, playerId: AccountID): void {
  const player = new Player(gameId, playerId);
  let newPlayers: Player[] = [];
  if (players.contains(gameId)) {
    newPlayers = players.get(gameId) as Player[];
  }

  newPlayers.push(player);

  //   set to storage
  players.set(gameId, newPlayers);
}

/**
 *
 * @param gameId
 * checks if game ID exist
 * panics if game ID does not exist
 */

function verifyGameId(gameId: GameID): void {
  assert(players.contains(gameId), "This game ID does not exist");
}

/**
 *
 * @param _page
 * @param type
 * @returns GameReturnData
 * helper function for returning games based on status
 * used by:
 *@function getActiveGames
 *@function getCompletedGames
 *@function getCreatedGames
 */
export function getGameType(type: GameStatus): GameReturnData {
  const gameType: Game[] = [];

  for (let index = 0; index < games.length; index++) {
    const game: Game = games[index];
    if (game.status == GameStatus.Active) {
      if (Context.blockTimestamp > game.ended) {
        game.status = GameStatus.Completed;
        games.replace(index, game);
      }
    }

    if (game.status == type) {
      gameType.push(game);
    }
  }

  const total: u32 = gameType.length;

  const result = new GameReturnData(gameType, total);

  return result;
}
