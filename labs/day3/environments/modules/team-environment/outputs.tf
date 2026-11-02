output "namespaces" {
  description = "The namespaces this request created, one per environment."
  value       = sort([for ns in kubernetes_namespace_v1.env : ns.metadata[0].name])
}

output "members" {
  description = "Who can work in these environments (ServiceAccounts in the users namespace)."
  value       = local.members
}
