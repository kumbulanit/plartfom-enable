variable "team" {
  description = "Your team's name, for example team01."
  type        = string

  validation {
    condition     = can(regex("^team[0-9]{2}$", var.team))
    error_message = "team must look like team01."
  }
}

variable "environments" {
  description = "The environments to create: staging, prod or both. dev comes with every team."
  type        = list(string)
  default     = ["staging", "prod"]

  validation {
    condition     = length(var.environments) > 0 && alltrue([for env in var.environments : contains(["staging", "prod"], env)])
    error_message = "environments may only contain \"staging\" and \"prod\" (dev comes with every team)."
  }
}

variable "size" {
  description = "The CPU and memory budget of each environment: small or medium."
  type        = string
  default     = "small"

  validation {
    condition     = contains(["small", "medium"], var.size)
    error_message = "size must be \"small\" or \"medium\"."
  }
}
