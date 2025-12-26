import { NextRequest } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

type DatePoint = { x: string; y: number };

type VisitorsOverviewWidgetType = {
  ranges: Record<string, string>;
  series: Record<string, Array<{ name: string; data: DatePoint[] }>>;
};

type SimpleSeriesWidget = {
  amount: number;
  labels: string[];
  series: Array<{ name: string; data: number[] }>;
};

type VisitorsVsPageViewsType = {
  overallScore: number;
  averageRatio: number;
  predictedRatio: number;
  series: Array<{ name: string; data: DatePoint[] }>;
};

// Additional widget types to match existing UI contracts
type NewVsReturningWidgetType = {
  uniqueVisitors: number;
  series: number[];
  labels: string[];
};

type DemographicWidgetType = {
  uniqueVisitors: number;
  series: number[];
  labels: string[];
};

type AnalyticsDashboardResponse = Partial<
  Record<
    string,
    | VisitorsOverviewWidgetType
    | SimpleSeriesWidget
    | VisitorsVsPageViewsType
    | NewVsReturningWidgetType
    | DemographicWidgetType
  >
>;

function getClientFromEnv() {
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!propertyId) throw new Error('GA4_PROPERTY_ID env is required (e.g., properties/511050543)');
  if (!credsJson) throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON env is required');

  const creds = JSON.parse(credsJson);
  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
  });

  return { client, propertyId } as const;
}

function yyyymmddToISO(dateStr: string) {
  // GA returns date as YYYYMMDD; convert to YYYY-MM-DD
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return `${y}-${m}-${d}`;
}

export async function GET(_req: NextRequest) {
  try {
    const { client, propertyId } = getClientFromEnv();

    // Daily users, sessions, page views (last 28 days)
    const [dailyReport] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    const dates: string[] = [];
    const usersSeries: DatePoint[] = [];
    const sessionsSeries: number[] = [];
    const viewsSeries: number[] = [];
    const viewsSeriesPts: DatePoint[] = [];
    let usersTotal = 0;
    let sessionsTotal = 0;
    let viewsTotal = 0;

    for (const row of dailyReport.rows ?? []) {
      const dateStr = row.dimensionValues?.[0]?.value ?? '';
      const iso = yyyymmddToISO(dateStr);
      const users = Number(row.metricValues?.[0]?.value ?? 0);
      const sessions = Number(row.metricValues?.[1]?.value ?? 0);
      const views = Number(row.metricValues?.[2]?.value ?? 0);

      dates.push(iso);
      usersSeries.push({ x: iso, y: users });
      sessionsSeries.push(sessions);
      viewsSeries.push(views);
      viewsSeriesPts.push({ x: iso, y: views });

      usersTotal += users;
      sessionsTotal += sessions;
      viewsTotal += views;
    }

    const averageRatio = usersTotal > 0 ? Math.round((viewsTotal / usersTotal) * 100) : 0;
    const predictedRatio = averageRatio; // placeholder
    const overallScore = Math.min(1000, Math.max(0, Math.round(averageRatio * 5))); // arbitrary scoring

    // Conversions by date (last 28 days)
    const [conversionsDaily] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'conversions' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    const convLabels: string[] = [];
    const convSeriesData: number[] = [];
    let convTotal = 0;
    for (const row of conversionsDaily.rows ?? []) {
      const d = yyyymmddToISO(row.dimensionValues?.[0]?.value ?? '');
      const c = Number(row.metricValues?.[0]?.value ?? 0);
      convLabels.push(d);
      convSeriesData.push(c);
      convTotal += c;
    }

    // New vs Returning (total users by segment, last 28 days)
    const [nvrReport] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'newVsReturning' }],
      metrics: [{ name: 'totalUsers' }],
    });

    const nvrLabels: string[] = [];
    const nvrSeries: number[] = [];
    let nvrTotal = 0;
    for (const row of nvrReport.rows ?? []) {
      const label = row.dimensionValues?.[0]?.value ?? '';
      const val = Number(row.metricValues?.[0]?.value ?? 0);
      nvrLabels.push(label);
      nvrSeries.push(val);
      nvrTotal += val;
    }

    // Demographics: Age, Gender (unique users). Note: may require Google signals/demographics enabled.
    const [ageReport] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'userAgeBracket' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'userAgeBracket' } }],
    });
    const ageLabels: string[] = [];
    const ageSeries: number[] = [];
    let ageTotal = 0;
    for (const row of ageReport.rows ?? []) {
      const label = row.dimensionValues?.[0]?.value ?? '';
      const val = Number(row.metricValues?.[0]?.value ?? 0);
      ageLabels.push(label);
      ageSeries.push(val);
      ageTotal += val;
    }

    const [genderReport] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'userGender' }],
      metrics: [{ name: 'totalUsers' }],
    });
    const genderLabels: string[] = [];
    const genderSeries: number[] = [];
    let genderTotal = 0;
    for (const row of genderReport.rows ?? []) {
      const label = row.dimensionValues?.[0]?.value ?? '';
      const val = Number(row.metricValues?.[0]?.value ?? 0);
      genderLabels.push(label);
      genderSeries.push(val);
      genderTotal += val;
    }

    // Language (by users)
    const [langReport] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'language' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 10,
    });
    const langLabels: string[] = [];
    const langSeries: number[] = [];
    let langTotal = 0;
    for (const row of langReport.rows ?? []) {
      const label = row.dimensionValues?.[0]?.value ?? '';
      const val = Number(row.metricValues?.[0]?.value ?? 0);
      langLabels.push(label);
      langSeries.push(val);
      langTotal += val;
    }

    const response: AnalyticsDashboardResponse = {
      // Visitors Overview (unique users daily)
      visitors: {
        ranges: { last28Days: 'Last 28 days' },
        series: {
          last28Days: [
            {
              name: 'Visitors',
              data: usersSeries,
            },
          ],
        },
      },
      // Sessions trend card
      visits: {
        amount: sessionsTotal,
        labels: dates,
        series: [
          { name: 'Sessions', data: sessionsSeries },
        ],
      },
      // Views trend card (as Impressions)
      impressions: {
        amount: viewsTotal,
        labels: dates,
        series: [
          { name: 'Views', data: viewsSeries },
        ],
      },
      // Conversions trend card
      conversions: {
        amount: convTotal,
        labels: convLabels,
        series: [
          { name: 'Conversions', data: convSeriesData },
        ],
      },
      // Visitors vs Page Views (two time series)
      visitorsVsPageViews: {
        overallScore,
        averageRatio,
        predictedRatio,
        series: [
          { name: 'Visitors', data: usersSeries },
          { name: 'Page Views', data: viewsSeriesPts },
        ],
      },
      // New vs Returning
      newVsReturning: {
        uniqueVisitors: nvrTotal,
        labels: nvrLabels,
        series: nvrSeries,
      },
      // Age
      age: {
        uniqueVisitors: ageTotal,
        labels: ageLabels,
        series: ageSeries,
      },
      // Gender
      gender: {
        uniqueVisitors: genderTotal,
        labels: genderLabels,
        series: genderSeries,
      },
      // Language
      language: {
        uniqueVisitors: langTotal,
        labels: langLabels,
        series: langSeries,
      },
    };

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'GA4 error' }), { status: 500 });
  }
}
