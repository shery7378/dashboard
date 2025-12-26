'use client';

import { Box, Typography, Chip } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

function WholesaleCatalogHeader() {
    return (
        <Box className="flex flex-col gap-2">
            <Box display="flex" alignItems="center" gap={2}>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    <FuseSvgIcon sx={{ fontSize: 32 }}>
                        heroicons-outline:building-storefront
                    </FuseSvgIcon>
                </Box>
                <Box flex={1}>
                    <Typography variant="h4" fontWeight="bold">
                        Wholesale Catalog
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Browse and import products from suppliers. Inventory sync enabled automatically.
                    </Typography>
                </Box>
                <Chip
                    label="Vendor Only"
                    color="primary"
                    icon={<FuseSvgIcon>heroicons-outline:lock-closed</FuseSvgIcon>}
                />
            </Box>
        </Box>
    );
}

export default WholesaleCatalogHeader;

