import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assertEquals, assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";

export enum EDE000GovernanceTokenErrCode {
}

export class EDE000GovernanceTokenClient {
  contractName: string = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  // governance-token-trait
  edgGetBalance(sender: string, ): ReadOnlyFn {
    return this.callReadOnlyFn("edg-get-balance", [types.principal(sender)]);
  }

  edgGetLocked(sender: string, ): ReadOnlyFn {
    return this.callReadOnlyFn("edg-get-locked", [types.principal(sender)]);
  }

  edgHasPercentageBalance(who: string, factor: number): ReadOnlyFn {
    return this.callReadOnlyFn("edg-has-percentage-balance", [types.principal(who), types.uint(factor)]);
  }

  edgTransfer(amount: number, sender: string, recipient: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "edg-transfer",
      [types.uint(amount), types.principal(sender), types.principal(recipient)], txSender);
  }

  edgLock(amount: number, owner: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "edg-lock",
      [types.uint(amount), types.principal(owner)], txSender);
  }

  edgUnlock(amount: number, owner: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "edg-unlock",
      [types.uint(amount), types.principal(owner)], txSender);
  }

  edgMint(amount: number, recipient: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "edg-mint",
      [types.uint(amount), types.principal(recipient)], txSender);
  }

  edgBurn(amount: number, owner: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "edg-burn",
      [types.uint(amount), types.principal(owner)], txSender);
  }

  private callReadOnlyFn(
    method: string,
    args: Array<any> = [],
    sender: Account = this.deployer
  ): ReadOnlyFn {
    const result = this.chain.callReadOnlyFn(
      this.contractName,
      method,
      args,
      sender?.address
    );

    return result;
  }
}
