import { proxyToGateway, type OpenClawProxyRouteParams } from "@/app/api/openclaw/proxy-to-gateway";

export async function GET(request: Request, ctx: OpenClawProxyRouteParams) {
  return proxyToGateway(request, ctx, {
    requireAdmin: false,
    requireAssignedAgent: true,
    restrictToWorkspaceSurface: true,
  });
}

export async function POST(request: Request, ctx: OpenClawProxyRouteParams) {
  return proxyToGateway(request, ctx, {
    requireAdmin: false,
    requireAssignedAgent: true,
    restrictToWorkspaceSurface: true,
  });
}

export async function PUT(request: Request, ctx: OpenClawProxyRouteParams) {
  return proxyToGateway(request, ctx, {
    requireAdmin: false,
    requireAssignedAgent: true,
    restrictToWorkspaceSurface: true,
  });
}

export async function PATCH(request: Request, ctx: OpenClawProxyRouteParams) {
  return proxyToGateway(request, ctx, {
    requireAdmin: false,
    requireAssignedAgent: true,
    restrictToWorkspaceSurface: true,
  });
}

export async function DELETE(request: Request, ctx: OpenClawProxyRouteParams) {
  return proxyToGateway(request, ctx, {
    requireAdmin: false,
    requireAssignedAgent: true,
    restrictToWorkspaceSurface: true,
  });
}

export async function OPTIONS(request: Request, ctx: OpenClawProxyRouteParams) {
  return proxyToGateway(request, ctx, {
    requireAdmin: false,
    requireAssignedAgent: true,
    restrictToWorkspaceSurface: true,
  });
}
