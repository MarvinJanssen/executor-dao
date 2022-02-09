;; Title: SDE005 Dev Fund
;; Original Author: Marvin Janssen
;; Maintaining Author: Ryan Waits
;; Depends-On: SDP000
;; Synopsis:
;; A simple pre-seeded dev fund that can pay out developers on a monthly basis.
;; Description:
;; Initialised by SDP001 Dev Fund. Developers can be awarded a monthly allowance
;; and can claim it from this extension. Principals can be added and removed, and
;; allowances can be changed via future proposals.

(impl-trait .extension-trait.extension-trait)

(define-constant ONE_MONTH_TIME u4380) ;; 43,800 minutes / 10 minute average block time.

(define-constant ERR_UNAUTHORIZED (err u3000))
(define-constant ERR_NO_ALLOWANCE (err u3001))
(define-constant ERR_ALREADY_CLAIMED (err u3002))

(define-data-var allowanceStartHeight uint u0)

(define-map MonthlyDeveloperAllowances principal uint)
(define-map ClaimCounts principal uint)

;; --- Authorization check

(define-public (is-dao-or-extension)
	(ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Internal DAO functions

(define-public (set-allowance-start-height (startHeight uint))
	(begin
		(try! (is-dao-or-extension))
		(ok (var-set allowanceStartHeight startHeight))
	)
)

(define-public (set-developer-allowance (allowance uint) (who principal))
	(begin
		(try! (is-dao-or-extension))
		(ok (map-set MonthlyDeveloperAllowances who allowance))
	)
)

(define-private (set-developer-allowances-iter (item {allowance: uint, who: principal}) (previous bool))
	(map-set MonthlyDeveloperAllowances (get who item) (get allowance item))
)

(define-public (set-developer-allowances (developers (list 200 {allowance: uint, who: principal})))
	(begin
		(try! (is-dao-or-extension))
		(ok (fold set-developer-allowances-iter developers true))
	)
)

(define-public (transfer (amount uint) (recipient principal) (memo (optional (buff 34))))
	(begin
		(try! (is-dao-or-extension))
		(as-contract (contract-call? .sde000-governance-token transfer amount tx-sender recipient memo))
	)
)

;; --- Public functions

(define-read-only (get-developer-allowance (who principal))
	(default-to u0 (map-get? MonthlyDeveloperAllowances who))
)

(define-read-only (get-developer-claim-count (who principal))
	(default-to u0 (map-get? ClaimCounts who))
)

(define-public (claim (memo (optional (buff 34))))
	(let
		(
			(allowance (get-developer-allowance tx-sender))
			(claimCount (get-developer-claim-count tx-sender))
			(startHeight (var-get allowanceStartHeight))
			(maxClaims (/ (- block-height startHeight) ONE_MONTH_TIME))
			(developer tx-sender)
		)
		(asserts! (> startHeight u0) ERR_UNAUTHORIZED)
		(asserts! (> allowance u0) ERR_NO_ALLOWANCE)
		(asserts! (< claimCount maxClaims) ERR_ALREADY_CLAIMED)
		(map-set ClaimCounts tx-sender maxClaims)
		(as-contract (contract-call? .sde000-governance-token transfer (* (- maxClaims claimCount) allowance) tx-sender developer memo))
	)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
	(ok true)
)
