import { redirect } from 'next/navigation';

export default function vendorAnalyticsRedirect() {
    redirect('/dashboards/seller-analytics');
}
