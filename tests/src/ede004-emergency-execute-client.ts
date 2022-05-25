import {
  Tx,
  Chain,
  Account,
  types,
  ReadOnlyFn,
} from "https://deno.land/x/clarinet@v0.28.1/index.ts";

export enum EDE004EmergencyExecuteErrCode {
  err_unauthorised=3000,
  err_not_executive_team_member=3001,
  err_already_executed=3002,
  err_sunset_height_reached=3003,
  err_sunset_height_in_past=3004
}

export class EDE004EmergencyExecuteClient {
  contractName = "";
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account, contractName: string) {
    this.contractName = contractName;
    this.chain = chain;
    this.deployer = deployer;
  }

  setExecutiveTeamSunsetHeight(height: number, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-executive-team-sunset-height",
      [types.uint(height)], txSender);
  }
  setExecutiveTeamMember(who: string, member: boolean, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-executive-team-member",
      [types.principal(who), types.bool(member)], txSender);
  }
  setSignalsRequired(signals: number, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "set-signals-required",
      [types.uint(signals)], txSender);
  }

  executiveAction(proposal: string, txSender: string): Tx {
    return Tx.contractCall(
      this.contractName,
      "executive-action",
      [types.principal(proposal)], txSender);
  }

  isExecutiveTeamMember(who: string): ReadOnlyFn {
    return this.callReadOnlyFn("is-executive-team-member", [types.principal(who)]);
  }
  hasSignalled(proposal: string, who: string): ReadOnlyFn {
    return this.callReadOnlyFn("has-signalled", [types.principal(proposal), types.principal(who)]);
  }
  getSignalsRequired(): ReadOnlyFn {
    return this.callReadOnlyFn("get-signals-required");
  }
  getSignals(who: string): ReadOnlyFn {
    return this.callReadOnlyFn("get-signals", [types.principal(who)]);
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
