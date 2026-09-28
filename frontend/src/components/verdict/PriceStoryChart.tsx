import { useMemo, useState } from "react";
import { cx } from "../../lib/cn";

/**
 * Price Story: the past (real series), today (spot benchmark) and the next
 * 30 days (ARIMA quantile band). No dated series endpoint exists, so history
 * is plotted by index from GlobalMetrics.series.freight and the forecast is
 * projected as 30 evenly spaced points. Colours follow the house rule:
 * Forest Ink = actual, Charcoal dashed = forecast, Lime never appears in a chart.
 */
export interface PriceStoryChartProps {
  /** Historical freight rates (index-ordered, oldest first). */
  history: number[];
  /** Today's benchmark spot rate, $/ton. */
  todayRate: number;
  forecast: { p10: number; p50: number; p90: number };
  /** Shaded cheapest-window band, in forecast-day indexes (0 = today). */
  windowStartDay?: number;
  windowEndDay?: number;
  className?: string;
}

const W = 720;
const H = 260;
const PAD = { top: 24, right: 16, bottom: 28, left: 44 };
const FORECAST_DAYS = 30;

export function PriceStoryChart({
  history,
  todayRate,
  forecast,
  windowStartDay = 0,
  windowEndDay = FORECAST_DAYS,
  className,
}: PriceStoryChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const series = useMemo(() => {
    const past = history.length ? history : [todayRate];
    const forecastMedian = Array.from(
      { length: FORECAST_DAYS },
      (_, i) => todayRate + ((forecast.p50 - todayRate) * (i + 1)) / FORECAST_DAYS,
    );
    const all = [...past, ...forecastMedian];
    const min = Math.min(...all, forecast.p10) * 0.97;
    const max = Math.max(...all, forecast.p90) * 1.03;
    const count = all.length;

    const x = (i: number) => PAD.left + (i / Math.max(count - 1, 1)) * (W - PAD.left - PAD.right);
    const y = (v: number) => PAD.top + (1 - (v - min) / Math.max(max - min, 0.01)) * (H - PAD.top - PAD.bottom);

    const line = (values: number[], offset: number) =>
      values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i + offset).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

    return { past, forecastMedian, x, y, line };
  }, [history, todayRate, forecast]);

  const { past, forecastMedian, x, y, line } = series;
  const todayIndex = past.length - 1;
  // The payload gives one quantile per horizon, not a curve, so the p10/p90
  // band is projected linearly from today out to the 30-day horizon.
  const bandTop = Array.from(
    { length: FORECAST_DAYS },
    (_, i) => todayRate + ((forecast.p90 - todayRate) * (i + 1)) / FORECAST_DAYS,
  );
  const bandBottom = Array.from(
    { length: FORECAST_DAYS },
    (_, i) => todayRate + ((forecast.p10 - todayRate) * (i + 1)) / FORECAST_DAYS,
  );

  const hoverValue =
    hoverIndex === null ? null : hoverIndex <= todayIndex ? past[hoverIndex] : forecastMedian[hoverIndex - past.length];
  const hoverIsForecast = hoverIndex !== null && hoverIndex > todayIndex;
  const hoverOffsetDays = hoverIndex === null ? 0 : Math.max(hoverIndex - todayIndex, 0);
  const hoverDate = new Date();
  hoverDate.setDate(hoverDate.getDate() + hoverOffsetDays);

  const formatRate = (v: number) => `$${v.toFixed(2)}/ton`;
  const avgDelta = past.length > 1 ? ((past[past.length - 1] - past[0]) / past[0]) * 100 : 0;
  const lowestForecast = Math.min(...forecastMedian);

  return (
    <figure className={cx("rounded-card border border-pebble bg-paper p-4", className)}>
      <figcaption className="mb-1 text-sm font-semibold text-forest-ink">Price story</figcaption>
      <p className="mb-3 text-xs text-charcoal">
        Rates moved {avgDelta >= 0 ? "up" : "down"} {Math.abs(avgDelta).toFixed(1)}% over the last {past.length} days.
        The lowest forecast point is {formatRate(lowestForecast)}, about{" "}
        {formatRate(Math.abs(todayRate - lowestForecast))} {lowestForecast <= todayRate ? "below" : "above"} today's{" "}
        {formatRate(todayRate)}.
      </p>

      {/* Screen-reader summary — the chart itself is decorative. */}
      <p className="sr-only">
        Prices moved {avgDelta >= 0 ? "up" : "down"} {Math.abs(avgDelta).toFixed(1)} percent over the last{" "}
        {past.length} days. Forecast lowest point is {formatRate(lowestForecast)}; today is {formatRate(todayRate)}.
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="presentation"
        aria-hidden="true"
        className="w-full"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="price-history-wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#163300" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#163300" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Cheapest-window band */}
        {windowEndDay > windowStartDay && (
          <rect
            x={x(todayIndex + windowStartDay)}
            y={PAD.top}
            width={Math.max(x(todayIndex + windowEndDay) - x(todayIndex + windowStartDay), 2)}
            height={H - PAD.top - PAD.bottom}
            fill="#e2f6d5"
            opacity="0.85"
          />
        )}

        {/* Grid */}
        <g stroke="#868685" strokeWidth="1" strokeDasharray="2 6" opacity="0.7">
          <line x1={PAD.left} y1={PAD.top} x2={W - PAD.right} y2={PAD.top} />
          <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} />
        </g>

        {/* Forecast p10–p90 band */}
        <polygon
          points={`${bandTop
            .map((value, i) => `${x(todayIndex + i + 1)},${y(value)}`)
            .join(" ")} ${[...bandBottom]
            .reverse()
            .map((value, i) => `${x(todayIndex + FORECAST_DAYS - i)},${y(value)}`)
            .join(" ")}`}
          fill="#454745"
          opacity="0.08"
        />

        {/* History area + line */}
        <path
          d={`${line(past, 0)} L${x(todayIndex)},${H - PAD.bottom} L${x(0)},${H - PAD.bottom} Z`}
          fill="url(#price-history-wash)"
        />
        <path d={line(past, 0)} fill="none" stroke="#163300" strokeWidth="2" strokeLinecap="round" />

        {/* Forecast line — dashed, never colour-only differentiation */}
        <path
          d={line(forecastMedian, todayIndex + 1)}
          fill="none"
          stroke="#454745"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />

        {/* Today marker */}
        <line
          x1={x(todayIndex)}
          y1={PAD.top}
          x2={x(todayIndex)}
          y2={H - PAD.bottom}
          stroke="#868685"
          strokeWidth="1"
        />
        <circle cx={x(todayIndex)} cy={y(todayRate)} r="4" fill="#163300" />
        <text x={x(todayIndex)} y={PAD.top - 8} textAnchor="middle" className="fill-charcoal text-[10px]">
          today
        </text>

        {/* Hover hit-area + marker */}
        {past.concat(forecastMedian).map((_, i) => (
          <rect
            key={i}
            x={x(i) - 6}
            y={PAD.top}
            width="12"
            height={H - PAD.top - PAD.bottom}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}
        {hoverIndex !== null && hoverValue !== null && (
          <>
            <line
              x1={x(hoverIndex)}
              y1={PAD.top}
              x2={x(hoverIndex)}
              y2={H - PAD.bottom}
              stroke="#163300"
              strokeWidth="1"
            />
            <circle cx={x(hoverIndex)} cy={y(hoverValue)} r="4" fill="#163300" />
          </>
        )}
      </svg>

      <div aria-live="polite" className="mt-2 min-h-5 font-mono text-xs text-charcoal">
        {hoverIndex !== null && hoverValue !== null
          ? `${hoverDate.toLocaleDateString("en-GB", { month: "short", day: "numeric" })} · ${formatRate(hoverValue)} · ${
              hoverIsForecast ? "forecast" : "actual"
            }`
          : "Hover the chart to read any day's rate."}
      </div>
    </figure>
  );
}

export default PriceStoryChart;
