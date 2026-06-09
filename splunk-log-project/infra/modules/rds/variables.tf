variable "project_name"            { type = string }
variable "vpc_id"                  { type = string }
variable "private_subnet_db_id"    { type = string }
variable "private_subnet_db_b_id"  { type = string }
variable "ec2_sg_id"               { type = string }

variable "db_password" {
  type      = string
  sensitive = true
}
