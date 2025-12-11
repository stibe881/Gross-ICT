import { useParams } from "wouter";
import CampaignStatistics from "@/components/CampaignStatistics";
import { trpc } from "@/lib/trpc";

export default function CampaignStatisticsPage() {
  const params = useParams<{ id: string }>();
  const campaignId = parseInt(params.id || "0", 10);

  // Fetch campaign details for name
  const { data: campaignData } = trpc.newsletter.campaigns.getById.useQuery(
    { id: campaignId },
    { enabled: campaignId > 0 }
  );

  return (
    <CampaignStatistics
      campaignId={campaignId}
      campaignName={campaignData?.campaign?.name}
    />
  );
}
