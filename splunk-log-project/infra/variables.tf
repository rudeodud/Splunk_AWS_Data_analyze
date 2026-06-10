variable "aws_region" {
  type    = string
  default = "ap-northeast-2"
}

variable "key_pair_name" {
  type        = string
  description = "AWS 콘솔에서 생성한 키페어 이름 (파일 경로 아님)"
  # 예) "my-key" → AWS 콘솔 EC2 → 키 페어에서 확인
}

variable "my_ip" {
  type        = string
  description = "SSH 허용할 내 IP (xxx.xxx.xxx.xxx/32)"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "splunk_token" {
  type      = string
  sensitive = true
}

variable "splunk_host" {
  type    = string
  default = "prd-p-9bf9k.splunkcloud.com"
}