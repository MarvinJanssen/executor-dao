import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assertEquals, assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";

export enum ExtensionErrCode {
}

export class ExtensionClient {
  contractName: string = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  // extension-trait
  callback(sender: string, memo: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "callback",
      [types.principal(sender), types.buff(memo)], txSender);
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
