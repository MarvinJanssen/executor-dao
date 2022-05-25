import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";

export enum NftErrorCode {
  err_owner_only=100,
  err_token_id_failure=101,
  err_not_token_owner=102
}

export class NftClient {
  contractName = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  transfer(tokenId: number, sender: string, recipient: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "transfer",
      [types.uint(tokenId), types.principal(sender), types.principal(recipient)], txSender);
  }
  mint(recipient: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "mint",
      [types.principal(recipient)], txSender);
  }
  getOwner(tokenId: number): ReadOnlyFn {
    return this.callReadOnlyFn("get-owner", [types.uint(tokenId)]);
  }

  private callReadOnlyFn(
    method: string,
    // deno-lint-ignore no-explicit-any
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
