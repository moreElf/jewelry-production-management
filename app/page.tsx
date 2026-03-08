import { getDashboardData } from "@/lib/data";
import { SectionCard, StatCard, StatusPill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Workshop overview</h1>
          <p className="section-copy">
            Current production load, bottlenecks, and urgent exceptions.
          </p>
        </div>
      </header>

      <section className="stat-grid">
        <StatCard label="Active Orders" value={data.activeOrders} />
        <StatCard label="Delayed Orders" value={data.delayedOrders} tone="danger" />
        <StatCard label="Orders In Polishing" value={data.polishingOrders} tone="warning" />
        <StatCard label="Orders With Open Issues" value={data.openIssueOrders} tone="warning" />
      </section>

      {data.databaseUnavailable ? (
        <SectionCard
          title="Database unavailable"
          description="The app is running, but Prisma could not reach the configured database service. Check DATABASE_URL and start the local Prisma/Postgres service before using the dashboard."
        >
          <p className="section-copy">
            The current `.env` uses a `prisma+postgres` connection. If that local service is stopped,
            Prisma returns a fetch failure instead of data.
          </p>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Current process counts"
        description="Counts are based on each order's current process, keeping process history separate."
      >
        <div className="summary-grid">
          {data.processCounts.map((process) => (
            <article key={process.id} className="card">
              <div className="split">
                <h3>{process.name}</h3>
                <StatusPill>{process.code}</StatusPill>
              </div>
              <p className="stat-value">{process.count}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
