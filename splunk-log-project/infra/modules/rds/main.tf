# ─────────────────────────────────────────────
# RDS 서브넷 그룹
# ─────────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name = "${var.project_name}-db-subnet-group"

  subnet_ids = [
    var.private_subnet_db_id,
    var.private_subnet_db_b_id,
  ]
  # RDS는 서브넷 그룹에 최소 2개 서브넷 필요
  # (멀티 AZ 대비 — 지금은 단일 AZ지만 요구사항)

  tags = { Name = "${var.project_name}-db-subnet-group" }
}


# ─────────────────────────────────────────────
# 보안그룹: RDS
# ─────────────────────────────────────────────
resource "aws_security_group" "rds_sg" {
  name   = "${var.project_name}-rds-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ec2_sg_id]
    # EC2 보안그룹에서만 PostgreSQL 5432 포트 허용
    # 인터넷에서 RDS 직접 접근 불가
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-rds-sg" }
}


# ─────────────────────────────────────────────
# RDS 인스턴스 (PostgreSQL)
# ─────────────────────────────────────────────
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db"

  engine         = "postgres"
  # 특정 마이너 버전(15.4)이 지원 중단되었을 수 있으므로 
  # 메이저 버전인 "15"만 지정하여 최신 지원 버전을 자동으로 선택하게 합니다.
  engine_version = "15" 

  instance_class = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = "splunk_demo"
  username = "postgres"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  publicly_accessible = false
  skip_final_snapshot = true
  multi_az = false
  backup_retention_period = 0

  tags = { Name = "${var.project_name}-db" }
}
