import { useAppDispatch } from 'src/store/hooks';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import { navbarToggle, navbarToggleMobile } from 'src/components/theme-layouts/components/navbar/navbarSlice';
import NavbarToggleFab from 'src/components/theme-layouts/components/navbar/NavbarToggleFab';
import useFuseLayoutSettings from '@fuse/core/FuseLayout/useFuseLayoutSettings';
import { Layout4ConfigDefaultsType } from '../Layout4Config';

type NavbarToggleFabLayout4Props = {
	className?: string;
};

/**
 * The navbar toggle fab layout 4.
 */
function NavbarToggleFabLayout4(props: NavbarToggleFabLayout4Props) {
	const { className } = props;

	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const settings = useFuseLayoutSettings();
	const config = settings.config as Layout4ConfigDefaultsType;

	const dispatch = useAppDispatch();

	return (
		<NavbarToggleFab
			className={className}
			onClick={() => {
				dispatch(isMobile ? navbarToggleMobile() : navbarToggle());
			}}
			position={config.navbar.position}
		/>
	);
}

export default NavbarToggleFabLayout4;
