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

  // Solution Management routes
  route("solutions", "product-management/routes/solutions-list.tsx"),
  route("solutions/:solutionId", "product-management/routes/solution-detail.tsx"),
  route("solutions/:solutionId/use-cases/:useCaseId", "product-management/routes/use-case-detail.tsx"),

  // Persona routes
  route("personas", "product-management/routes/personas-list.tsx"),
  route("personas/:personaId", "product-management/routes/persona-detail.tsx"),

  // Design Studio routes (separate module, solution-based)
  route("studio/:solutionId", "design-studio/routes/studio.tsx"),
] satisfies RouteConfig;
