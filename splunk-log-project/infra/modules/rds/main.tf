# ─────────────────────────────────────────────
# RDS 서브넷 그룹
# ─────────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name = "${var.project_name}-db-subnet-group"

  subnet_ids = [
    var.private_subnet_db_id,
    var.private_subnet_app_id,
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
  # AWS 콘솔에서 표시되는 RDS 인스턴스 이름

  engine         = "postgres"
  engine_version = "15.4"
  # PostgreSQL 15.4

  instance_class = "db.t3.micro"
  # 프리티어: 월 750시간 무료

  allocated_storage = 20
  # 20GB SSD (프리티어 최대)

  storage_type      = "gp2"
  # gp2: 범용 SSD

  db_name  = "splunk_demo"
  username = "postgres"
  password = var.db_password
  # sensitive 변수 → terraform plan 출력에서 숨김

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  publicly_accessible = false
  # 인터넷에서 직접 접근 불가
  # EC2를 통해서만 접근 가능

  skip_final_snapshot = true
  # 삭제 시 스냅샷 생성 안 함
  # 프로덕션에서는 false로 설정 권장

  multi_az = false
  # 단일 AZ 구성 (프리티어 절약)

  backup_retention_period = 0
  # 자동 백업 비활성화 (프리티어 절약)

  tags = { Name = "${var.project_name}-db" }
}
