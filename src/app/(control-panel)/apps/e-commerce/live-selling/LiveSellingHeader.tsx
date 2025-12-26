'use client';

import { Button } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';

interface LiveSellingHeaderProps {
    onCreateSession: () => void;
}

function LiveSellingHeader({ onCreateSession }: LiveSellingHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between py-32 px-24 md:px-32 border-b">
            <div className="flex flex-col">
                <Typography className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    Live Selling
                </Typography>
                <Typography className="mt-8 text-md font-medium text-secondary">
                    Create and manage your live selling sessions
                </Typography>
            </div>
            <div className="flex flex-col sm:flex-row gap-12 w-full sm:w-auto sm:min-w-240 mt-16 sm:mt-0">
                <Button
                    className="whitespace-nowrap"
                    variant="contained"
                    color="primary"
                    startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
                    onClick={onCreateSession}
                >
                    Create Session
                </Button>
            </div>
        </div>
    );
}

export default LiveSellingHeader;

