# Environment requests. Each team adds one file next to this one, team01.tf for
# example, that uses the team-environment template:
#
#   module "team01" {
#     source       = "./modules/team-environment"
#     team         = "team01"
#     environments = ["staging", "prod"]
#     size         = "small"
#   }
#
# A pull request shows the plan; after the platform team approves and the change
# is merged, the platform applies main within two minutes.

terraform {
  required_version = ">= 1.9"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 3.4"
    }
  }

  # OpenTofu's memory of what it built lives in the cluster, as a Secret.
  backend "kubernetes" {
    secret_suffix = "environments"
    namespace     = "pelab-tfstate"
  }
}

# Reads the cluster address and credentials from KUBE_CONFIG_PATH.
provider "kubernetes" {}
