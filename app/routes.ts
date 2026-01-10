import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),

  // API routes
  route("api/generate-mermaid", "routes/api.generate-mermaid.ts"),
  route("api/generate-user-stories", "routes/api.generate-user-stories.ts"),
  route("api/generate-user-docs", "routes/api.generate-user-docs.ts"),
  route("api/generate-suggestions", "routes/api.generate-suggestions.ts"),
  route("api/generate-apply-suggestion", "routes/api.generate-apply-suggestion.ts"),
  route("api/generate-combine-stories", "routes/api.generate-combine-stories.ts"),
  route("api/generate-split-story", "routes/api.generate-split-story.ts"),
  route("api/generate-regenerate-story", "routes/api.generate-regenerate-story.ts"),
  route("api/generate-user-docs-structured", "routes/api.generate-user-docs-structured.ts"),
  route("api/generate-user-docs-regenerate", "routes/api.generate-user-docs-regenerate.ts"),
  route("api/generate-tech-spec-structured", "routes/api.generate-tech-spec-structured.ts"),
  route("api/generate-tech-spec-regenerate", "routes/api.generate-tech-spec-regenerate.ts"),
  route("api/parse-transcript", "routes/api.parse-transcript.ts"),
  route("api/merge-personas", "routes/api.merge-personas.ts"),
  route("api/merge-use-cases", "routes/api.merge-use-cases.ts"),
  route("api/generate-overview-section", "routes/api.generate-overview-section.ts"),

  // Discovery routes
  route("discovery", "routes/discovery.tsx"),
  route("discovery/intake", "routes/discovery/intake.tsx"),
  route("discovery/analyze", "routes/discovery/analyze.tsx"),
  route("discovery/organize", "routes/discovery/organize.tsx"),
  route("discovery/organize/personas", "product-management/routes/personas-list.tsx"),
  route("discovery/organize/personas/:personaId", "product-management/routes/persona-detail.tsx"),
  route("discovery/organize/use-cases", "product-management/routes/use-cases-list.tsx"),
  route("discovery/organize/use-cases/:useCaseId", "product-management/routes/discovery-use-case-detail.tsx", { id: "discovery-use-case-detail" }),
  route("discovery/organize/feedback", "discovery/routes/feedback-list.tsx"),
  route("discovery/organize/feedback/:feedbackId", "discovery/routes/feedback-detail.tsx"),
  route("discovery/organize/outcomes", "discovery/routes/outcomes-list.tsx"),

  // Solutions routes
  route("solutions/strategy/overview", "routes/overview.tsx"),
  route("solutions/strategy/overview/:solutionId", "product-management/routes/overview-detail.tsx"),
  route("solutions/scope", "routes/scope.tsx"),
  route("solutions/scope/:solutionId", "product-management/routes/solution-detail.tsx"),
  route("solutions/scope/:solutionId/use-cases/:useCaseId", "product-management/routes/use-case-detail.tsx"),
  route("solutions/plan", "routes/plan.tsx"),

  // Design routes
  route("design/spec", "routes/spec.tsx"),
  route("design/spec/:solutionId", "design-studio/routes/studio.tsx"),

  // Delivery routes
  route("delivery", "routes/delivery.tsx"),
  route("delivery/prioritize", "routes/delivery/prioritize.tsx"),
  route("delivery/build", "routes/delivery/build.tsx"),
  route("delivery/release", "routes/delivery/release.tsx"),
] satisfies RouteConfig;
