import { redirect } from 'next/navigation';

export default function vendorDashboardRedirect() {
    redirect('/dashboards/seller');
}
