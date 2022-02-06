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

(define-constant err-unauthorised (err u3000))
(define-constant err-not-member-contract (err u3001))
(define-constant err-proposal-already-executed (err u3002))
(define-constant err-proposal-already-exists (err u3003))
(define-constant err-unknown-proposal (err u3004))
(define-constant err-proposal-already-concluded (err u3005))
(define-constant err-proposal-inactive (err u3006))
(define-constant err-proposal-not-concluded (err u3007))
(define-constant err-no-votes-to-return (err u3008))
(define-constant err-end-block-height-not-reached (err u3009))
(define-constant err-disabled (err u3010))

(define-data-var member-contract-principal principal .sde006-membership)

(define-map proposals
  principal
  {
    votes-for: uint,
    votes-against: uint,
    start-block-height: uint,
    end-block-height: uint,
    concluded: bool,
    passed: bool,
    proposer: principal
  }
)

(define-map member-total-votes {proposal: principal, voter: principal} uint)

;; --- Authorization check

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) err-unauthorised))
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

(define-public (add-proposal (proposal <proposal-trait>) (data {start-block-height: uint, end-block-height: uint, proposer: principal}))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (is-none (contract-call? .executor-dao executed-at proposal)) err-proposal-already-executed)
    (print {event: "propose", proposal: proposal, proposer: tx-sender})
    (ok (asserts! (map-insert proposals (contract-of proposal) (merge {votes-for: u0, votes-against: u0, concluded: false, passed: false} data)) err-proposal-already-exists))
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

(define-read-only (get-proposal-data (proposal principal))
  (map-get? proposals proposal)
)

;; Votes

(define-read-only (get-current-total-votes (proposal principal) (voter principal))
  (default-to u0 (map-get? member-total-votes {proposal: proposal, voter: voter}))
)

(define-public (vote (for bool) (proposal principal) (member-contract <member-trait>))
  (let
    (
      (proposal-data (unwrap! (map-get? proposals proposal) err-unknown-proposal))
    )
    (try! (is-member-contract member-contract))
    (asserts! (>= block-height (get start-block-height proposal-data)) err-proposal-inactive)
    (asserts! (< block-height (get end-block-height proposal-data)) err-proposal-inactive)
    (map-set member-total-votes {proposal: proposal, voter: tx-sender}
      (+ (get-current-total-votes proposal tx-sender) u1)
    )
    (map-set proposals proposal
      (if for
        (merge proposal-data {votes-for: (+ (get votes-for proposal-data) u1)})
        (merge proposal-data {votes-against: (+ (get votes-against proposal-data) u1)})
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
      (proposal-data (unwrap! (map-get? proposals (contract-of proposal)) err-unknown-proposal))
      (passed (> (get votes-for proposal-data) (get votes-against proposal-data)))
    )
    (asserts! (not (get concluded proposal-data)) err-proposal-already-concluded)
    (asserts! (>= block-height (get end-block-height proposal-data)) err-end-block-height-not-reached)
    (map-set proposals (contract-of proposal) (merge proposal-data {concluded: true, passed: passed}))
    (print {event: "conclude", proposal: proposal, passed: passed})
    (and passed (try! (contract-call? .executor-dao execute proposal tx-sender)))
    (ok passed)
  )
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)
