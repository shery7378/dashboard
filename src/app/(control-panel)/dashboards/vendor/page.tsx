import { redirect } from 'next/navigation';

export default function VendorDashboardRedirect() {
    redirect('/dashboards/seller');
}
