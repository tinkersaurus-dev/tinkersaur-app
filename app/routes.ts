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

  // Discovery route
  route("discovery", "routes/discovery.tsx"),

  // Solution Management routes (nested under /solution)
  route("solution/scope", "routes/scope.tsx"),
  route("solution/scope/:solutionId", "product-management/routes/solution-detail.tsx"),
  route("solution/scope/:solutionId/use-cases/:useCaseId", "product-management/routes/use-case-detail.tsx"),
  route("solution/scope/personas", "product-management/routes/personas-list.tsx"),
  route("solution/scope/personas/:personaId", "product-management/routes/persona-detail.tsx"),
  route("solution/design", "routes/design.tsx"),
  route("solution/design/:solutionId", "design-studio/routes/studio.tsx"),
  route("solution/plan", "routes/plan.tsx"),

  // Delivery route
  route("delivery", "routes/delivery.tsx"),
] satisfies RouteConfig;
