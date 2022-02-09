(use-trait nft-trait .sip009-nft-trait.sip009-nft-trait)
(use-trait ft-trait .sip010-ft-trait.sip010-ft-trait)

(impl-trait .extension-trait.extension-trait)

(define-constant ERR_UNAUTHORIZED (err u3200))
(define-constant ERR_ASSET_NOT_WHITELISTED (err u3201))
(define-constant ERR_FAILED_TO_TRANSFER_STX (err u3202))
(define-constant ERR_FAILED_TO_TRANSFER_FT (err u3203))
(define-constant ERR_FAILED_TO_TRANSFER_NFT (err u3204))

(define-constant CONTRACT_ADDRESS (as-contract tx-sender))

(define-map WhitelistedAssets principal bool)


;; --- Authorization check

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .executor-dao) (contract-call? .executor-dao is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; --- Public functions

(define-public (set-whitelisted (assetContract principal) (whitelisted bool))
  (begin
    (try! (is-dao-or-extension))
    (map-set WhitelistedAssets assetContract whitelisted)
    (ok true)
  )
)

(define-public (deposit-stx (amount uint))
  (begin
    (unwrap! (stx-transfer? amount tx-sender CONTRACT_ADDRESS) ERR_FAILED_TO_TRANSFER_STX)
    (print {event: "deposit-stx", amount: amount, caller: tx-sender})
    (ok true)
  )
)

(define-public (deposit-ft (ft <ft-trait>) (amount uint))
  (begin
    (asserts! (is-whitelisted (contract-of ft)) ERR_ASSET_NOT_WHITELISTED)
    (unwrap! (contract-call? ft transfer amount tx-sender CONTRACT_ADDRESS (some 0x11)) ERR_FAILED_TO_TRANSFER_FT)
    (print {event: "deposit-ft", amount: amount, assetContract: (contract-of ft), caller: tx-sender})
    (ok true)
  )
)

(define-public (deposit-nft (nft <nft-trait>) (id uint))
  (begin
    (asserts! (is-whitelisted (contract-of nft)) ERR_ASSET_NOT_WHITELISTED)
    (unwrap! (contract-call? nft transfer id tx-sender CONTRACT_ADDRESS) ERR_FAILED_TO_TRANSFER_NFT)
    (print {event: "deposit-nft", assetContract: (contract-of nft), tokenId: id, caller: tx-sender})
    (ok true)
  )
)


(define-public (send-stx (amount uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (unwrap! (as-contract (stx-transfer? amount CONTRACT_ADDRESS recipient)) ERR_FAILED_TO_TRANSFER_STX)
    (print {event: "send-stx", amount: amount, caller: tx-sender, recipient: recipient})
    (ok true)
  )
)

(define-public (send-ft (ft <ft-trait>) (amount uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (is-whitelisted (contract-of ft)) ERR_ASSET_NOT_WHITELISTED)
    (unwrap! (as-contract (contract-call? ft transfer amount CONTRACT_ADDRESS recipient (some 0x11))) ERR_FAILED_TO_TRANSFER_FT)
    (print {event: "send-ft", assetContract: (contract-of ft), caller: tx-sender, recipient: recipient})
    (ok true)
  )
)

(define-public (send-nft (nft <nft-trait>) (id uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (is-whitelisted (contract-of nft)) ERR_ASSET_NOT_WHITELISTED)
    (unwrap! (as-contract (contract-call? nft transfer id CONTRACT_ADDRESS recipient)) ERR_FAILED_TO_TRANSFER_NFT)
    (print {event: "send-nft", assetContract: (contract-of nft), tokenId: id, caller: tx-sender, recipient: recipient})
    (ok true)
  )
)

;; --- Read Only Functions

(define-read-only (is-whitelisted (assetContract principal))
  (default-to false (get-whitelisted-asset assetContract))
)

;; Simple function to get a whitelisted asset
(define-read-only (get-whitelisted-asset (assetContract principal))
    (map-get? WhitelistedAssets assetContract)
)

;; --- Extension callback

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)
