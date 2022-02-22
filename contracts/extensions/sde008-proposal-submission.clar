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

;; Title: SDE008 Proposal Submission
;; Author: StackerDAO Dev Team
;; Depends-On: SDE007
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
(use-trait member-trait .member-trait.member-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u3100))
(define-constant ERR_NOT_MEMBER_CONTRACT (err u3101))
(define-constant ERR_UNKNOWN_PARAMETER (err u3102))
(define-constant ERR_PROPOSAL_MINIMUM_START_DELAY (err u3103))
(define-constant ERR_PROPOSAL_MAXIMUM_START_DELAY (err u3104))

(define-data-var memberContractPrincipal principal .sde006-membership)

(define-map Parameters (string-ascii 34) uint)

(map-set Parameters "proposalDuration" u1440) ;; ~10 days based on a ~10 minute block time.
(map-set Parameters "minimumProposalStartDelay" u144) ;; ~1 day minimum delay before voting on a proposal can start.
(map-set Parameters "maximumProposalStartDelay" u1008) ;; ~7 days maximum delay before voting on a proposal can start.

;; --- Authorization check

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

;; Member

(define-public (set-member-contract (memberContract <member-trait>))
  (begin
    (try! (is-dao-or-extension))
    (ok (var-set memberContractPrincipal (contract-of memberContract)))
  )
)

;; Parameters

(define-public (set-parameter (parameter (string-ascii 34)) (value uint))
  (begin
    (try! (is-dao-or-extension))
    (try! (get-parameter parameter))
    (ok (map-set Parameters parameter value))
  )
)

(define-private (set-parameters-iter (item {parameter: (string-ascii 34), value: uint}) (previous (response bool uint)))
  (begin
    (try! previous)
    (try! (get-parameter (get parameter item)))
    (ok (map-set Parameters (get parameter item) (get value item)))
  )
)

(define-public (set-parameters (parameter-list (list 200 {parameter: (string-ascii 34), value: uint})))
  (begin
    (try! (is-dao-or-extension))
    (fold set-parameters-iter parameter-list (ok true))
  )
)

;; --- Public functions

(define-read-only (get-member-contract)
  (var-get memberContractPrincipal)
)

(define-private (is-member-contract (memberContract <member-trait>))
  (ok (asserts! (is-eq (contract-of memberContract) (get-member-contract)) ERR_NOT_MEMBER_CONTRACT))
)

;; Parameters

(define-read-only (get-parameter (parameter (string-ascii 34)))
  (ok (unwrap! (map-get? Parameters parameter) ERR_UNKNOWN_PARAMETER))
)

;; Proposals

(define-public (propose (proposal <proposal-trait>) (startBlockHeight uint) (memberContract <member-trait>))
  (begin
    (try! (is-member-contract memberContract))
    (asserts! (>= startBlockHeight (+ block-height (try! (get-parameter "minimumProposalStartDelay")))) ERR_PROPOSAL_MINIMUM_START_DELAY)
    (asserts! (<= startBlockHeight (+ block-height (try! (get-parameter "maximumProposalStartDelay")))) ERR_PROPOSAL_MAXIMUM_START_DELAY)
    (contract-call? .sde007-proposal-voting add-proposal
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
