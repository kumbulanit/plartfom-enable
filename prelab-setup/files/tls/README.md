# Lab TLS files (not committed)

Place the lab certificate files here, all in PEM format:

- `wildcard.crt`: the certificate for `*.<pelab_domain>`. If there are
  intermediates, put them after the leaf certificate.
- `wildcard.key`: its private key.
- `ca.crt`: the CA that issued the certificate. It is added to every trust store
  in the lab.

If you don't have certificate files yet, set `pelab_tls_generate_selfsigned: true`.
The playbook then creates a private lab CA and certificate here, including
`ca.key`. Laptops must trust `ca.crt`, or browsers will warn.
