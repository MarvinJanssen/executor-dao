(impl-trait .sip010-ft-trait.sip010-ft-trait)

(define-constant ERR_UNAUTHORIZED (err u2000))

(define-fungible-token ryancoin)

(define-data-var tokenUri (optional (string-utf8 256)) (some u"https://stackerdaos.com/metadata/ryancoin.json"))

(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq from tx-sender) ERR_UNAUTHORIZED)
    (if (is-some memo)
      (print memo)
      none
    )
    (ft-transfer? ryancoin amount from to)
  )
)

(define-read-only (get-name)
  (ok "ryancoin")
)

(define-read-only (get-symbol)
  (ok "RYAN")
)

(define-read-only (get-decimals)
  (ok u0)
)

(define-read-only (get-balance (user principal))
  (ok (ft-get-balance ryancoin user))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply ryancoin))
)

(define-read-only (get-token-uri)
  (ok (var-get tokenUri))
)

(define-public (set-token-uri (newUri (optional (string-utf8 256))))
  (begin
    ;; TODO: add authorization check
    (ok (var-set tokenUri newUri))
  )
)

(define-public (mint (amount uint) (recipient principal))
  (ft-mint? ryancoin amount recipient)
)

(define-public (burn (amount uint) (recipient principal))
  (ft-burn? ryancoin amount recipient)
)