export function KPICards({
  data,
}: {
  data: {
    actionsPlanifiees: number;
    actionsEnAttente: number;
    actionsRealisees: number;
    tauxRealisation: number;
    actionsARespect: number;
    tauxRespect: number;
  };
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card bg-gradient-to-br from-white to-primary-soft/40">
        <h3 className="text-lg font-bold">Planification</h3>
        <p className="mt-4 text-4xl font-black">{data.actionsPlanifiees}</p>
        <p className="mt-2 text-sm text-muted">Actions planifiees sur la periode</p>
        <div className="mt-5 rounded-2xl bg-white/80 px-4 py-3 text-sm text-muted">
          Actions en attente : {data.actionsEnAttente}
        </div>
      </div>
      <div className="card bg-gradient-to-br from-white to-teal-50">
        <h3 className="text-lg font-bold">Realisation du planning</h3>
        <p className="mt-4 text-4xl font-black">{data.tauxRealisation}%</p>
        <p className="mt-2 text-sm text-muted">Taux de realisation du planning</p>
        <div className="mt-5 rounded-2xl bg-white/80 px-4 py-3 text-sm text-muted">
          Actions realisees : {data.actionsRealisees}
        </div>
      </div>
      <div className="card bg-gradient-to-br from-white to-amber-50">
        <h3 className="text-lg font-bold">Respect du planning</h3>
        <p className="mt-4 text-4xl font-black">{data.tauxRespect}%</p>
        <p className="mt-2 text-sm text-muted">Taux du respect du planning</p>
        <div className="mt-5 rounded-2xl bg-white/80 px-4 py-3 text-sm text-muted">
          Actions realisees a temps : {data.actionsARespect}
        </div>
      </div>
    </div>
  );
}
