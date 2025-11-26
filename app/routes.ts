import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // API routes
  route("api/generate-mermaid", "routes/api.generate-mermaid.ts"),

  // Solution Management routes
  route("solutions", "product-management/routes/solutions-list.tsx"),
  route("solutions/:solutionId", "product-management/routes/solution-detail.tsx"),
  route("solutions/:solutionId/use-cases/:useCaseId", "product-management/routes/use-case-detail.tsx"),
  route("solutions/:solutionId/use-cases/:useCaseId/changes/:changeId", "product-management/routes/change-detail.tsx"),

  // Design Studio routes (separate module, solution-based)
  route("studio/:solutionId", "design-studio/routes/studio.tsx"),
] satisfies RouteConfig;
