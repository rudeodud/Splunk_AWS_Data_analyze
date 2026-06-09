output "alb_dns_name" {
  description = "ALB DNS 주소"
  value       = module.ec2.alb_dns_name
}

output "ec2_private_ip" {
  description = "EC2 프라이빗 IP"
  value       = module.ec2.ec2_private_ip
}

output "rds_endpoint" {
  description = "RDS 엔드포인트"
  value       = module.rds.rds_endpoint
}
