import { TriangleAlert } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { cn, formatCompact, formatDate, formatNumber, formatPercent, formatShortDate, formatSigned } from '../lib/format';
import { colors } from '../lib/theme';
import type { WeekPoint } from '../lib/training';

interface TrainingLoadChartProps {
  points: WeekPoint[];
  averageWeeklyLoad: number;
}

export function TrainingLoadChart({ points, averageWeeklyLoad }: TrainingLoadChartProps) {
  return (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 20, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={colors.line} />
          <XAxis
            dataKey="weekStart"
            tickFormatter={formatShortDate}
            tick={{ fill: colors.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: colors.lineStrong }}
            minTickGap={12}
            interval="preserveStartEnd"
            tickMargin={8}
          />
          <YAxis
            tickFormatter={(v: number) => formatCompact(v)}
            tick={{ fill: colors.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          {averageWeeklyLoad > 0 && (
            <ReferenceLine
              y={averageWeeklyLoad}
              stroke={colors.subtle}
              strokeDasharray="4 4"
              label={{
                value: 'avg',
                position: 'insideTopLeft',
                fill: colors.muted,
                fontSize: 10,
              }}
            />
          )}
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={(props) => <LoadTooltip {...props} />}
            isAnimationActive={false}
          />
          <Bar dataKey="weeklyLoad" name="Weekly load" radius={[4, 4, 0, 0]} maxBarSize={44} animationDuration={500}>
            {points.map((p) => (
              <Cell key={p.weekStart} fill={p.isSpike ? colors.warn : colors.accent} />
            ))}
            <LabelList
              dataKey="isSpike"
              position="top"
              content={(props) => {
                const { x, y, width, value } = props;
                if (!value) return null;
                const cx = Number(x) + Number(width) / 2;
                const top = Number(y) - 6;
                return (
                  <path
                    d={`M${cx - 4.5} ${top} L${cx + 4.5} ${top} L${cx} ${top - 7} Z`}
                    fill={colors.warn}
                    aria-hidden
                  />
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LoadTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as WeekPoint;
  const change = point.changeFromLastWeek;

  return (
    <div className="min-w-52 rounded-xl border border-line-strong bg-surface-2/95 p-3 text-[13px] shadow-xl shadow-black/50 backdrop-blur">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
        Week of {formatDate(point.weekStart)}
      </p>
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span className={cn('text-2xl font-bold tabular-nums', point.isSpike ? 'text-warn' : 'text-accent')}>
          {formatNumber(point.weeklyLoad)}
        </span>
        <span className="text-xs text-muted">AU load</span>
      </p>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 tabular-nums">
        <dt className="text-muted">Sessions</dt>
        <dd className="text-right text-fg">{formatNumber(point.sessions)}</dd>
        <dt className="text-muted">Total minutes</dt>
        <dd className="text-right text-fg">{formatNumber(point.totalMinutes)}</dd>
        <dt className="text-muted">vs last week</dt>
        <dd className={cn('text-right', point.isSpike ? 'text-warn' : 'text-fg')}>
          {change === null ? (
            '—'
          ) : (
            <>
              {formatSigned(change)}
              {point.changeRatio !== null && (
                <span className="ml-1 text-muted">({formatPercent(point.changeRatio)})</span>
              )}
            </>
          )}
        </dd>
      </dl>
      {point.isSpike && (
        <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-warn/10 px-2 py-1.5 text-xs font-medium text-warn">
          <TriangleAlert className="size-3.5" aria-hidden />
          Load spike — over 30% above last week
        </p>
      )}
    </div>
  );
}

/** Accessible tabular alternative to the chart. */
export function TrainingLoadTable({ points }: { points: WeekPoint[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <caption className="sr-only">Weekly training load</caption>
        <thead>
          <tr className="border-b border-line text-left text-[11px] tracking-[0.12em] text-muted uppercase">
            <th scope="col" className="py-2.5 pr-4 font-semibold">Week of</th>
            <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Sessions</th>
            <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Minutes</th>
            <th scope="col" className="py-2.5 pr-4 text-right font-semibold">Load</th>
            <th scope="col" className="py-2.5 text-right font-semibold">Change</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.weekStart} className="border-b border-line/60 last:border-0">
              <th scope="row" className="py-2.5 pr-4 text-left font-normal text-fg">
                {formatDate(p.weekStart)}
              </th>
              <td className="py-2.5 pr-4 text-right text-muted">{formatNumber(p.sessions)}</td>
              <td className="py-2.5 pr-4 text-right text-muted">{formatNumber(p.totalMinutes)}</td>
              <td className="py-2.5 pr-4 text-right font-medium text-fg">{formatNumber(p.weeklyLoad)}</td>
              <td className={cn('py-2.5 text-right whitespace-nowrap', p.isSpike ? 'text-warn' : 'text-muted')}>
                {p.isSpike && <TriangleAlert className="mr-1 inline size-3.5 align-[-2px]" aria-label="Spike" />}
                {p.changeFromLastWeek === null
                  ? '—'
                  : p.changeRatio !== null
                    ? formatPercent(p.changeRatio)
                    : formatSigned(p.changeFromLastWeek)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
