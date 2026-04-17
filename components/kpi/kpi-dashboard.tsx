import { KPICards } from "@/components/kpi/kpi-cards";

export function KPIDashboard({
  result,
}: {
  result: {
    actionsPlanifiees: number;
    actionsEnAttente: number;
    actionsRealisees: number;
    tauxRealisation: number;
    actionsARespect: number;
    tauxRespect: number;
  };
}) {
  return <KPICards data={result} />;
}
