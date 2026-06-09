variable "project_name"      { type = string }
variable "vpc_id"            { type = string }
variable "public_subnet_id"  { type = string }
variable "private_subnet_id" { type = string }
variable "my_ip"             { type = string }

variable "splunk_token" {
  type      = string
  sensitive = true
}

variable "splunk_host" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}
