# ─────────────────────────────────────────────
# VPC
# ─────────────────────────────────────────────
resource "aws_vpc" "splunk_log_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  # region 속성 없음 → provider "aws" { region } 에서 설정
}


# ─────────────────────────────────────────────
# Subnet
# ─────────────────────────────────────────────
resource "aws_subnet" "splunk_log_public_subnet1" {
  vpc_id                  = aws_vpc.splunk_log_vpc.id
  cidr_block              = "10.0.0.0/24"
  availability_zone       = "ap-northeast-2a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "splunk_log_public_subnet2" {
  vpc_id                  = aws_vpc.splunk_log_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-northeast-2b"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "splunk_log_private_app_subnet1" {
  vpc_id            = aws_vpc.splunk_log_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "ap-northeast-2a"
}

resource "aws_subnet" "splunk_log_private_db_subnet1" {
  vpc_id            = aws_vpc.splunk_log_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "ap-northeast-2a"
}

resource "aws_subnet" "splunk_log_private_db_subnet2" {
  vpc_id            = aws_vpc.splunk_log_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "ap-northeast-2b"
}


# ─────────────────────────────────────────────
# Internet Gateway
# ─────────────────────────────────────────────
resource "aws_internet_gateway" "splunk_log_igw" {
  vpc_id = aws_vpc.splunk_log_vpc.id
}


# ─────────────────────────────────────────────
# NAT Gateway + EIP
# ─────────────────────────────────────────────
resource "aws_eip" "splunk_log_nat_eip" {
  domain = "vpc"
  # vpc = true 는 deprecated → domain = "vpc" 사용
}

resource "aws_nat_gateway" "splunk_log_nat_gw" {
  allocation_id = aws_eip.splunk_log_nat_eip.id
  subnet_id     = aws_subnet.splunk_log_public_subnet1.id
  # NAT GW는 반드시 퍼블릭 서브넷에 위치

  depends_on = [aws_internet_gateway.splunk_log_igw]
}


# ─────────────────────────────────────────────
# Route Table
# ─────────────────────────────────────────────
resource "aws_route_table" "splunk_log_public_rt" {
  vpc_id = aws_vpc.splunk_log_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.splunk_log_igw.id
  }
}

resource "aws_route_table" "splunk_log_app_private_rt" {
  vpc_id = aws_vpc.splunk_log_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.splunk_log_nat_gw.id
    # EC2 → NAT GW → IGW → Splunk HEC, GitHub
  }
}

resource "aws_route_table" "splunk_log_db_private_rt" {
  vpc_id = aws_vpc.splunk_log_vpc.id
  # RDS는 외부 통신 불필요 → 라우트 없음
}


# ─────────────────────────────────────────────
# Route Table Association
# ─────────────────────────────────────────────
resource "aws_route_table_association" "splunk_log_public_subnet1_association" {
  subnet_id      = aws_subnet.splunk_log_public_subnet1.id
  route_table_id = aws_route_table.splunk_log_public_rt.id
}

resource "aws_route_table_association" "splunk_log_public_subnet2_association" {
  subnet_id      = aws_subnet.splunk_log_public_subnet2.id
  route_table_id = aws_route_table.splunk_log_public_rt.id
}

resource "aws_route_table_association" "splunk_log_private_app_subnet1_association" {
  subnet_id      = aws_subnet.splunk_log_private_app_subnet1.id
  route_table_id = aws_route_table.splunk_log_app_private_rt.id
}

resource "aws_route_table_association" "splunk_log_private_db_subnet1_association" {
  subnet_id      = aws_subnet.splunk_log_private_db_subnet1.id
  route_table_id = aws_route_table.splunk_log_db_private_rt.id
}

resource "aws_route_table_association" "splunk_log_private_db_subnet2_association" {
  subnet_id      = aws_subnet.splunk_log_private_db_subnet2.id
  route_table_id = aws_route_table.splunk_log_db_private_rt.id
}


