variable "project_name"       { type = string }
variable "vpc_id"             { type = string }
variable "public_subnet_id"   { type = string }
variable "public_subnet_b_id" { type = string }
variable "private_subnet_id"  { type = string }
variable "my_ip"              { type = string }
variable "keyname"            { type = string }

variable "db_password" {
  type      = string
  sensitive = true
}

variable "splunk_token" {
  type      = string
  sensitive = true
}

variable "splunk_host" {
  type = string
}
