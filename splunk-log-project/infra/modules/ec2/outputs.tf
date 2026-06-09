output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "ec2_public_ip" {
  value = aws_instance.app.public_ip
}

output "ec2_private_ip" {
  value = aws_instance.app.private_ip
}

output "ec2_sg_id" {
  value = aws_security_group.ec2_sg.id
}

output "splunk_url" {
  value = "http://${aws_instance.app.public_ip}:8000"
}
