;; Title: EDE007 Governance Token Sale
;; Author: Marvin Janssen
;; Depends-On: EDE000, EDE006, EDE007
;; Synopsis:
;; An extension that manages the initial governance token sale.
;; Description:
;; An extension contract that allows users to buy governance tokens
;; at a set price until a specific block height with STX. It has
;; various parameters that dictate the terms of the sale: (1) the
;; token price in STX, (2) the minimum required sale amount (if any),
;; (3) the sale end height, (4) the maximum sale amount (if any).


(impl-trait .extension-trait.extension-trait)

(define-constant price-per-token u100000) ;; Price per token in mSTX, u100000 = 0.1 STX per token.
(define-constant sale-duration u432) ;; Sale duration in block time, u432 is roughly three weeks.

(define-constant minimum-sale-amount u0) ;; Minimum number of tokens to sell for the sale to be successful.
(define-constant maximum-sale-amount u0) ;; Maximum number of tokens for sale, or 0 for no limit.

(define-constant err-unauthorised (err u3000))
(define-constant err-sale-already-started (err u3001))
(define-constant err-sale-ended (err u3002))
(define-constant err-not-sale-ended (err u3003))
(define-constant err-nothing-to-refund (err u3004))
(define-constant err-sale-succeeded (err u3005))
(define-constant err-maximum-amount-exceeded (err u3006))
(define-constant err-nothing-to-claim (err u3007))
(define-constant err-sale-failed (err u3008))

(define-data-var end-height uint u0)
(define-data-var total-allocation uint u0)

(define-map unclaimed-allocations principal uint)

;; --- Authorisation check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) err-unauthorised))
)

;; --- Internal DAO functions


(define-public (start)
	(begin
		(asserts! (is-eq (var-get end-height) u0) err-sale-already-started)
		(ok (var-set end-height (+ block-height sale-duration)))
	)
)

;; --- Public functions

(define-public (buy (amount uint))
	(let ((new-total (+ (var-get total-allocation) amount)))
		(asserts! (<= block-height (var-get end-height)) err-sale-ended)
		(asserts! (or (is-eq maximum-sale-amount u0) (<= new-total maximum-sale-amount)) err-maximum-amount-exceeded)
		(map-set unclaimed-allocations tx-sender (+ (default-to u0 (map-get? unclaimed-allocations tx-sender)) amount))
		(var-set total-allocation new-total)
		(stx-transfer? (* amount price-per-token) tx-sender .ede006-treasury)
	)
)

(define-public (refund)
	(let ((amount (get-unclaimed-allocation tx-sender)))
		(asserts! (> block-height (var-get end-height)) err-not-sale-ended)
		(asserts! (< (var-get total-allocation) minimum-sale-amount) err-sale-succeeded)
		(asserts! (> amount u0) err-nothing-to-refund)
		(map-delete unclaimed-allocations tx-sender)
		(contract-call? .ede006-treasury stx-transfer (* amount price-per-token) tx-sender none)
	)
)

(define-public (claim)
	(let ((amount (get-unclaimed-allocation tx-sender)))
		(asserts! (> block-height (var-get end-height)) err-not-sale-ended)
		(asserts! (>= (var-get total-allocation) minimum-sale-amount) err-sale-failed)
		(asserts! (> amount u0) err-nothing-to-claim)
		(map-delete unclaimed-allocations tx-sender)
		(contract-call? .ede000-governance-token edg-mint amount tx-sender)
	)
)

(define-read-only (get-end-height)
	(let ((height (var-get end-height)))
		(if (> height u0)
			(some height)
			none
		)
	)
)

(define-read-only (get-start-height)
	(match (get-end-height)
		height (some (- height sale-duration))
		none
	)
)

(define-read-only (get-unclaimed-allocation (who principal))
	(default-to u0 (map-get? unclaimed-allocations who))
)

(define-read-only (get-total-allocation)
	(var-get total-allocation)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)