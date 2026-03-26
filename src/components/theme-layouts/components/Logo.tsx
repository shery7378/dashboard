import Image from 'next/image';
import { styled } from '@mui/material/styles';

const Root = styled('div')(({ theme }) => ({
	'& > .logo-icon': {
		transition: theme.transitions.create(['width', 'height'], {
			duration: theme.transitions.duration.shortest,
			easing: theme.transitions.easing.easeInOut
		})
	},
	'& > .badge': {
		transition: theme.transitions.create('opacity', {
			duration: theme.transitions.duration.shortest,
			easing: theme.transitions.easing.easeInOut
		})
	}
}));

/**
 * The logo component.
 */
function Logo() {
	return (
		<Root className="flex flex-1 items-center space-x-3">
			<div className="flex flex-1 items-center space-x-2 px-2.5">
				<Image
					className="logo-icon"
					src="/assets/images/MultiKonnect.svg"
					alt="MultiKonnect Logo"
					height={40}
					width={137}
					style={{
						objectFit: 'contain'
					}}
				/>
			</div>
		</Root>
	);
}

export default Logo;
