import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assertEquals, assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";

export enum EDE004EmergencyExecuteErrCode {
}

export class EDE004EmergencyExecuteClient {
  contractName: string = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  isExecutiveTeamMember(who: string): ReadOnlyFn {
    return this.callReadOnlyFn("is-executive-team-member", [types.principal(who)]);
  }

  getSignalsRequired(): ReadOnlyFn {
    return this.callReadOnlyFn("get-signals-required");
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
