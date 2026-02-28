import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useState } from 'react';
import { LanguageType } from '@i18n/I18nContext';
import useI18n from '@i18n/useI18n';

/**
 * The language switcher with modern design, smooth animations, and consistent flag sizing.
 */
function LanguageSwitcher() {
	const { language, languages, changeLanguage } = useI18n();

	const [menu, setMenu] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(menu);

	const langMenuClick = (event: React.MouseEvent<HTMLElement>) => {
		setMenu(event.currentTarget);
	};

	const langMenuClose = () => {
		setMenu(null);
	};

	function handleLanguageChange(lng: LanguageType) {
		changeLanguage(lng.id);
		langMenuClose();
	}

	return (
		<>
			{/* Modern Language Switcher Button */}
			<Button
				onClick={langMenuClick}
				sx={(theme) => ({
					display: 'flex',
					alignItems: 'center',
					gap: 1.25,
					padding: '8px 16px',
					borderRadius: '12px',
					backgroundColor: theme.palette.mode === 'light'
						? theme.palette.background.paper
						: theme.palette.background.default,
					border: `1.5px solid`,
					borderColor: theme.palette.mode === 'light'
						? theme.palette.divider
						: theme.palette.divider,
					color: theme.palette.text.primary,
					textTransform: 'none',
					fontWeight: 600,
					fontSize: '0.875rem',
					letterSpacing: '0.5px',
					transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					'&:hover': {
						backgroundColor: theme.palette.mode === 'light'
							? theme.palette.action.hover
							: theme.palette.action.hover,
						borderColor: theme.palette.primary.main,
						boxShadow: `0 4px 12px ${theme.palette.primary.main}20`,
						transform: 'translateY(-2px)'
					},
					'&:active': {
						transform: 'translateY(0)'
					}
				})}
			>
				{/* Flag Container - Fixed size for consistency */}
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 28,
						height: 21,
						borderRadius: '6px',
						overflow: 'hidden',
						backgroundColor: '#f5f5f5',
						border: '1px solid rgba(0, 0, 0, 0.1)',
						flexShrink: 0,
						'& img': {
							width: '100%',
							height: '100%',
							objectFit: 'cover',
							display: 'block'
						}
					}}
				>
					<img
						src={`/assets/images/flags/${language.flag}.svg`}
						alt={language.title}
						loading="lazy"
					/>
				</Box>

				{/* Language Code */}
				<Typography
					sx={{
						fontWeight: 700,
						fontSize: '0.875rem',
						letterSpacing: '0.3px',
						minWidth: '28px',
						textAlign: 'center'
					}}
				>
					{language.id.toUpperCase()}
				</Typography>

				{/* Dropdown Arrow */}
				<KeyboardArrowDownIcon
					sx={{
						fontSize: '1.25rem',
						marginLeft: '4px',
						transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
						transform: menuOpen ? 'rotateZ(180deg)' : 'rotateZ(0)',
						color: 'currentColor'
					}}
				/>
			</Button>

			{/* Language Selection Dropdown Menu */}
			<Popover
				open={menuOpen}
				anchorEl={menu}
				onClose={langMenuClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'center'
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'center'
				}}
				slotProps={{
					paper: {
						elevation: 8,
						sx: (theme) => ({
							marginTop: '8px',
							borderRadius: '12px',
							border: `1px solid ${theme.palette.divider}`,
							backgroundColor: theme.palette.background.paper,
							minWidth: '220px',
							overflow: 'hidden',
							backdropFilter: 'blur(8px)',
							backgroundImage: theme.palette.mode === 'dark'
								? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
								: 'none'
						})
					}
				}}
			>
				{/* Language Menu Items */}
				<Box sx={{ py: 1 }}>
					{languages.map((lng, index) => {
						const isActive = lng.id === language.id;
						return (
							<MenuItem
								key={lng.id}
								onClick={() => handleLanguageChange(lng)}
								sx={(theme) => ({
									px: 2,
									py: 1.25,
									mx: 1,
									mb: index < languages.length - 1 ? 0.5 : 0,
									borderRadius: '8px',
									transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
									backgroundColor: isActive
										? theme.palette.primary.main + '15'
										: 'transparent',
									borderLeft: isActive
										? `3px solid ${theme.palette.primary.main}`
										: '3px solid transparent',
									pl: isActive ? '14px' : 2,
									'&:hover': {
										backgroundColor: isActive
											? theme.palette.primary.main + '25'
											: theme.palette.action.hover,
										transform: 'translateX(4px)'
									},
									'& .MuiListItemIcon-root': {
										minWidth: '36px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}
								})}
							>
								{/* Flag Icon in Menu */}
								<ListItemIcon>
									<Box
										sx={{
											width: 28,
											height: 21,
											borderRadius: '5px',
											overflow: 'hidden',
											backgroundColor: '#f5f5f5',
											border: '1px solid rgba(0, 0, 0, 0.1)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											'& img': {
												width: '100%',
												height: '100%',
												objectFit: 'cover',
												display: 'block'
											}
										}}
									>
										<img
											src={`/assets/images/flags/${lng.flag}.svg`}
											alt={lng.title}
											loading="lazy"
										/>
									</Box>
								</ListItemIcon>

								{/* Language Name */}
								<ListItemText
									primary={lng.title}
									sx={{
										'& .MuiTypography-root': {
											fontWeight: isActive ? 700 : 500,
											fontSize: '0.875rem'
										}
									}}
								/>

								{/* Active Indicator */}
								{isActive && (
									<Box
										sx={{
											width: 6,
											height: 6,
											borderRadius: '50%',
											backgroundColor: 'currentColor',
											ml: 'auto',
											animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
											'@keyframes pulse': {
												'0%, 100%': { opacity: 1 },
												'50%': { opacity: 0.5 }
											}
										}}
									/>
								)}
							</MenuItem>
						);
					})}
				</Box>
			</Popover>
		</>
	);
}

export default LanguageSwitcher;
