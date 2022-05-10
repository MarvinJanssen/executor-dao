import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assertEquals, assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";

export enum ProposalErrCode {
}

export class ProposalClient {
  contractName: string = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  // proposal-trait
  execute(sender: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "execute",
      [types.principal(sender)], txSender);
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
