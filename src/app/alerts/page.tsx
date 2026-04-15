import FeatureGate from "@/components/ui/FeatureGate";
import AlertsPage from "@/components/alerts/AlertsPage";

export default function AlertsPageGated() {
  return (
    <FeatureGate flagKey="signals">
      <AlertsPage />
    </FeatureGate>
  );
}
