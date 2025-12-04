import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),

  // API routes
  route("api/generate-mermaid", "routes/api.generate-mermaid.ts"),
  route("api/generate-user-stories", "routes/api.generate-user-stories.ts"),
  route("api/generate-user-docs", "routes/api.generate-user-docs.ts"),
  route("api/generate-suggestions", "routes/api.generate-suggestions.ts"),
  route("api/user-stories/combine", "routes/api.user-stories.combine.ts"),
  route("api/user-stories/split", "routes/api.user-stories.split.ts"),
  route("api/user-stories/regenerate", "routes/api.user-stories.regenerate.ts"),
  route("api/generate-user-docs-structured", "routes/api.generate-user-docs-structured.ts"),
  route("api/user-docs/regenerate", "routes/api.user-docs.regenerate.ts"),
  route("api/generate-tech-spec-structured", "routes/api.generate-tech-spec-structured.ts"),
  route("api/tech-spec/regenerate", "routes/api.tech-spec.regenerate.ts"),

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
