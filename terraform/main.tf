# ─────────────────────────────────────────────────────────────
# SmartPark Terraform Infrastructure
# Creates Azure Resources using Infrastructure as Code
# ─────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# ─────────────────────────────────────────────────────────────
# Azure Provider
# ─────────────────────────────────────────────────────────────

provider "azurerm" {
  features {}

  subscription_id = var.subscription_id
}

# ─────────────────────────────────────────────────────────────
# Resource Group
# ─────────────────────────────────────────────────────────────

resource "azurerm_resource_group" "smartpark_rg" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    project     = "SmartPark"
    environment = "terraform-demo"
    managed_by  = "terraform"
  }
}

# ─────────────────────────────────────────────────────────────
# Azure Container Registry (ACR)
# ─────────────────────────────────────────────────────────────

resource "azurerm_container_registry" "smartpark_acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.smartpark_rg.name
  location            = azurerm_resource_group.smartpark_rg.location

  sku           = "Basic"
  admin_enabled = true

  tags = {
    project    = "SmartPark"
    managed_by = "terraform"
  }

  depends_on = [
    azurerm_resource_group.smartpark_rg
  ]
}

# ─────────────────────────────────────────────────────────────
# App Service Plan
# ─────────────────────────────────────────────────────────────

resource "azurerm_service_plan" "smartpark_plan" {
  name                = var.app_service_plan_name
  resource_group_name = azurerm_resource_group.smartpark_rg.name
  location            = azurerm_resource_group.smartpark_rg.location

  os_type  = "Linux"
  sku_name = "F1"

  tags = {
    project    = "SmartPark"
    managed_by = "terraform"
  }

  depends_on = [
    azurerm_resource_group.smartpark_rg
  ]
}

# ─────────────────────────────────────────────────────────────
# Linux Web App
# ─────────────────────────────────────────────────────────────

resource "azurerm_linux_web_app" "smartpark_app" {
  name                = var.app_service_name
  resource_group_name = azurerm_resource_group.smartpark_rg.name
  location            = azurerm_resource_group.smartpark_rg.location

  service_plan_id = azurerm_service_plan.smartpark_plan.id

  site_config {

    always_on = false

    application_stack {
      node_version = "18-lts"
    }
  }

  app_settings = {
    "MONGO_URI"   = var.mongo_uri
    "JWT_SECRET"  = var.jwt_secret
    "NODE_ENV"    = "production"
    "PORT"        = "8080"
  }

  https_only = true

  tags = {
    project    = "SmartPark"
    managed_by = "terraform"
  }

  depends_on = [
    azurerm_service_plan.smartpark_plan
  ]
}
