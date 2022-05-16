import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assertEquals, assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";

export enum ExecutorDaoErrCode {
  err_insufficient_balance=1,
  err_unauthorised=1000,
  err_already_executed=1001,
  err_invalid_extension=1002
}

export class ExecutorDaoClient {
  contractName: string = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  // extensions
  isExtension(extension: string): ReadOnlyFn {
    return this.callReadOnlyFn("is-extension", [types.principal(extension)]);
  }
  setExtension(extension: string, enabled: boolean, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-extension",
      [types.principal(extension), types.bool(enabled)], txSender);
  }
  setExtensions(entries: Array<{ extension: string; enabled: boolean }>, sender: string ): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-extensions",
      [
        types.list(
          entries.map((entry) =>
            types.tuple({ extension: types.principal(entry.extension), enabled: types.bool(entry.enabled) })
            )
          )
      ],
      sender
    );
  }
  construct(proposal: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "construct",
      [types.principal(proposal)],
      txSender
    );
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
