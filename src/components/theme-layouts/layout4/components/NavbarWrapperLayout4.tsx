import { ThemeProvider } from '@mui/material/styles';
import { useEffect } from 'react';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { navbarCloseMobile, selectFuseNavbar } from 'src/components/theme-layouts/components/navbar/navbarSlice';
import usePathname from '@fuse/hooks/usePathname';
import useFuseLayoutSettings from '@fuse/core/FuseLayout/useFuseLayoutSettings';
import { useNavbarTheme } from '@fuse/core/FuseSettings/hooks/fuseThemeHooks';
import NavbarToggleFabLayout4 from './NavbarToggleFabLayout4';
import NavbarStyle1 from './navbar/style-1/NavbarStyle1';
import NavbarStyle2 from './navbar/style-2/NavbarStyle2';
import NavbarStyle3 from './navbar/style-3/NavbarStyle3';

/**
 * The navbar wrapper layout 4.
 */
function NavbarWrapperLayout4() {
	const { config } = useFuseLayoutSettings();

	const navbar = useAppSelector(selectFuseNavbar);
	const pathname = usePathname();

	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (isMobile) {
			dispatch(navbarCloseMobile());
		}
	}, [dispatch, pathname, isMobile]);

	const navbarTheme = useNavbarTheme();

	return (
		<>
			<ThemeProvider theme={navbarTheme}>
				<>
					{config.navbar.style === 'style-1' && <NavbarStyle1 />}
					{config.navbar.style === 'style-2' && <NavbarStyle2 />}
					{config.navbar.style === 'style-3' && <NavbarStyle3 />}
					{config.navbar.style === 'style-3-dense' && <NavbarStyle3 dense />}
				</>
			</ThemeProvider>
			{config.navbar.display && !config.toolbar.display && !navbar.open && <NavbarToggleFabLayout4 />}
		</>
	);
}

export default NavbarWrapperLayout4;
