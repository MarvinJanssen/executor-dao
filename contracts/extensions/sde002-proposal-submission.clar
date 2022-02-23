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

;; Title: SDE002 Proposal Submission
;; Author: Marvin Janssen / StackerDAO Dev Team
;; Depends-On: SDE001
;; Synopsis:
;; This extension part of the core of StackerDAO. It allows governance token
;; holders to submit proposals when they hold at least n% percentage of the
;; token supply.
;; Description:
;; Proposals may be submitted by anyone that holds at least n% of governance
;; tokens. Any submission is subject to a pre-defined start delay before voting
;; can begin, and will then run for a pre-defined duration. The percentage,
;; start delay, and proposal duration can all by changed by means of a future
;; proposal.

(use-trait proposal-trait .proposal-trait.proposal-trait)
(use-trait governance-token-trait .governance-token-trait.governance-token-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u2600))
(define-constant ERR_NOT_GOVERNANCE_TOKEN (err u2601))
(define-constant ERR_INSUFFICIENT_BALANCE (err u2602))
(define-constant ERR_UNKNOWN_PARAMETER (err u2603))
(define-constant ERR_PROPOSAL_MINIMUM_START_DELAY (err u2604))
(define-constant ERR_PROPOSAL_MAXIMUM_START_DELAY (err u2605))

(define-data-var governanceTokenPrincipal principal .sde000-governance-token)

(define-map parameters (string-ascii 34) uint)

(map-set parameters "proposeFactor" u100000) ;; 1% initially required to propose (100/n*1000).
(map-set parameters "proposalDuration" u1440) ;; ~10 days based on a ~10 minute block time.
(map-set parameters "minimumProposalStartDelay" u144) ;; ~1 day minimum delay before voting on a proposal can start.
(map-set parameters "maximumProposalStartDelay" u1008) ;; ~7 days maximum delay before voting on a proposal can start.

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

;; Governance token

(define-public (set-governance-token (governance-token <governance-token-trait>))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set governanceTokenPrincipal (contract-of governance-token)))
	)
)

;; Parameters

(define-public (set-parameter (parameter (string-ascii 34)) (value uint))
	(begin
		(try! (is-dao-or-extension))
		(try! (get-parameter parameter))
		(ok (map-set parameters parameter value))
	)
)

(define-private (set-parameters-iter (item {parameter: (string-ascii 34), value: uint}) (previous (response bool uint)))
	(begin
		(try! previous)
		(try! (get-parameter (get parameter item)))
		(ok (map-set parameters (get parameter item) (get value item)))
	)
)

(define-public (set-parameters (parameter-list (list 200 {parameter: (string-ascii 34), value: uint})))
	(begin
		(try! (is-dao-or-extension))
		(fold set-parameters-iter parameter-list (ok true))
	)
)

;; --- Public functions

;; Governance token

(define-read-only (get-governance-token)
	(var-get governanceTokenPrincipal)
)

(define-private (is-governance-token (governance-token <governance-token-trait>))
	(ok (asserts! (is-eq (contract-of governance-token) (var-get governanceTokenPrincipal)) ERR_NOT_GOVERNANCE_TOKEN))
)

;; Parameters

(define-read-only (get-parameter (parameter (string-ascii 34)))
	(ok (unwrap! (map-get? parameters parameter) ERR_UNKNOWN_PARAMETER))
)

;; Proposals

(define-public (propose (proposal <proposal-trait>) (startBlockHeight uint) (governance-token <governance-token-trait>))
	(begin
		(try! (is-governance-token governance-token))
		(asserts! (>= startBlockHeight (+ block-height (try! (get-parameter "minimumProposalStartDelay")))) ERR_PROPOSAL_MINIMUM_START_DELAY)
		(asserts! (<= startBlockHeight (+ block-height (try! (get-parameter "maximumProposalStartDelay")))) ERR_PROPOSAL_MAXIMUM_START_DELAY)
		(asserts! (try! (contract-call? governance-token sdg-has-percentage-balance tx-sender (try! (get-parameter "proposeFactor")))) ERR_INSUFFICIENT_BALANCE)
		(contract-call? .sde001-proposal-voting add-proposal
			proposal
			{
				startBlockHeight: startBlockHeight,
				endBlockHeight: (+ startBlockHeight (try! (get-parameter "proposalDuration"))),
				proposer: tx-sender
			}
		)
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
