import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";

export enum EDE005DevFundErrCode {
  err_unauthorised=3000,
  err_no_allowance=3001,
  err_already_claimed=3002
}

export class EDE005DevFundClient {
  contractName = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  setAllowanceStartHeight(height: number, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-allowance-start-height",
      [types.uint(height)], txSender);
  }
  setDeveloperAllowance(allowance: number, who: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-developer-allowance",
      [types.uint(allowance), types.principal(who)], txSender);
  }
  setDeveloperAllowances(
    developers: Array<{ startHeight: number; allowance: number; who: string }>,
    sender: string
  ): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-developer-allowances",
      [
        types.list(
          developers.map((entry) =>
            types.tuple({ recipient: types.principal(entry.who), allowance: types.uint(entry.allowance), startHeight: types.uint(entry.startHeight) })
          )
        )
      ], sender);
  }
  transfer(amount: number, recipient: string, memo: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "transfer",
      [types.uint(amount), types.principal(recipient), (memo && memo.length > 0) ? types.some(types.buff(memo)) : types.none()], txSender);
  }
  claim(memo: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "claim",
      [(memo && memo.length > 0) ? types.some(types.buff(memo)) : types.none()], txSender);
  }
  /**
  getMaxClaims(): ReadOnlyFn {
    return this.callReadOnlyFn("get-max-claims", []);
  }
  getAllowanceStartHeight(): ReadOnlyFn {
    return this.callReadOnlyFn("get-allowance-start-height", []);
  }
  **/
  getDeveloperAllowance(who: string): ReadOnlyFn {
    return this.callReadOnlyFn("get-developer-allowance", [types.principal(who)]);
  }
  getDeveloperClaimCount(who: string): ReadOnlyFn {
    return this.callReadOnlyFn("get-developer-claim-count", [types.principal(who)]);
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
