import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import Card from '../ui/Card';
import {
  PremiumTooltip,
  CHART_GRID_SOFT,
  CHART_AXIS_TICK,
  CHART_MARGIN_COMPACT,
  PREMIUM_GRADIENT_PAIRS,
  RechartsViewport,
  PremiumChartMeshBackground,
  ChartDropShadowFilter,
} from '../charts';

interface Grade {
  id: string;
  score: number;
  maxScore: number;
  date: string;
  course: {
    name: string;
  };
  evaluationType: string;
}

interface GradesChartProps {
  grades: Grade[];
}

const GradesChart: React.FC<GradesChartProps> = ({ grades }) => {
  const chartData = useMemo(() => {
    const courseGroups: Record<string, Grade[]> = {};

    grades.forEach((grade) => {
      const courseName = grade.course.name;
      if (!courseGroups[courseName]) {
        courseGroups[courseName] = [];
      }
      courseGroups[courseName].push(grade);
    });

    const allDates = new Set<string>();
    grades.forEach((grade) => {
      allDates.add(new Date(grade.date).toLocaleDateString('fr-FR'));
    });

    const sortedDates = Array.from(allDates).sort(
      (a, b) =>
        new Date(a.split('/').reverse().join('-')).getTime() -
        new Date(b.split('/').reverse().join('-')).getTime()
    );

    return sortedDates.map((date) => {
      const dataPoint: Record<string, string | number> = { date };
      Object.keys(courseGroups).forEach((courseName) => {
        const courseGrades = courseGroups[courseName].filter(
          (g) => new Date(g.date).toLocaleDateString('fr-FR') === date
        );
        if (courseGrades.length > 0) {
          const average =
            courseGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 20, 0) / courseGrades.length;
          dataPoint[courseName] = parseFloat(average.toFixed(2));
        }
      });
      return dataPoint;
    });
  }, [grades]);

  if (grades.length === 0) {
    return (
      <Card className="border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80">
        <div className="py-16 text-center text-slate-500">
          <p className="font-medium">Aucune note disponible pour afficher le graphique</p>
        </div>
      </Card>
    );
  }

  const courses = Array.from(new Set(grades.map((g) => g.course.name)));

  return (
    <Card
      variant="premium"
      hover={false}
      className="relative overflow-hidden !p-0 border border-white/80 bg-gradient-to-br from-white via-indigo-50/15 to-violet-50/25 shadow-[0_24px_48px_-20px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5"
    >
      <PremiumChartMeshBackground />
      <div className="relative p-6">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight text-slate-900">Évolution des notes</h3>
            <p className="mt-1 text-sm text-slate-500">
              Moyennes par matière et par date — repères 10/20 et 16/20
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-md shadow-indigo-500/25">
            Suivi pédagogique
          </span>
        </div>
        <div className="relative z-[1] rounded-2xl border border-slate-100/90 bg-white/70 p-4 backdrop-blur-md min-w-0 shadow-inner shadow-slate-900/5">
          <RechartsViewport height={420}>
            <LineChart data={chartData} margin={{ ...CHART_MARGIN_COMPACT, top: 8, bottom: 8 }}>
              <ChartDropShadowFilter id="grades-line-glow" />
              <defs>
                {courses.map((_, i) => {
                  const [c0, c1] = PREMIUM_GRADIENT_PAIRS[i % PREMIUM_GRADIENT_PAIRS.length];
                  return (
                    <linearGradient key={i} id={`gradeStroke-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={c0} />
                      <stop offset="100%" stopColor={c1} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid {...CHART_GRID_SOFT} />
              <XAxis
                dataKey="date"
                tick={CHART_AXIS_TICK}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 20]}
                tick={CHART_AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                y={10}
                stroke="#f59e0b"
                strokeDasharray="6 6"
                strokeOpacity={0.85}
                label={{ value: '10', position: 'insideTopLeft', fill: '#d97706', fontSize: 10, fontWeight: 700 }}
              />
              <ReferenceLine
                y={16}
                stroke="#10b981"
                strokeDasharray="6 6"
                strokeOpacity={0.85}
                label={{ value: '16', position: 'insideTopLeft', fill: '#059669', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip content={(p) => <PremiumTooltip {...p} valueSuffix="/20" />} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm font-semibold text-slate-600">{value}</span>
                )}
              />
              {courses.map((course, index) => (
                <Line
                  key={course}
                  type="monotone"
                  dataKey={course}
                  stroke={`url(#gradeStroke-${index})`}
                  strokeWidth={3.5}
                  dot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: PREMIUM_GRADIENT_PAIRS[index % PREMIUM_GRADIENT_PAIRS.length][0] }}
                  activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
                  style={{ filter: 'url(#grades-line-glow)' }}
                />
              ))}
            </LineChart>
          </RechartsViewport>
        </div>
      </div>
    </Card>
  );
};

export default GradesChart;
