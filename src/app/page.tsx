import { redirect } from 'next/navigation';

function MainPage() {
	redirect(`/dashboards`);
	return null;
}

export default MainPage;
