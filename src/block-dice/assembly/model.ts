import { context, RNG, u128 } from "near-sdk-as";
import { AccountID, FEE, GameID, Timestamp } from "../utils";
import { players } from "./storage";

export enum GameStatus {
  Created = 0,
  Active,
  Completed,
}

export enum WinStatus {
  No = 0,
  Won,
  Claimes,
}

@nearBindgen
export class Game {
  id: GameID;
  players: u32;
  prize: u128;
  started: Timestamp;
  ended: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  status: GameStatus;
  pool: u128;

  constructor() {
    this.createdBy = context.sender;
    this.players = 0;
    this.createdAt = context.blockTimestamp;
    this.status = GameStatus.Created;
    this.id = this.generateGameId();
  }

  //   Static method
  static getGameRules(): string {
    return `You need to create or join a game with a 0.02 NEAR fee \n
    A game starts when the first player rolls \n
    Each game lasts 30 minutes`;
  }

  addNewPlayer() {
    this.players += 1;
    this.prize = u128.add(this.prize, FEE);
  }

  /**
   * Generates a new id and checks if ID already exists
   * if ID exists a new ID will be generated by calling the function again
   * @returns Game ID
   */
  private generateGameId(): GameID {
    const roll = new RNG<u32>(1, u32.MAX_VALUE);
    const id = "BD-" + roll.next().toString();
    if (players.contains(id)) {
      this.generateGameId();
    }

    return id;
  }
}

@nearBindgen
export class Player {
  playerId: AccountID;
  roll1: u32;
  roll2: u32;
  timeJoined: Timestamp;
  timeRolled: Timestamp;
  winStatus: WinStatus;
  constructor(public gameId: GameID) {
    this.timeJoined = context.blockTimestamp;
    this.playerId = context.sender;
    this.winStatus = WinStatus.No;
  }

  sumDiceRoll(): u32 {
    return this.roll1 + this.roll2;
  }
}
