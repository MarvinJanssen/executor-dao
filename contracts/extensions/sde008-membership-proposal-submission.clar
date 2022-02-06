;; Title: SDE002 Proposal Submission
;; Author: Marvin Janssen
;; Depends-On: SDE001
;; Synopsis:
;; This extension part of the core of ExecutorDAO. It allows governance token
;; holders to submit proposals when they hold at least n% percentage of the
;; token supply.
;; Description:
;; Proposals may be submitted by anyone that holds at least n% of governance
;; tokens. Any submission is subject to a pre-defined start delay before voting
;; can begin, and will then run for a pre-defined duration. The percentage,
;; start delay, and proposal duration can all by changed by means of a future
;; proposal.

(impl-trait .extension-trait.extension-trait)
(use-trait proposal-trait .proposal-trait.proposal-trait)
(use-trait member-trait .member-trait.member-trait)

(define-constant err-unauthorised (err u3100))
(define-constant err-not-member-contract (err u3101))
(define-constant err-unknown-parameter (err u3103))
(define-constant err-proposal-minimum-start-delay (err u3104))
(define-constant err-proposal-maximum-start-delay (err u3105))

(define-data-var member-contract-principal principal .sde006-membership)

(define-map parameters (string-ascii 34) uint)

(map-set parameters "proposal-duration" u1440) ;; ~10 days based on a ~10 minute block time.
(map-set parameters "minimum-proposal-start-delay" u144) ;; ~1 day minimum delay before voting on a proposal can start.
(map-set parameters "maximum-proposal-start-delay" u1008) ;; ~7 days maximum delay before voting on a proposal can start.

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

(define-read-only (get-member-contract)
  (var-get member-contract-principal)
)

(define-private (is-member-contract (member-contract <member-trait>))
  (ok (asserts! (is-eq (contract-of member-contract) (var-get member-contract-principal)) err-not-member-contract))
)

;; Parameters

(define-read-only (get-parameter (parameter (string-ascii 34)))
  (ok (unwrap! (map-get? parameters parameter) err-unknown-parameter))
)

;; Proposals

(define-public (propose (proposal <proposal-trait>) (start-block-height uint) (member-contract <member-trait>))
  (begin
    (try! (is-member-contract member-contract))
    (asserts! (>= start-block-height (+ block-height (try! (get-parameter "minimum-proposal-start-delay")))) err-proposal-minimum-start-delay)
    (asserts! (<= start-block-height (+ block-height (try! (get-parameter "maximum-proposal-start-delay")))) err-proposal-maximum-start-delay)
    (contract-call? .sde007-membership-proposal-voting add-proposal
      proposal
      {
        start-block-height: start-block-height,
        end-block-height: (+ start-block-height (try! (get-parameter "proposal-duration"))),
        proposer: tx-sender
      }
    )
  )
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)
