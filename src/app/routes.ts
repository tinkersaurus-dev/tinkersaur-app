import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Auth routes - outside MainLayout (no sidebar)
  route("login", "../pages/auth/login/page.tsx"),
  route("forgot-password", "../pages/auth/forgot-password/page.tsx"),
  route("reset-password", "../pages/auth/reset-password/page.tsx"),
  route("set-password", "../pages/auth/set-password/page.tsx"),

  // App routes - wrapped in MainLayout for persistent sidebar
  layout("layouts/MainLayout.tsx", [
    index("../pages/home/page.tsx"),

    // Discovery routes
    route("discovery", "../pages/discovery/page.tsx"),
    route("discovery/coverage", "../pages/discovery/coverage/page.tsx"),
    route("discovery/intake", "../pages/discovery/intake/page.tsx"),
    route("discovery/analyze", "../pages/discovery/analyze/page.tsx"),
    route("discovery/analyze/heatmap", "../pages/discovery/analyze/heatmap/page.tsx"),
    route("discovery/analyze/signal-strength", "../pages/discovery/analyze/signal-strength/page.tsx"),
    route("discovery/organize", "../pages/discovery/organize/page.tsx"),
    route("discovery/organize/personas", "../pages/discovery/organize/personas/page.tsx"),
    route("discovery/organize/personas/:personaId", "../pages/discovery/organize/personas/[personaId]/page.tsx"),
    route("discovery/organize/user-goals", "../pages/discovery/organize/user-goals/page.tsx"),
    route("discovery/organize/user-goals/:userGoalId", "../pages/discovery/organize/user-goals/[userGoalId]/page.tsx", { id: "discovery-user-goal-detail" }),
    route("discovery/organize/feedback", "../pages/discovery/organize/feedback/page.tsx"),
    route("discovery/organize/feedback/:feedbackId", "../pages/discovery/organize/feedback/[feedbackId]/page.tsx"),
    route("discovery/organize/outcomes", "../pages/discovery/organize/outcomes/page.tsx"),
    route("discovery/organize/outcomes/:outcomeId", "../pages/discovery/organize/outcomes/[outcomeId]/page.tsx"),

    // Solutions routes
    route("solutions/strategy/overview", "../pages/solutions/strategy/overview/page.tsx"),
    route("solutions/strategy/overview/:solutionId", "../pages/solutions/strategy/overview/[solutionId]/page.tsx"),
    route("solutions/strategy/market-research", "../pages/solutions/strategy/market-research/page.tsx"),
    route("solutions/scope", "../pages/solutions/scope/page.tsx"),
    // Specification routes must come before :solutionId to avoid "specification" being matched as a solutionId
    route("solutions/scope/specification", "../pages/solutions/scope/specification/page.tsx"),
    route("solutions/scope/specification/:solutionId", "../pages/solutions/scope/specification/[solutionId]/page.tsx"),
    route("solutions/scope/:solutionId", "../pages/solutions/scope/[solutionId]/page.tsx"),
    route("solutions/scope/:solutionId/use-cases/:useCaseId", "../pages/solutions/scope/[solutionId]/use-cases/[useCaseId]/page.tsx"),
    route("solutions/plan", "../pages/solutions/plan/page.tsx"),

    // Design routes
    route("design/spec", "../pages/design/spec/page.tsx"),
    route("design/spec/:solutionId", "../pages/design/spec/[solutionId]/page.tsx"),

    // Delivery routes
    route("delivery", "../pages/delivery/page.tsx"),
    route("delivery/prioritize", "../pages/delivery/prioritize/page.tsx"),
    route("delivery/build", "../pages/delivery/build/page.tsx"),
    route("delivery/release", "../pages/delivery/release/page.tsx"),
  ]),
] satisfies RouteConfig;
