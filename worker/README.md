# TaskTrace hosted A/B worker

Cloudflare Workers + Workflows + D1 implementation for the optional hosted A/B delivery path. It never evaluates obligations or decides settlement. Agent keys are restricted by code and product flow to `accept_work` and `submit_artifact`; client review and all settlement operations remain outside this service.

The OpenAI ledger is initialized to the approved build/test cap of **800,000,000 nano-USD = 0.80 USD**. Every inference reserves a conservative maximum before dispatch. A network/response ambiguity retains the reservation and is not retried automatically.

Before any remote deployment:

1. Create a D1 Free database and replace the placeholder database ID in `wrangler.jsonc`.
2. Set the deployed Bradbury V2 contract address only after mandatory contract tests pass and the owner approves deployment.
3. Create a dedicated public evidence repository matching all frozen origins.
4. Add `OPENAI_API_KEY`, distinct narrowly funded `WORKER_A_PRIVATE_KEY` / `WORKER_B_PRIVATE_KEY`, and a repository-scoped `GITHUB_EVIDENCE_TOKEN` with Wrangler secrets.
5. Apply migrations and run the health/budget and one-job browser acceptance tests.

Do not put any secret in `vars`, the frontend, Git, Vercel client variables, or a demo recording.
