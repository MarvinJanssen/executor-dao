(impl-trait .extension-trait.extension-trait)

(use-trait nft-trait .sip009-nft-trait.sip009-nft-trait)
(use-trait ft-trait .sip010-ft-trait.sip010-ft-trait)

(define-constant err-unauthorised (err u3200))
(define-constant err-failed-to-transfer-stx (err u3201))
(define-constant err-failed-to-transfer-ft (err u3202))
(define-constant err-failed-to-transfer-nft (err u3203))

(define-constant contract-address (as-contract tx-sender))

;; --- Authorization check

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) err-unauthorised))
)

;; --- Public functions

(define-public (deposit-stx (amount uint))
  (begin
    (unwrap! (stx-transfer? amount tx-sender contract-address) err-failed-to-transfer-stx)
    (ok true)
  )
)

;; TODO: Create a whitelist of fungible token contracts allowed for deposit
(define-public (deposit-ft (ft <ft-trait>) (amount uint))
  (begin
    (unwrap! (contract-call? ft transfer amount tx-sender contract-address (some 0x11)) err-failed-to-transfer-ft)
    (ok true)
  )
)

;; TODO: Create a whitelist of nft contracts allowed for deposit
(define-public (deposit-nft (nft <nft-trait>) (id uint))
  (begin
    (unwrap! (contract-call? nft transfer id tx-sender contract-address) err-failed-to-transfer-nft)
    (ok true)
  )
)


(define-public (move-stx (amount uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (try! (as-contract (stx-transfer? amount contract-address recipient)))
    (ok true)
  )
)

;; TODO: Create a whitelist of fungible token contracts allowed for withdraw
(define-public (move-ft (ft <ft-trait>) (amount uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (try! (as-contract (contract-call? ft transfer amount contract-address recipient (some 0x11))))
    (ok true)
  )
)

;; TODO: Create a whitelist of nft contracts allowed for withdraw
(define-public (move-nft (nft <nft-trait>) (id uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (try! (as-contract (contract-call? nft transfer id contract-address recipient)))
    (ok true)
  )
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)
