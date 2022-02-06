;; Title: SDE001 Proposal Voting
;; Author: Marvin Janssen
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
(use-trait governance-token-trait .governance-token-trait.governance-token-trait)

(define-constant err-unauthorised (err u2500))
(define-constant err-not-governance-token (err u2501))
(define-constant err-proposal-already-executed (err u2502))
(define-constant err-proposal-already-exists (err u2503))
(define-constant err-unknown-proposal (err u2504))
(define-constant err-proposal-already-concluded (err u2505))
(define-constant err-proposal-inactive (err u2506))
(define-constant err-proposal-not-concluded (err u2507))
(define-constant err-no-votes-to-return (err u2508))
(define-constant err-end-block-height-not-reached (err u2509))
(define-constant err-disabled (err u2510))

(define-data-var governance-token-principal principal .sde000-governance-token)

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

(define-map member-total-votes {proposal: principal, voter: principal, governance-token: principal} uint)

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) err-unauthorised))
)

;; --- Internal DAO functions

;; Governance token

(define-public (set-governance-token (governance-token <governance-token-trait>))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set governance-token-principal (contract-of governance-token)))
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

;; Governance token

(define-read-only (get-governance-token)
	(var-get governance-token-principal)
)

(define-private (is-governance-token (governance-token <governance-token-trait>))
	(ok (asserts! (is-eq (contract-of governance-token) (var-get governance-token-principal)) err-not-governance-token))
)

;; Proposals

(define-read-only (get-proposal-data (proposal principal))
	(map-get? proposals proposal)
)

;; Votes

(define-read-only (get-current-total-votes (proposal principal) (voter principal) (governance-token principal))
	(default-to u0 (map-get? member-total-votes {proposal: proposal, voter: voter, governance-token: governance-token}))
)

(define-public (vote (amount uint) (for bool) (proposal principal) (governance-token <governance-token-trait>))
	(let
		(
			(proposal-data (unwrap! (map-get? proposals proposal) err-unknown-proposal))
			(token-principal (contract-of governance-token))
		)
		(try! (is-governance-token governance-token))
		(asserts! (>= block-height (get start-block-height proposal-data)) err-proposal-inactive)
		(asserts! (< block-height (get end-block-height proposal-data)) err-proposal-inactive)
		(map-set member-total-votes {proposal: proposal, voter: tx-sender, governance-token: token-principal}
			(+ (get-current-total-votes proposal tx-sender token-principal) amount)
		)
		(map-set proposals proposal
			(if for
				(merge proposal-data {votes-for: (+ (get votes-for proposal-data) amount)})
				(merge proposal-data {votes-against: (+ (get votes-against proposal-data) amount)})
			)
		)
		(print {event: "vote", proposal: proposal, voter: tx-sender, for: for, amount: amount})
		(contract-call? governance-token sdg-lock amount tx-sender)
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

;; Reclamation

(define-public (reclaim-votes (proposal <proposal-trait>) (governance-token <governance-token-trait>))
	(let
		(
			(proposal-principal (contract-of proposal))
			(token-principal (contract-of governance-token))
			(proposal-data (unwrap! (map-get? proposals proposal-principal) err-unknown-proposal))
			(votes (unwrap! (map-get? member-total-votes {proposal: proposal-principal, voter: tx-sender, governance-token: token-principal}) err-no-votes-to-return))
		)
		(asserts! (get concluded proposal-data) err-proposal-not-concluded)
		(map-delete member-total-votes {proposal: proposal-principal, voter: tx-sender, governance-token: token-principal})
		(contract-call? governance-token sdg-unlock votes tx-sender)
	)
)

(define-public (reclaim-and-vote (amount uint) (for bool) (proposal principal) (reclaim-from <proposal-trait>) (governance-token <governance-token-trait>))
	(begin
		(try! (reclaim-votes reclaim-from governance-token))
		(vote amount for proposal governance-token)
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
