# Production readiness review — 2026-09-12

No production mutations, payments, deployment, IAM updates, or GitHub writes were performed.

## Actual read-only observations

- `curl -fsS https://penecho.ai/api/config.js`: deployed public configuration reports `hostedCanvasAgent=true` and `remoteCanvasNativeReads=true`. It has no `hostedDocumentFiles` field; this does not prove a configured production worker.
- `gh variable list --repo erickong/penecho-cloud ...` (filtered values only): `PENECHO_HOSTED_MODELS_ENABLED=true`, `PENECHO_STRIPE_BILLING_ENABLED=true`.
- Direct `validateLiveStripe` using existing private production config: `stripeReady=true`, `mutationsPerformed=false`. This checks live account/catalog/Portal/webhook readiness, not an actual payment.
- `aws ecs list-clusters --region ap-southeast-1 --query clusterArns --output json` failed: AWS session expired; AWS requested `aws login`. No login was started.
- `node tools/stripe-production-config.mjs` (without `--apply`) stopped after Stripe validation because AWS authentication expired. Secret references, deployed ECS environment, current IAM permissions, and AWS/GitHub secret equality therefore remain unverified.

## Prepared release corrections (local working tree only)

- Production Terraform explicitly propagates native Canvas and hosted Agent flags; both default true, preserving current verified public behavior. Existing hosted-model readiness gate remains; Agent requires both hosted models and native Canvas. Detailed production tracing is explicitly false.
- Deployment workflow builds the isolated ARM64 document worker from the exact same release SHA, scans app and worker for critical/high vulnerabilities, pins worker deployment to the approved ARM64 digest, verifies exact worker ECS rollout and public capability projection.
- Foundation apply retains the existing worker image by querying its current ECS task definition. A plan-only run includes new worker resources with the release image tag; existing worker resources are not silently removed during foundation apply.
- Cloud Map creation is limited by PenEcho/production request tags and region. Namespace/service mutation is limited by account/region ARN and resource tags. Required Route53 namespace operations use a forward-access condition allowing only calls via servicediscovery.amazonaws.com.
- Existing non-Cloud-Map/Route53 IAM authorization tuples were compared individually against HEAD: all 188 retained exactly. Equivalent unconditional statements were consolidated to meet size limits. Individual minified policy sizes 5828 and 4384; aggregate 10212, below 10240.
- The updated IAM role policies still need the existing bootstrap job during a future explicitly authorized production release. No role policy has been applied locally. AWS read-only inventory must be retried with a renewed authorized session before publishing.

AWS references used for the permission contract:
- https://docs.aws.amazon.com/service-authorization/latest/reference/list_servicediscovery.html
- https://docs.aws.amazon.com/cloud-map/latest/dg/cloud-map-api-permissions-ref.html
- https://docs.aws.amazon.com/cloud-map/latest/dg/security_iam_service-with-iam.html

## Verification

- Terraform 1.15.8 downloaded from HashiCorp, SHA256 checked against its official checksum list. `terraform init -backend=false`, `terraform validate`, and recursive `terraform fmt -check` passed. No remote plan/apply was run. Validation used a disposable config copy for the platform-specific provider checksum; repository lock file unchanged.
- Workflow YAML parsed successfully; all 28 shell run blocks passed `bash -n` after replacing GitHub expressions with inert placeholders.
- `node --test test/deployment-policy.test.mjs test/deployment-workflow.test.mjs`: 32 passed, 0 failed, 0 skipped.
- Initial `npm run check`: 759 total, 732 passed, 26 skipped, one 5-second test subprocess timeout. Exact edge-timeout test rerun passed (2/2). Whole suite with `node --test --test-concurrency=4 test/*.test.mjs`: 733 passed, 0 failed, 26 skipped. These whole-suite results precede the two newly added deployment tests; the final 32-test deployment batch includes them.

## All 26 skipped checks mapped

`PENECHO_TEST_DATABASE_URL` absent in the generic full-suite process:
- billing-upgrades-postgres: 1
- billing-zero-floor-postgres: 1
- credit-lots-postgres: 2
- document-files-postgres: 1
- hosted-billing-postgres: 2
- postgres-fractional-credits: 1
- postgres-provider-reservation: 3
- storage-entitlements-postgres: 1
  These 12 were separately executed successfully earlier in this release review on a new isolated migrated database (68 migrations), then that exact database was dropped.
- postgres-administrator-role: 1
- postgres-feedback: 1
- postgres-object-deletion: 7
- postgres-provider-health: 1
- postgres-test-account: 1

Other absent environment dependencies:
- operational-retention: 1 PostgreSQL check requires `PENECHO_RETENTION_TEST_DATABASE_URL`; 1 Redis check requires `PENECHO_RETENTION_TEST_REDIS_URL`.
- hosted-document-runtime: 1 real worker check requires `DOCUMENT_WORKER_TEST_URL`.

Full logs: cloud-full.log, cloud-full-bounded.log, cloud-edge-timeout-targeted.log, deploy-tests.log, terraform-validate.log in this evidence directory.
