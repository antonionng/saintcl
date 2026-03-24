import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentOrg } from "@/lib/dal";
import { getOrgModelCatalogState } from "@/lib/openclaw/model-governance";
import { paginateDiscoveryCatalog } from "@/lib/openclaw/discovery-pagination";
import {
  fetchOpenRouterDiscoveryCatalogWithSource,
} from "@/lib/openclaw/model-catalog";

const querySchema = z.object({
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
  includeDiscovery: z.enum(["true", "false"]).default("false"),
});

export async function GET(request: Request) {
  const session = await getCurrentOrg();
  if (!session) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const query = querySchema.parse(params);
  const { snapshot } = await getOrgModelCatalogState(session.org.id);
  const includeDiscovery = query.includeDiscovery === "true";
  const discoveryCatalog = includeDiscovery ? await fetchOpenRouterDiscoveryCatalogWithSource(null) : null;
  const discoveryPage = discoveryCatalog
    ? paginateDiscoveryCatalog(discoveryCatalog.entries, {
        search: query.search,
        page: query.page,
        pageSize: query.pageSize,
      })
    : null;

  return NextResponse.json({
    data: {
      defaultModel: snapshot.defaultModel,
      approvedModels: snapshot.approvedModels,
      discoveryModels: discoveryPage?.entries ?? [],
      catalogSource: discoveryCatalog?.source ?? null,
      discoveryPage: discoveryPage
        ? {
            search: query.search ?? "",
            page: discoveryPage.page,
            pageSize: discoveryPage.pageSize,
            total: discoveryPage.total,
            hasMore: discoveryPage.hasMore,
          }
        : null,
      guardrails: snapshot.guardrails,
      blockedModels: snapshot.blockedModels,
    },
  });
}
