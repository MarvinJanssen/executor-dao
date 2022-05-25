import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";

export enum EDE000GovernanceTokenErrCode {
  err_unauthorised=3000,
  err_not_token_owner=4
}

export class EDE000GovernanceTokenClient {
  contractName = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  transfer(amount: number, sender: string, recipient: string, memo: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "transfer",
      [types.uint(amount), types.principal(sender), types.principal(recipient), (memo && memo.length > 0) ? types.some(types.buff(memo)) : types.none()], txSender);
  }

  getName(): ReadOnlyFn {
    return this.callReadOnlyFn("get-name", []);
  }
  getSymbol(): ReadOnlyFn {
    return this.callReadOnlyFn("get-symbol", []);
  }
  getTokenUri(): ReadOnlyFn {
    return this.callReadOnlyFn("get-token-uri", []);
  }
  getDecimals(): ReadOnlyFn {
    return this.callReadOnlyFn("get-decimals", []);
  }
  getTotalSupply(): ReadOnlyFn {
    return this.callReadOnlyFn("get-total-supply", []);
  }
  getBalance(who: string): ReadOnlyFn {
    return this.callReadOnlyFn("get-balance", [types.principal(who)]);
  }

  setName(value: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-name",
      [types.ascii(value)], txSender);
  }
  setSymbol(value: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-symbol",
      [types.ascii(value)], txSender);
  }
  setTokenUri(value: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-token-uri",
      [types.some(types.utf8(value))], txSender);
  }
  setDecimals(value: number, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-decimals",
      [types.uint(value)], txSender);
  }


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
