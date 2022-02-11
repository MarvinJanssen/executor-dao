;;     _____________  _______ _________  ___  ___  ____  ____
;;     / __/_  __/ _ |/ ___/ //_/ __/ _ \/ _ \/ _ |/ __ \/ __/
;;     _\ \  / / / __ / /__/ ,< / _// , _/ // / __ / /_/ /\ \  
;;    /___/ /_/ /_/ |_\___/_/|_/___/_/|_/____/_/ |_\____/___/  
;;                                                          
;;     _____  _____________  ______________  _  __           
;;    / __/ |/_/_  __/ __/ |/ / __/  _/ __ \/ |/ /           
;;   / _/_>  <  / / / _//    /\ \_/ // /_/ /    /            
;;  /___/_/|_| /_/ /___/_/|_/___/___/\____/_/|_/             
;;                                                           

;; Title: SDE001 Proposal Voting
;; Author: Marvin Janssen / StackerDAO Dev Team
;; Depends-On: SDE000
;; Synopsis:
;; This extension is part of the core of StackerDAO. It allows governance token
;; holders to vote on and conclude proposals.
;; Description:
;; Once proposals are submitted, they are open for voting after a lead up time
;; passes. Any token holder may vote on an open proposal, where one token equals
;; one vote. Members can vote until the voting period is over. After this period
;; anyone may trigger a conclusion. The proposal will then be executed if the
;; votes in favour exceed the ones against.

(use-trait proposal-trait .proposal-trait.proposal-trait)
(use-trait governance-token-trait .governance-token-trait.governance-token-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u2500))
(define-constant ERR_NOT_GOVERNANCE_TOKEN (err u2501))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u2502))
(define-constant ERR_PROPOSAL_ALREADY_EXISTS (err u2503))
(define-constant ERR_UNKNOWN_PROPOSAL (err u2504))
(define-constant ERR_PROPOSAL_ALREADY_CONCLUDED (err u2505))
(define-constant ERR_PROPOSAL_INACTIVE (err u2506))
(define-constant ERR_PROPOSAL_NOT_CONCLUDED (err u2507))
(define-constant ERR_NO_VOTES_TO_RETURN (err u2508))
(define-constant ERR_END_BLOCK_HEIGHT_NOT_REACHED (err u2509))
(define-constant ERR_DISABLED (err u2510))

(define-data-var governanceTokenPrincipal principal .sde000-governance-token)

(define-map Proposals
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

(define-map MemberTotalVotes {proposal: principal, voter: principal, governanceToken: principal} uint)

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

;; Governance token

(define-public (set-governance-token (governanceToken <governance-token-trait>))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set governanceTokenPrincipal (contract-of governanceToken)))
	)
)

;; Proposals

(define-public (add-proposal (proposal <proposal-trait>) (data {startBlockHeight: uint, endBlockHeight: uint, proposer: principal}))
	(begin
		(try! (is-dao-or-extension))
		(asserts! (is-none (contract-call? .executor-dao executed-at proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
		(print {event: "propose", proposal: proposal, proposer: tx-sender})
		(ok (asserts! (map-insert Proposals (contract-of proposal) (merge {votesFor: u0, votesAgainst: u0, concluded: false, passed: false} data)) ERR_PROPOSAL_ALREADY_EXISTS))
	)
)

;; --- Public functions

;; Governance token

(define-read-only (get-governance-token)
	(var-get governanceTokenPrincipal)
)

(define-private (is-governance-token (governanceToken <governance-token-trait>))
	(ok (asserts! (is-eq (contract-of governanceToken) (var-get governanceTokenPrincipal)) ERR_NOT_GOVERNANCE_TOKEN))
)

;; Proposals

(define-read-only (get-proposal-data (proposal principal))
	(map-get? Proposals proposal)
)

;; Votes

(define-read-only (get-current-total-votes (proposal principal) (voter principal) (governanceToken principal))
	(default-to u0 (map-get? MemberTotalVotes {proposal: proposal, voter: voter, governanceToken: governanceToken}))
)

(define-public (vote (amount uint) (for bool) (proposal principal) (governanceToken <governance-token-trait>))
	(let
		(
			(proposalData (unwrap! (map-get? Proposals proposal) ERR_UNKNOWN_PROPOSAL))
			(tokenPrincipal (contract-of governanceToken))
		)
		(try! (is-governance-token governanceToken))
		(asserts! (>= block-height (get startBlockHeight proposalData)) ERR_PROPOSAL_INACTIVE)
		(asserts! (< block-height (get endBlockHeight proposalData)) ERR_PROPOSAL_INACTIVE)
		(map-set MemberTotalVotes {proposal: proposal, voter: tx-sender, governanceToken: tokenPrincipal}
			(+ (get-current-total-votes proposal tx-sender tokenPrincipal) amount)
		)
		(map-set Proposals proposal
			(if for
				(merge proposalData {votesFor: (+ (get votesFor proposalData) amount)})
				(merge proposalData {votesAgainst: (+ (get votesAgainst proposalData) amount)})
			)
		)
		(print {event: "vote", proposal: proposal, voter: tx-sender, for: for, amount: amount})
		(contract-call? governanceToken sdg-lock amount tx-sender)
	)
)

;; Conclusion

(define-public (conclude (proposal <proposal-trait>))
	(let
		(
			(proposalData (unwrap! (map-get? Proposals (contract-of proposal)) ERR_UNKNOWN_PROPOSAL))
			(passed (> (get votesFor proposalData) (get votesAgainst proposalData)))
		)
		(asserts! (not (get concluded proposalData)) ERR_PROPOSAL_ALREADY_CONCLUDED)
		(asserts! (>= block-height (get endBlockHeight proposalData)) ERR_END_BLOCK_HEIGHT_NOT_REACHED)
		(map-set Proposals (contract-of proposal) (merge proposalData {concluded: true, passed: passed}))
		(print {event: "conclude", proposal: proposal, passed: passed})
		(and passed (try! (contract-call? .executor-dao execute proposal tx-sender)))
		(ok passed)
	)
)

;; Reclamation

(define-public (reclaim-votes (proposal <proposal-trait>) (governanceToken <governance-token-trait>))
	(let
		(
			(proposalPrincipal (contract-of proposal))
			(tokenPrincipal (contract-of governanceToken))
			(proposalData (unwrap! (map-get? Proposals proposalPrincipal) ERR_UNKNOWN_PROPOSAL))
			(votes (unwrap! (map-get? MemberTotalVotes {proposal: proposalPrincipal, voter: tx-sender, governanceToken: tokenPrincipal}) ERR_NO_VOTES_TO_RETURN))
		)
		(asserts! (get concluded proposalData) ERR_PROPOSAL_NOT_CONCLUDED)
		(map-delete MemberTotalVotes {proposal: proposalPrincipal, voter: tx-sender, governanceToken: tokenPrincipal})
		(contract-call? governanceToken sdg-unlock votes tx-sender)
	)
)

(define-public (reclaim-and-vote (amount uint) (for bool) (proposal principal) (reclaim-from <proposal-trait>) (governanceToken <governance-token-trait>))
	(begin
		(try! (reclaim-votes reclaim-from governanceToken))
		(vote amount for proposal governanceToken)
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
