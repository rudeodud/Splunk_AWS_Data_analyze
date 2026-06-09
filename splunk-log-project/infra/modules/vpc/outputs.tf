output "vpc_id"                { value = aws_vpc.main.id }
output "public_subnet_id"      { value = aws_subnet.public.id }
output "public_subnet_b_id"    { value = aws_subnet.public_b.id }
output "private_subnet_app_id" { value = aws_subnet.private_app.id }
output "private_subnet_db_id"  { value = aws_subnet.private_db.id }
output "private_subnet_db_b_id" { value = aws_subnet.private_db_b.id }