# ─────────────────────────────────────────────
# 보안그룹: ALB
# ─────────────────────────────────────────────
resource "aws_security_group" "splunk_log_alb_sg" {
  name   = "splunk-log-alb-sg"
  vpc_id = aws_vpc.splunk_log_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


# ─────────────────────────────────────────────
# 보안그룹: EC2
# ─────────────────────────────────────────────
resource "aws_security_group" "splunk_log_ec2_sg" {
  name   = "splunk-log-ec2-sg"
  vpc_id = aws_vpc.splunk_log_vpc.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.splunk_log_alb_sg.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


# ─────────────────────────────────────────────
# EC2
# ─────────────────────────────────────────────
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "splunk_log_ec2_instance" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.splunk_log_private_app_subnet1.id
  associate_public_ip_address = true
  key_name                    = var.key_pair_name
  vpc_security_group_ids      = [aws_security_group.splunk_log_ec2_sg.id]

  user_data = <<-USERDATA
    #!/bin/bash
    set -e
    exec > /var/log/user-data.log 2>&1

    yum update -y
    yum install -y docker git

    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user

    # Docker Compose V1 설치 제거 및 V2 플러그인 설치
    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    cd /home/ec2-user
    git clone https://github.com/rudeodud/Splunk_AWS_Data_analyze.git app
    cd app/splunk-log-project

    cat > backend/.env << ENV
    PORT=3000
    NODE_ENV=production
    LOG_PATH=./logs/app.log
    DB_PORT=5432
    DB_NAME=splunk_demo
    DB_USER=postgres
    DB_PASSWORD=${var.db_password}
    URL=https://${var.splunk_host}:8088/services/collector/event
    TOKEN=${var.splunk_token}
    ENV

    # Docker Compose V2 명령어로 변경
    docker compose up -d --build
    chown -R ec2-user:ec2-user /home/ec2-user/app
  USERDATA

  tags = {
    Name = "splunk-log-ec2"
  }
  root_block_device {
    volume_size = 70
    volume_type = "gp3"
  }
}


# ─────────────────────────────────────────────
# ALB
# ─────────────────────────────────────────────
resource "aws_lb" "splunk_log_alb" {
  name               = "splunk-log-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.splunk_log_alb_sg.id]
  subnets = [
    aws_subnet.splunk_log_public_subnet1.id,
    aws_subnet.splunk_log_public_subnet2.id,
  ]
}

resource "aws_lb_target_group" "splunk_log_tg" {
  name     = "splunk-log-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.splunk_log_vpc.id

  health_check {
    path                = "/orders"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

resource "aws_lb_target_group_attachment" "splunk_log_tg_attachment" {
  target_group_arn = aws_lb_target_group.splunk_log_tg.arn
  target_id        = aws_instance.splunk_log_ec2_instance.id
  port             = 3000
}

resource "aws_lb_listener" "splunk_log_http" {
  load_balancer_arn = aws_lb.splunk_log_alb.arn
  port              = 3000
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.splunk_log_tg.arn
  }
}

# ─────────────────────────────────────────────
# 보안그룹: RDS
# ─────────────────────────────────────────────
resource "aws_security_group" "splunk_log_rds_sg" {
  name   = "splunk-log-rds-sg"
  vpc_id = aws_vpc.splunk_log_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.splunk_log_ec2_sg.id]
    # EC2 보안그룹에서만 PostgreSQL 5432 허용
    # 인터넷에서 직접 접근 불가
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


# ─────────────────────────────────────────────
# RDS 서브넷 그룹
# ─────────────────────────────────────────────
resource "aws_db_subnet_group" "splunk_log_db_subnet_group" {
  name = "splunk-log-db-subnet-group"

  subnet_ids = [
    aws_subnet.splunk_log_private_db_subnet1.id,
    aws_subnet.splunk_log_private_db_subnet2.id,
    # 2개 AZ 필수 (AWS RDS 요구사항)
  ]
}


# ─────────────────────────────────────────────
# RDS 인스턴스
# ─────────────────────────────────────────────
resource "aws_db_instance" "splunk_log_rds" {
  identifier        = "splunk-log-db"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.micro"
  # 프리티어: 월 750시간 무료

  allocated_storage = 20
  # 20GB (프리티어 최대)

  db_name  = "splunk_demo"
  username = "postgres"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.splunk_log_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.splunk_log_rds_sg.id]

  publicly_accessible = false
  # 인터넷 직접 접근 불가
  # EC2 통해서만 접근 가능

  skip_final_snapshot     = true
  multi_az                = false
  backup_retention_period = 0

  tags = {
    Name = "splunk-log-rds"
  }
}