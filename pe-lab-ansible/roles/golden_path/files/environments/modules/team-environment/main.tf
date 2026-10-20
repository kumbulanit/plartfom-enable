# team-environment: one fenced area per environment for a team.
#
# For each environment it creates the namespace <team>-<environment> with
#   - a budget (ResourceQuota) set by var.size, and container defaults (LimitRange),
#   - network rules: only the team's own pods, the ingress, Prometheus and the
#     platform services can talk to it,
#   - access for the team's members: edit in staging, read-only in prod.
# The values come from platform.tf, which the platform team owns.

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 3.4"
    }
  }
}

# The team's members: one ServiceAccount per delegate, labelled with the team.
data "kubernetes_resources" "members" {
  api_version    = "v1"
  kind           = "ServiceAccount"
  namespace      = local.users_namespace
  label_selector = "pelab.io/team=${var.team}"
}

locals {
  environments = toset(var.environments)
  members      = sort([for account in data.kubernetes_resources.members.objects : account.metadata.name])
}

resource "kubernetes_namespace_v1" "env" {
  for_each = local.environments

  metadata {
    name = "${var.team}-${each.key}"
    labels = {
      "pelab.io/tier"                      = "team"
      "pelab.io/team"                      = var.team
      "pelab.io/env"                       = each.key
      "pelab.io/size"                      = var.size
      "app.kubernetes.io/managed-by"       = "opentofu"
      "pod-security.kubernetes.io/enforce" = local.pod_security.enforce
      "pod-security.kubernetes.io/warn"    = local.pod_security.warn
      "pod-security.kubernetes.io/audit"   = local.pod_security.audit
    }
  }
}

resource "kubernetes_resource_quota_v1" "budget" {
  for_each = local.environments

  metadata {
    name      = "team-quota"
    namespace = kubernetes_namespace_v1.env[each.key].metadata[0].name
  }
  spec {
    hard = local.sizes[var.size]
  }
}

resource "kubernetes_limit_range_v1" "defaults" {
  for_each = local.environments

  metadata {
    name      = "team-defaults"
    namespace = kubernetes_namespace_v1.env[each.key].metadata[0].name
  }
  spec {
    limit {
      type            = "Container"
      default         = local.container_defaults.default
      default_request = local.container_defaults.default_request
      max             = local.container_defaults.max
    }
  }
}

resource "kubernetes_network_policy_v1" "default_deny" {
  for_each = local.environments

  metadata {
    name      = "default-deny"
    namespace = kubernetes_namespace_v1.env[each.key].metadata[0].name
  }
  spec {
    pod_selector {}
    policy_types = ["Ingress", "Egress"]
  }
}

resource "kubernetes_network_policy_v1" "same_namespace" {
  for_each = local.environments

  metadata {
    name      = "allow-same-namespace"
    namespace = kubernetes_namespace_v1.env[each.key].metadata[0].name
  }
  spec {
    pod_selector {}
    policy_types = ["Ingress", "Egress"]
    ingress {
      from {
        pod_selector {}
      }
    }
    egress {
      to {
        pod_selector {}
      }
    }
  }
}

resource "kubernetes_network_policy_v1" "from_platform" {
  for_each = local.environments

  metadata {
    name      = "allow-from-platform"
    namespace = kubernetes_namespace_v1.env[each.key].metadata[0].name
  }
  spec {
    pod_selector {}
    policy_types = ["Ingress"]
    ingress {
      from {
        namespace_selector {
          match_expressions {
            key      = "kubernetes.io/metadata.name"
            operator = "In"
            values   = local.ingress_from_namespaces
          }
        }
      }
    }
  }
}

resource "kubernetes_network_policy_v1" "to_platform" {
  for_each = local.environments

  metadata {
    name      = "allow-to-platform"
    namespace = kubernetes_namespace_v1.env[each.key].metadata[0].name
  }
  spec {
    pod_selector {}
    policy_types = ["Egress"]
    egress {
      to {
        namespace_selector {
          match_expressions {
            key      = "kubernetes.io/metadata.name"
            operator = "In"
            values   = local.egress_to_namespaces
          }
        }
      }
    }
    # The lab's addresses (*.<domain>) resolve to the host, where the ingress answers.
    egress {
      to {
        ip_block {
          cidr = local.ingress_address
        }
      }
      ports {
        protocol = "TCP"
        port     = "443"
      }
    }
  }
}

resource "kubernetes_role_binding_v1" "members" {
  for_each = local.environments

  metadata {
    name      = "${var.team}-members"
    namespace = kubernetes_namespace_v1.env[each.key].metadata[0].name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = local.member_roles[each.key]
  }
  dynamic "subject" {
    for_each = local.members
    content {
      kind      = "ServiceAccount"
      name      = subject.value
      namespace = local.users_namespace
    }
  }
}
