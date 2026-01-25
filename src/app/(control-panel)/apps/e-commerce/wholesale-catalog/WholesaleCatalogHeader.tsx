'use client';

import { Box, Typography, Chip, alpha, useTheme } from '@mui/material';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

function WholesaleCatalogHeader() {
    const theme = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Box
                sx={{
                    p: 4,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    border: '2px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        backdropFilter: 'blur(10px)',
                    },
                }}
            >
                <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={3}
                    position="relative"
                    zIndex={1}
                    flexWrap="wrap"
                >
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: 4,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                                border: '3px solid',
                                borderColor: alpha(theme.palette.common.white, 0.3),
                            }}
                        >
                            <FuseSvgIcon sx={{ fontSize: 40 }}>
                                heroicons-outline:building-storefront
                            </FuseSvgIcon>
                        </Box>
                    </motion.div>
                    <Box flex={1} minWidth={200}>
                        <Typography 
                            variant="h3" 
                            fontWeight={900}
                            sx={{
                                mb: 1,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                            }}
                        >
                            Wholesale Catalog
                        </Typography>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                color: 'text.secondary',
                                fontWeight: 500,
                                fontSize: '1rem',
                            }}
                        >
                            Discover premium products from trusted suppliers. Import with one click and let our smart inventory sync keep your stock updated automatically.
                        </Typography>
                    </Box>
                    <Chip
                        label={
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <FuseSvgIcon sx={{ fontSize: 16 }}>heroicons-outline:lock-closed</FuseSvgIcon>
                                vendor Only
                            </Box>
                        }
                        sx={{
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                            border: '2px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            color: 'primary.main',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            height: 40,
                            px: 1,
                        }}
                    />
                </Box>
            </Box>
        </motion.div>
    );
}

export default WholesaleCatalogHeader;

