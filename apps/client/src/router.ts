import * as React from 'react';

export interface RouteDefinition {
  path: string;
  name: string;
  tier: 0 | 1 | 2 | 3;
  component: React.ComponentType<any>;
}

export interface MatchedRoute {
  path: string;
  name: string;
  params: Record<string, string>;
  component: React.ComponentType<any>;
}

export function matchRoute(currentPath: string, routes: RouteDefinition[]): MatchedRoute {
  // Normalize
  const cleanPath = currentPath.split('?')[0]?.split('#')[0] || '/';

  // Exact match first
  const exact = routes.find((r) => r.path === cleanPath);
  if (exact) {
    return { path: exact.path, name: exact.name, params: {}, component: exact.component };
  }

  // Parameterized match (e.g. /library/:id)
  const segments = cleanPath.split('/').filter(Boolean);

  for (const route of routes) {
    const routeSegments = route.path.split('/').filter(Boolean);
    if (routeSegments.length !== segments.length) continue;

    const params: Record<string, string> = {};
    let matches = true;

    for (let i = 0; i < routeSegments.length; i++) {
      const rSeg = routeSegments[i]!;
      const pSeg = segments[i]!;

      if (rSeg.startsWith(':')) {
        params[rSeg.slice(1)] = pSeg;
      } else if (rSeg !== pSeg) {
        matches = false;
        break;
      }
    }

    if (matches) {
      return { path: route.path, name: route.name, params, component: route.component };
    }
  }

  // Fallback to root (Library)
  const root = routes.find((r) => r.path === '/') || routes[0]!;
  return { path: '/', name: root.name, params: {}, component: root.component };
}
