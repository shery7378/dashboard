import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

type DatePoint = { x: string; y: number };

type VisitorsOverviewWidgetType = {
	ranges: Record<string, string>;
	series: Record<string, { name: string; data: DatePoint[] }[]>;
};

type SimpleSeriesWidget = {
	amount: number;
	labels: string[];
	series: { name: string; data: number[] }[];
};

type VisitorsVsPageViewsType = {
	overallScore: number;
	averageRatio: number;
	predictedRatio: number;
	series: { name: string; data: DatePoint[] }[];
};

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

// ─── Server-side in-memory cache ─────────────────────────────────────────────
// Caches the expensive GA4 response for CACHE_TTL_MS (10 min) so navigating
// between pages or refreshing the browser doesn't fire 6 more GA4 requests.
let _cache: { data: AnalyticsDashboardResponse; ts: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isCacheValid() {
	return _cache !== null && Date.now() - _cache.ts < CACHE_TTL_MS;
}
// ─────────────────────────────────────────────────────────────────────────────

function getClientFromEnv() {
	const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
	const propertyId = process.env.GA4_PROPERTY_ID;

	if (!propertyId) throw new Error('GA4_PROPERTY_ID env is required (e.g., properties/511050543)');
	if (!credsJson) throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON env is required');

	const creds = JSON.parse(credsJson);
	const client = new BetaAnalyticsDataClient({
		credentials: {
			client_email: creds.client_email,
			private_key: creds.private_key
		}
	});

	return { client, propertyId } as const;
}

function yyyymmddToISO(dateStr: string) {
	const y = dateStr.slice(0, 4);
	const m = dateStr.slice(4, 6);
	const d = dateStr.slice(6, 8);
	return `${y}-${m}-${d}`;
}

export async function GET(_req: NextRequest) {
	// ── Serve from cache if fresh ───────────────────────────────────────────
	if (isCacheValid() && _cache) {
		return NextResponse.json(_cache.data, {
			status: 200,
			headers: {
				'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
				'X-Cache': 'HIT'
			}
		});
	}

	try {
		const { client, propertyId } = getClientFromEnv();

		// ── Run ALL 6 GA4 queries in PARALLEL instead of sequentially ──────
		// Previously: 6 sequential awaits = ~6–24 s  →  Now: max 1 round-trip
		const [
			[dailyReport],
			[conversionsDaily],
			[nvrReport],
			[ageReport],
			[genderReport],
			[langReport]
		] = await Promise.all([
			// 1. Daily users, sessions, page-views (28 days)
			client.runReport({
				property: propertyId,
				dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
				dimensions: [{ name: 'date' }],
				metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
				orderBys: [{ dimension: { dimensionName: 'date' } }]
			}),

			// 2. Conversions per day
			client.runReport({
				property: propertyId,
				dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
				dimensions: [{ name: 'date' }],
				metrics: [{ name: 'conversions' }],
				orderBys: [{ dimension: { dimensionName: 'date' } }]
			}),

			// 3. New vs Returning
			client.runReport({
				property: propertyId,
				dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
				dimensions: [{ name: 'newVsReturning' }],
				metrics: [{ name: 'totalUsers' }]
			}),

			// 4. Age brackets
			client.runReport({
				property: propertyId,
				dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
				dimensions: [{ name: 'userAgeBracket' }],
				metrics: [{ name: 'totalUsers' }],
				orderBys: [{ dimension: { dimensionName: 'userAgeBracket' } }]
			}),

			// 5. Gender
			client.runReport({
				property: propertyId,
				dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
				dimensions: [{ name: 'userGender' }],
				metrics: [{ name: 'totalUsers' }]
			}),

			// 6. Language (top 10)
			client.runReport({
				property: propertyId,
				dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
				dimensions: [{ name: 'language' }],
				metrics: [{ name: 'totalUsers' }],
				orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
				limit: 10
			})
		]);

		// ── Process daily report ────────────────────────────────────────────
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
		const predictedRatio = averageRatio;
		const overallScore = Math.min(1000, Math.max(0, Math.round(averageRatio * 5)));

		// ── Process conversions ─────────────────────────────────────────────
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

		// ── Process new vs returning ────────────────────────────────────────
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

		// ── Process age ─────────────────────────────────────────────────────
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

		// ── Process gender ──────────────────────────────────────────────────
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

		// ── Process language ────────────────────────────────────────────────
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

		// ── Assemble response ───────────────────────────────────────────────
		const response: AnalyticsDashboardResponse = {
			visitors: {
				ranges: { last28Days: 'Last 28 days' },
				series: {
					last28Days: [{ name: 'Visitors', data: usersSeries }]
				}
			},
			visits: {
				amount: sessionsTotal,
				labels: dates,
				series: [{ name: 'Sessions', data: sessionsSeries }]
			},
			impressions: {
				amount: viewsTotal,
				labels: dates,
				series: [{ name: 'Views', data: viewsSeries }]
			},
			conversions: {
				amount: convTotal,
				labels: convLabels,
				series: [{ name: 'Conversions', data: convSeriesData }]
			},
			visitorsVsPageViews: {
				overallScore,
				averageRatio,
				predictedRatio,
				series: [
					{ name: 'Visitors', data: usersSeries },
					{ name: 'Page Views', data: viewsSeriesPts }
				]
			},
			newVsReturning: { uniqueVisitors: nvrTotal, labels: nvrLabels, series: nvrSeries },
			age: { uniqueVisitors: ageTotal, labels: ageLabels, series: ageSeries },
			gender: { uniqueVisitors: genderTotal, labels: genderLabels, series: genderSeries },
			language: { uniqueVisitors: langTotal, labels: langLabels, series: langSeries }
		};

		// ── Store in server-side cache ──────────────────────────────────────
		_cache = { data: response, ts: Date.now() };

		return NextResponse.json(response, {
			status: 200,
			headers: {
				// Tell browser / CDN to cache for 10 min, serve stale for 1 min while revalidating
				'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
				'X-Cache': 'MISS'
			}
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'GA4 error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
