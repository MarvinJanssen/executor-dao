# StackerDAO

StackerDAOs is a fork of ExecutorDAO, and models its design in the same modular and flexible way. The core tenets remain the same:

1. Proposals are smart contracts.
2. The core executes, the extensions give form.
3. Ownership control happens via sending context.

## 1. Proposals are smart contracts

Proposals are expressed as smart contracts. These smart contracts implement a specific `proposal-trait` and may be executed by the DAO when certain conditions are met. It makes StackerDAO extremely flexible and powerful.

## 2. The core executes, the extensions give form

StackerDAO initially consists of just one core contract. Its sole purpose is to execute proposals and to keep a list of authorized extensions. There are no other features: no token, no voting, no functions. The DAO is given form by means of so-called extension contracts. Extensions are contracts that can be enabled or disabled by proposals and add specific features to the DAO. They are allowed to assume the "sending context" of the DAO and can thus enact change. Since different groups and organisations have different needs, extensions are rather varied. Some example functionality that can be added to StackerDAO via an extension include:

- The issuance and management of a governance token.
- The ability to submit proposals.
- The ability to vote on proposals.
- The creation and management of a treasury.
- Salary payouts to specific members.
- And more...

Since extensions become part of the DAO, they have privileged access to everything else included in the DAO. The trick that allows for extension interoperability is a common authorization check. *Privileged access is granted when the sending context is equal to that of the DAO or if the contract caller is an enabled DAO extension*. It allows for extensions that depend on other extensions to be designed. They can be disabled and replaced at any time making StackerDAO fully polymorphic.

## 3. Ownership control happens via sending context

StackerDAO follows a single-address ownership model. The core contract is the de facto owner of external ownable contracts. (An ownable contract is to be understood as a contract that stores one privileged principal that may change internal state.) External contracts thus do not need to implement a complicated access model, as any proposal or extension may act upon it. *Any ownable contract, even the ones that were deployed before StackerDAO came into use, can be owned and managed by the DAO*.

## Extensions

The StackerDAO code base comes with several additional extension contracts. The modified extentions are designated by a code that starts with "SDE" followed by an incrementing number of three digits.

### SDE000: Governance Token

Implements a SIP010 governance token with locking capabilities. The DAO has full control over the minting, burning, transferring, and locking.

### SDE001: Proposal Voting

Allows governance token holders to vote on proposals. (Note: *vote*, not *propose*.) One token equals one vote. Tokens used for voting are locked for the duration of the vote. They can then be reclaimed and used again. 

### SDE002: Proposal Submission

Allows governance token holders that own at least 1% of the supply to submit a proposal to be voted on via SDE001. Proposals that are made this way are subject to a delay of at least 144 blocks (~1 day) to 1004 blocks (~7 days) and run for 1440 blocks (~10 days). All these parameters can be changed by a proposal.

### SDE003: Emergency Proposals

Manages a list of emergency team members that have the ability to submit emergency proposals to SDE001. Such proposals are not subject to a start delay and run for only 144 blocks (~1 day). This extension is subject to a sunset period after which it deactivates. The members, parameters, and sunset period can be changed by a proposal.

### SDE004: Emergency Execute

Manages a list of executive team members that have the ability to signal for the immediate execution of a proposal. This extension is subject to a sunset period after which it deactivates. The members, parameters, and sunset period can be changed by a proposal.

### SDE005: Dev Fund

An extension that functions as a development fund. It can hold a governance token balance and manages monthly developer payouts. The developers that receive a payout as well as the amounts can be changed by a proposal.

### SDE006: Membership

An extension that functions to manage the membership of the DAO. This allows you to function as a DAO without the use of a Governance Token.

### SDE007: Membership Proposal Voting

Allows whitelisted members to vote on proposals. (Note: *vote*, not *propose*.) All votes are equal and count as one. 

### SDE008: Membership Proposal Submission

Allows whitelisted members to submit a proposal to be voted on via SDE007. Proposals that are made this way are subject to a delay of at least 144 blocks (~1 day) to 1004 blocks (~7 days) and run for 1440 blocks (~10 days). All these parameters can be changed by a proposal.

## Proposals

StackerDAOs also comes with some example proposals. These are designated by a code that starts with "SDP" followed by an incrementing number of three digits. The numbers do not to coincide with extension numbering.

### SDP000: Bootstrap

An initializing proposal that is meant to be executed when the StackerDAO is first deployed. It initialises boot extensions, sets various parameters on them, and any additional configuration needed via the enabled extensions.

### SDP001: Dev Fund

Enables the 4 send Funds extension, mints an amount of tokens for it equal to 30% of the current supply, and awards an allowance to two principals.

### SDO002: Kill Emergency Execute

Immediately disables SDE004 Emergency Execute if it passes.

### SDE003: Whitelist Escrow NFT

A simple example on how StackerDAO can manage third-party smart contracts.

### SDE004: Send Funds

A simple example on how StackerDAO can send funds on behalf of the DAO.

### SDE005: Disable Emergency Proposal

Disable the ability to propose any emergency proposals.

## Testing

TBD.

```clojure
(contract-call? .executor-dao initialize .sdp000-bootstrap)
```

To propose `sdp004-send-funds`, run the following commands one by one:

```clojure
;; Submit the proposal via extension SDE008, starting
;; the voting process at block-height + 144.
(contract-call? .sde008-proposal-submission propose .sdp004-send-funds (+ block-height u144) .sde006-membership)

;; Advance the chain 144 blocks.
::advance_chain_tip 144

;; Vote YES
(contract-call? .sde007-voting vote true .sdp004-send-funds .sde006-membership)

;; (Optional) take a look at the current proposal data.
(contract-call? .sde007-voting get-proposal-data .sdp004-send-funds)

;; Advance the chain tip until after the proposal concludes.
::advance_chain_tip 1440

;; Conclude the proposal vote, thus executing it.
(contract-call? .sde007-voting conclude .sdp004-send-funds)

;; Check that the sde004-send-funds contract sent
;; the funds to the proper destination set in sdp004-send-funds.
::get_assets_maps
```

## Error space

StackerDAO reserves different uint ranges for the main components.

- `1000-1999`: Executor errors.
- `2000-2999`: Proposal errors.
- `3000-3999`: Extension errors.

# License

MIT license
