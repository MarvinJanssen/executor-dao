(impl-trait .sip009-nft-trait.sip009-nft-trait)

(define-constant ERR_ONLY_OWNER (err u100))
(define-constant ERR_NOT_TOKEN_OWNER (err u101))

(define-constant CONTRACT_OWNER tx-sender)

(define-non-fungible-token Stacker-Dao-Token uint)

(define-data-var last-token-id uint u0)

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (tokenId uint))
  (ok none)
)

(define-read-only (get-owner (tokenId uint))
  (ok (nft-get-owner? Stacker-Dao-Token tokenId))
)

(define-public (transfer (tokenId uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_NOT_TOKEN_OWNER)
    (nft-transfer? Stacker-Dao-Token tokenId sender recipient)
  )
)

(define-public (mint (recipient principal))
  (let
    (
      (tokenId (+ (var-get last-token-id) u1))
    )
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_ONLY_OWNER)
    (try! (nft-mint? Stacker-Dao-Token tokenId recipient))
    (var-set last-token-id tokenId)
    (ok tokenId)
  )
)