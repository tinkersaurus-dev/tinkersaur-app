import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("set-password", "routes/set-password.tsx"),

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
  route("discovery/organize/outcomes/:outcomeId", "discovery/routes/outcome-detail.tsx"),

  // Solutions routes
  route("solutions/strategy/overview", "routes/overview.tsx"),
  route("solutions/strategy/overview/:solutionId", "product-management/routes/overview-detail.tsx"),
  route("solutions/strategy/market-research", "routes/market-research.tsx"),
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
