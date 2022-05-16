import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";
import { assertEquals, assert } from "https://deno.land/std@0.90.0/testing/asserts.ts";

export enum EDE003EmergencyProposalsErrCode {
}

export class EDE003EmergencyProposalsClient {
  contractName: string = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  emergencyPropose(proposal: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "emergency-propose",
      [types.principal(proposal)], txSender);
  }

  isEmergencyTeamMember(who: string): ReadOnlyFn {
    return this.callReadOnlyFn("is-emergency-team-member", [types.principal(who)]);
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
