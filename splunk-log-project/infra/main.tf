terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "./modules/vpc"

  vpc_cidr                = var.vpc_cidr
  public_subnet_cidr      = var.public_subnet_cidr
  private_subnet_app_cidr = var.private_subnet_app_cidr
  private_subnet_db_cidr  = var.private_subnet_db_cidr
  availability_zone       = var.availability_zone
  project_name            = var.project_name
}

module "ec2" {
  source = "./modules/ec2"

  project_name      = var.project_name
  vpc_id            = module.vpc.vpc_id
  public_subnet_id  = module.vpc.public_subnet_id
  private_subnet_id = module.vpc.private_subnet_app_id
  my_ip             = var.my_ip
  splunk_token      = var.splunk_token
  splunk_host       = var.splunk_host
  db_password       = var.db_password
}

module "rds" {
  source = "./modules/rds"

  project_name          = var.project_name
  vpc_id                = module.vpc.vpc_id
  private_subnet_db_id  = module.vpc.private_subnet_db_id
  private_subnet_app_id = module.vpc.private_subnet_app_id
  ec2_sg_id             = module.ec2.ec2_sg_id
  db_password           = var.db_password
}
