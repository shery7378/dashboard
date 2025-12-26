"use client";
import Link from "next/link";
import { Container, Grid, Card, CardContent, CardActions, Typography, Button, CardActionArea, Box, Avatar } from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import BoltIcon from "@mui/icons-material/Bolt";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";

export default function MarketingIndexPage() {
  const cards = [
    {
      title: "Coupons",
      desc: "Create promo codes, manage usage limits and validity windows.",
      href: "/pages/marketing/coupons",
      icon: (
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 44, height: 44 }}>
          <ConfirmationNumberIcon />
        </Avatar>
      ),
    },
    {
      title: "Flash Sales",
      desc: "Schedule time-bound discounts for selected products.",
      href: "/pages/marketing/flash-sales",
      icon: (
        <Avatar sx={{ bgcolor: "warning.main", color: "warning.contrastText", width: 44, height: 44 }}>
          <BoltIcon />
        </Avatar>
      ),
    },
    {
      title: "Campaigns",
      desc: "Send in-app announcements and schedule messages.",
      href: "/pages/marketing/campaigns",
      icon: (
        <Avatar sx={{ bgcolor: "secondary.main", color: "secondary.contrastText", width: 44, height: 44 }}>
          <CampaignIcon />
        </Avatar>
      ),
    },
  ];

  return (
    <Box sx={{
      background: (theme) => theme.palette.mode === 'dark'
        ? 'linear-gradient(180deg, rgba(23,23,23,1) 0%, rgba(30,30,30,1) 100%)'
        : 'linear-gradient(180deg, #fff 0%, #f7f9fc 100%)',
      py: { xs: 3, md: 6 },
    }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Marketing
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Grow conversions with coupons, flash sales, and campaigns.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {cards.map((c) => (
            <Grid key={c.title} item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                  backdropFilter: 'blur(6px)',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.shadows[8],
                  },
                }}
              >
                <CardActionArea component={Link as any} href={c.href} sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      {c.icon}
                      <Typography variant="h6" fontWeight={700}>{c.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{c.desc}</Typography>
                  </CardContent>
                  <CardActions sx={{ px: 3, pb: 3 }}>
                    <Button variant="contained" size="small">
                      Open
                    </Button>
                  </CardActions>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
