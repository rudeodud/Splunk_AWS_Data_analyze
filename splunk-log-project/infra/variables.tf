variable "aws_region" {
  type    = string
  default = "ap-northeast-2"
}

variable "project_name" {
  type    = string
  default = "splunk-log"
}

variable "availability_zone" {
  type    = string
  default = "ap-northeast-2a"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

variable "private_subnet_app_cidr" {
  type    = string
  default = "10.0.2.0/24"
}

variable "private_subnet_db_cidr" {
  type    = string
  default = "10.0.3.0/24"
}

variable "my_ip" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "splunk_token" {
  description = "Splunk HEC 토큰"
  type        = string
  sensitive   = true
}

variable "splunk_host" {
  description = "Splunk HEC 호스트"
  type        = string
  default     = "prd-p-9bf9k.splunkcloud.com"
}
