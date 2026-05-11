output "resource_group_name" {
  value = azurerm_resource_group.smartpark_rg.name
}

output "acr_login_server" {
  value = azurerm_container_registry.smartpark_acr.login_server
}

output "app_service_url" {
  value = "https://${azurerm_linux_web_app.smartpark_app.default_hostname}"
}

output "app_service_name" {
  value = azurerm_linux_web_app.smartpark_app.name
}
