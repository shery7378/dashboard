'use client';

import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import MessagesAppHeader from './MessagesAppHeader';
import MessagesAppContent from './MessagesAppContent';

const Root = styled(FusePageCarded)(({ theme }) => ({
	'& .FusePageCarded-header': {
		minHeight: 72,
		height: 72,
		[theme.breakpoints.down('lg')]: {
			minHeight: 72,
			height: 72
		}
	}
}));

function MessagesApp() {
	return (
		<Root
			header={<MessagesAppHeader />}
			content={<MessagesAppContent />}
			scroll="content"
		/>
	);
}

export default MessagesApp;
