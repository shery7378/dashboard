'use client';

import { styled } from '@mui/material/styles';
import FuseMessage from '@fuse/core/FuseMessage';
import { memo, ReactNode } from 'react';
// import { Layout4ConfigDefaultsType } from 'src/components/theme-layouts/Layout4/Layout4Config';
import Configurator from 'src/components/theme-layouts/components/configurator/Configurator';
import useFuseLayoutSettings from '@fuse/core/FuseLayout/useFuseLayoutSettings';
import LeftSideLayout4 from './components/LeftSideLayout4';
import NavbarWrapperLayout4 from './components/NavbarWrapperLayout4';
import RightSideLayout4 from './components/RightSideLayout4';
import ToolbarLayout4 from './components/ToolbarLayout4';
import FuseDialog from '@fuse/core/FuseDialog';
import { Layout4ConfigDefaultsType } from './Layout4Config';
import NotificationPanel from '@/app/(control-panel)/apps/notifications/NotificationPanel';

const Root = styled('div')(({ config }: { config: Layout4ConfigDefaultsType }) => ({
	...(config.mode === 'boxed' && {
		clipPath: 'inset(0)',
		maxWidth: `${config.containerWidth}px`,
		margin: '0 auto',
		boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
	}),
	...(config.mode === 'container' && {
		'& .container': {
			maxWidth: `${config.containerWidth}px`,
			width: '100%',
			margin: '0 auto',
			'@media (min-width: 96rem)': {
				maxWidth: `${config.containerWidth}px!important`
			}
		}
	}),
	...(config.mode === 'fullwidth' && {
		'& .container': {
			maxWidth: '100%!important',
			width: '100%!important'
		}
	})
}));

type Layout4Props = {
	children?: ReactNode;
};

/**
 * The layout 4.
 */
function Layout4(props: Layout4Props) {
	const { children } = props;
	const settings = useFuseLayoutSettings();
	const config = settings.config as Layout4ConfigDefaultsType;

	return (
		<Root
			id="fuse-layout"
			config={config}
			className="flex flex-auto w-full"
		>
			{config.leftSidePanel.display && <LeftSideLayout4 />}

			<div className="flex min-w-0 flex-auto">
				{config.navbar.display && config.navbar.position === 'left' && <NavbarWrapperLayout4 />}

				<main
					id="fuse-main"
					className="relative z-10 flex min-h-full min-w-0 flex-auto flex-col"
				>
					{config.toolbar.display && (
						<ToolbarLayout4 className={config.toolbar.style === 'fixed' ? 'sticky top-0' : ''} />
					)}

					<div className="sticky top-0 z-99">
						<Configurator />
					</div>

					<div className="relative z-10 flex min-h-0 flex-auto flex-col">
						<FuseDialog />
						{children}
					</div>
				</main>

				{config.navbar.display && config.navbar.position === 'right' && <NavbarWrapperLayout4 />}
			</div>

			{config.rightSidePanel.display && <RightSideLayout4 />}
			{/* Always render NotificationPanel so it works regardless of rightSidePanel setting */}
			<NotificationPanel />
			<FuseMessage />
		</Root>
	);
}

export default memo(Layout4);
