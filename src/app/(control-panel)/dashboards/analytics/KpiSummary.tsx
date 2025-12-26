"use client";

import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import { useAppSelector } from "src/store/hooks";
import { selectWidget } from "./AnalyticsDashboardApi";
import VisitorsOverviewWidgetType from "./widgets/types/VisitorsOverviewWidgetType";
import VisitsWidgetType from "./widgets/types/VisitsWidgetType";
import ConversionsWidgetType from "./widgets/types/ConversionsWidgetType";

function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.floor(n || 0)));
}

function calcVisitorsTotal(widget?: VisitorsOverviewWidgetType) {
  if (!widget) return 0;
  const firstRangeKey = Object.keys(widget.ranges || {})[0];
  const series = widget.series?.[firstRangeKey]?.[0]?.data || [];
  return series.reduce((sum, p) => sum + (p?.y || 0), 0);
}

export default function KpiSummary() {
  const visitors = useAppSelector(selectWidget<VisitorsOverviewWidgetType>("visitors"));
  const visits = useAppSelector(selectWidget<VisitsWidgetType>("visits"));
  const impressions = useAppSelector(selectWidget<VisitsWidgetType>("impressions"));
  const conversions = useAppSelector(selectWidget<ConversionsWidgetType>("conversions"));

  const totalVisitors = calcVisitorsTotal(visitors);
  const totalSessions = visits?.amount ?? 0;
  const totalViews = impressions?.amount ?? 0;
  const totalConversions = conversions?.amount ?? 0;

  const items = [
    {
      label: "Users",
      value: formatNumber(totalVisitors),
      color: "#6366f1",
      bg: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))",
      bar: (totalVisitors % 100) || 40,
    },
    {
      label: "Sessions",
      value: formatNumber(totalSessions),
      color: "#06b6d4",
      bg: "linear-gradient(135deg, rgba(6,182,212,0.18), rgba(6,182,212,0.06))",
      bar: (totalSessions % 100) || 55,
    },
    {
      label: "Page Views",
      value: formatNumber(totalViews),
      color: "#22c55e",
      bg: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.06))",
      bar: (totalViews % 100) || 70,
    },
    {
      label: "Conversions",
      value: formatNumber(totalConversions),
      color: "#f97316",
      bg: "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(249,115,22,0.06))",
      bar: (totalConversions % 100) || 20,
    },
  ];

  return (
    <Grid container spacing={3} sx={{ px: { xs: 2, md: 3 } }}>
      {items.map((kpi) => (
        <Grid key={kpi.label} item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 3,
              background: kpi.bg,
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.4)}`,
              transition: "transform 180ms ease, box-shadow 180ms ease",
              ":hover": {
                transform: "translateY(-2px)",
                boxShadow: (theme) => `0 10px 30px ${alpha(theme.palette.common.black, 0.12)}`,
              },
            }}
          >
            <Typography variant="body2" sx={{ color: (t) => alpha(t.palette.text.primary, 0.7) }}>
              {kpi.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
              {kpi.value}
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, kpi.bar)}
                sx={{
                  height: 8,
                  borderRadius: 6,
                  backgroundColor: (t) => alpha(t.palette.common.black, 0.06),
                  "& .MuiLinearProgress-bar": { backgroundColor: kpi.color, borderRadius: 6 },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
