;; Title: SDE001 Proposal Voting
;; Author: Ryan Waits
;; Depends-On: SDE000
;; Synopsis:
;; This extension is part of the core of ExecutorDAO. It allows governance token
;; holders to vote on and conclude proposals.
;; Description:
;; Once proposals are submitted, they are open for voting after a lead up time
;; passes. Any token holder may vote on an open proposal, where one token equals
;; one vote. Members can vote until the voting period is over. After this period
;; anyone may trigger a conclusion. The proposal will then be executed if the
;; votes in favour exceed the ones against.

(impl-trait .extension-trait.extension-trait)
(use-trait proposal-trait .proposal-trait.proposal-trait)
(use-trait member-trait .member-trait.member-trait)

(define-constant ERR_UNAUTHORIZED (err u3000))
(define-constant err-not-member-contract (err u3001))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u3002))
(define-constant ERR_PROPOSAL_ALREADY_EXISTS (err u3003))
(define-constant ERR_UNKNOWN_PROPOSAL (err u3004))
(define-constant ERR_PROPOSAL_ALREADY_CONCLUDED (err u3005))
(define-constant ERR_PROPOSAL_INACTIVE (err u3006))
(define-constant ERR_PROPOSAL_NOT_CONCLUDED (err u3007))
(define-constant ERR_NO_VOTES_TO_RETURN (err u3008))
(define-constant ERR_END_BLOCK_HEIGHT_NOT_REACHED (err u3009))
(define-constant ERR_DISABLED (err u3010))

(define-data-var member-contract-principal principal .sde006-membership)

(define-map proposals
  principal
  {
    votesFor: uint,
    votesAgainst: uint,
    startBlockHeight: uint,
    endBlockHeight: uint,
    concluded: bool,
    passed: bool,
    proposer: principal
  }
)

(define-map MemberTotalVotes {proposal: principal, voter: principal} uint)

;; --- Authorization check

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

;; Member

(define-public (set-member-contract (member-contract <member-trait>))
  (begin
    (try! (is-dao-or-extension))
    (ok (var-set member-contract-principal (contract-of member-contract)))
  )
)

;; Proposals

(define-public (add-proposal (proposal <proposal-trait>) (data {startBlockHeight: uint, endBlockHeight: uint, proposer: principal}))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (is-none (contract-call? .executor-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    (print {event: "propose", proposal: proposal, proposer: tx-sender})
    (ok (asserts! (map-insert proposals (contract-of proposal) (merge {votesFor: u0, votesAgainst: u0, concluded: false, passed: false} data)) ERR_PROPOSAL_ALREADY_EXISTS))
  )
)

;; --- Public functions

(define-read-only (get-member-contract)
  (var-get member-contract-principal)
)

(define-private (is-member-contract (member-contract <member-trait>))
  (ok (asserts! (is-eq (contract-of member-contract) (var-get member-contract-principal)) err-not-member-contract))
)

;; Proposals

(define-read-only (get-proposalData (proposal principal))
  (map-get? proposals proposal)
)

;; Votes

(define-read-only (get-current-total-votes (proposal principal) (voter principal))
  (default-to u0 (map-get? MemberTotalVotes {proposal: proposal, voter: voter}))
)

(define-public (vote (for bool) (proposal principal) (member-contract <member-trait>))
  (let
    (
      (proposalData (unwrap! (map-get? proposals proposal) ERR_UNKNOWN_PROPOSAL))
    )
    (try! (is-member-contract member-contract))
    (asserts! (>= block-height (get startBlockHeight proposalData)) ERR_PROPOSAL_INACTIVE)
    (asserts! (< block-height (get endBlockHeight proposalData)) ERR_PROPOSAL_INACTIVE)
    (map-set MemberTotalVotes {proposal: proposal, voter: tx-sender}
      (+ (get-current-total-votes proposal tx-sender) u1)
    )
    (map-set proposals proposal
      (if for
        (merge proposalData {votesFor: (+ (get votesFor proposalData) u1)})
        (merge proposalData {votesAgainst: (+ (get votesAgainst proposalData) u1)})
      )
    )
    (print {event: "vote", proposal: proposal, voter: tx-sender, for: for})
    (ok true)
  )
)

;; Conclusion

(define-public (conclude (proposal <proposal-trait>))
  (let
    (
      (proposalData (unwrap! (map-get? proposals (contract-of proposal)) ERR_UNKNOWN_PROPOSAL))
      (passed (> (get votesFor proposalData) (get votesAgainst proposalData)))
    )
    (asserts! (not (get concluded proposalData)) ERR_PROPOSAL_ALREADY_CONCLUDED)
    (asserts! (>= block-height (get endBlockHeight proposalData)) ERR_END_BLOCK_HEIGHT_NOT_REACHED)
    (map-set proposals (contract-of proposal) (merge proposalData {concluded: true, passed: passed}))
    (print {event: "conclude", proposal: proposal, passed: passed})
    (and passed (try! (contract-call? .executor-dao execute proposal tx-sender)))
    (ok passed)
  )
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)
