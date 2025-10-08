output "configuration_summary" {
  description = "Key infrastructure identifiers for downstream modules."
  value = {
    vpc_id        = module.vpc.vpc_id
    cluster_name  = module.eks.cluster_name
    eks_endpoint  = module.eks.cluster_endpoint
    rds_endpoint  = aws_rds_cluster.postgres.endpoint
    logs_bucket   = aws_s3_bucket.logs.bucket
  }
}
