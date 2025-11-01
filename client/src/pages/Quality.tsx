import Header from "@/components/Header";
import GlassCard from "@/components/GlassCard";
import { useAnalyticsStore } from "@/lib/analytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatMs(ms?: number) {
  if (!ms && ms !== 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}

export default function Quality() {
  const { sessions } = useAnalyticsStore();
  const latestSessions = [...sessions].reverse().slice(0, 20);

  const totalTurns = sessions.reduce((acc, session) => acc + session.metrics.turns, 0);
  const totalTokens = sessions.reduce((acc, session) => acc + session.metrics.tokens, 0);

  const ratedSessions = sessions.filter((session) => typeof session.metrics.rating === "number");
  const csatAvg =
    ratedSessions.length > 0
      ? ratedSessions.reduce((acc, session) => acc + (session.metrics.rating ?? 0), 0) /
        ratedSessions.length
      : undefined;

  const firstTokenSessions = sessions.filter(
    (session) => typeof session.metrics.firstTokenMs === "number"
  );
  const avgFirstTokenMs =
    firstTokenSessions.length > 0
      ?
          firstTokenSessions.reduce(
            (acc, session) => acc + (session.metrics.firstTokenMs ?? 0),
            0
          ) / firstTokenSessions.length
      : undefined;

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <div className="container mx-auto px-6 pt-24 pb-16 space-y-8">
        <h1 className="text-3xl font-bold">Chat Quality Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard className="p-6">
            <div className="text-sm text-muted-foreground">Sessions</div>
            <div className="text-3xl font-semibold">{sessions.length}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="text-sm text-muted-foreground">Turns</div>
            <div className="text-3xl font-semibold">{totalTurns}</div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="text-sm text-muted-foreground">Tokens ≈</div>
            <div className="text-3xl font-semibold">{totalTokens}</div>
          </GlassCard>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard className="p-6">
            <div className="text-sm text-muted-foreground">Average CSAT</div>
            <div className="text-3xl font-semibold">
              {typeof csatAvg === "number" ? `${Math.round(csatAvg * 100)}%` : "—"}
            </div>
          </GlassCard>
          <GlassCard className="p-6">
            <div className="text-sm text-muted-foreground">Avg time to first token</div>
            <div className="text-3xl font-semibold">
              {formatMs(avgFirstTokenMs)}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-border font-medium">Last 20 sessions</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Turns</TableHead>
                <TableHead>Tokens≈</TableHead>
                <TableHead>First token</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>CSAT</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestSessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No sessions yet.
                  </TableCell>
                </TableRow>
              )}
              {latestSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{formatDate(session.startedAt)}</TableCell>
                  <TableCell>{session.source}</TableCell>
                  <TableCell>{session.metrics.turns}</TableCell>
                  <TableCell>{session.metrics.tokens}</TableCell>
                  <TableCell>{formatMs(session.metrics.firstTokenMs)}</TableCell>
                  <TableCell>{formatMs(session.metrics.sessionLengthMs)}</TableCell>
                  <TableCell>
                    {typeof session.metrics.rating === "number"
                      ? session.metrics.rating > 0.5
                        ? "👍"
                        : "👎"
                      : "—"}
                  </TableCell>
                  <TableCell>{session.metrics.errorCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </GlassCard>
      </div>
    </div>
  );
}
