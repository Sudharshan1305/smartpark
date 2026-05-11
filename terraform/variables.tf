variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "resource_group_name" {
  description = "Terraform Resource Group"
  type        = string
  default     = "smartpark-tf-rg"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "southeastasia"
}

variable "acr_name" {
  description = "Azure Container Registry name"
  type        = string
  default     = "smartparktf1305"
}

variable "app_service_plan_name" {
  description = "App Service Plan name"
  type        = string
  default     = "smartpark-tf-plan"
}

variable "app_service_name" {
  description = "Web App name"
  type        = string
  default     = "smartpark-tf-app1305"
}

variable "mongo_uri" {
  description = "MongoDB Atlas URI"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT Secret"
  type        = string
  sensitive   = true
}
