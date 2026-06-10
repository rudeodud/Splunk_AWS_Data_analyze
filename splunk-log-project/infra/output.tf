output "alb_dns_name" {
  value = aws_lb.splunk_log_alb.dns_name
  # terraform apply 후 이 주소로 브라우저 접속
}

output "ec2_private_ip" {
  value = aws_instance.splunk_log_ec2_instance.private_ip
}

output "rds_endpoint" {
  value = aws_db_instance.splunk_log_rds.endpoint
}