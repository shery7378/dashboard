'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
} from '@mui/material';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import LiveSellingHeader from './LiveSellingHeader';
import LiveSellingSessionDialog from './LiveSellingSessionDialog';

interface LiveSellingSession {
    id: number;
    title: string;
    description?: string;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    scheduled_at?: string;
    started_at?: string;
    ended_at?: string;
    viewer_count: number;
    featured_products?: number[];
    thumbnail?: string;
    channel_name: string;
    vendor?: {
        id: number;
        first_name?: string;
        last_name?: string;
        email: string;
    };
    store?: {
        id: number;
        name: string;
    };
}

function LiveSelling() {
    const { enqueueSnackbar } = useSnackbar();
    const [sessions, setSessions] = useState<LiveSellingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<LiveSellingSession | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth_token');
            const response = await axios.get(`${apiUrl}/api/live-selling/my-sessions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
            const data = response.data.data?.data || response.data.data || [];
            setSessions(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Error fetching sessions:', err);
            setError(err.response?.data?.message || 'Failed to load live selling sessions');
            enqueueSnackbar('Failed to load sessions', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = () => {
        setSelectedSession(null);
        setDialogOpen(true);
    };

    const handleEditSession = (session: LiveSellingSession) => {
        setSelectedSession(session);
        setDialogOpen(true);
    };

    const handleDeleteSession = async (sessionId: number) => {
        if (!window.confirm('Are you sure you want to delete this session?')) {
            return;
        }

        try {
            setActionLoading(sessionId);
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth_token');
            await axios.delete(`${apiUrl}/api/live-selling/${sessionId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
            enqueueSnackbar('Session deleted successfully', { variant: 'success' });
            fetchSessions();
        } catch (err: any) {
            console.error('Error deleting session:', err);
            enqueueSnackbar(err.response?.data?.message || 'Failed to delete session', { variant: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleStartSession = async (sessionId: number) => {
        try {
            setActionLoading(sessionId);
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth_token');
            const response = await axios.post(`${apiUrl}/api/live-selling/${sessionId}/start`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
            enqueueSnackbar('Session started successfully', { variant: 'success' });
            fetchSessions();
            
            // Open the live session in a new window (frontend URL)
            const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin.replace(':3000', ':3001') || 'http://localhost:3001';
            const sessionUrl = `${frontendUrl}/live-selling/${sessionId}`;
            window.open(sessionUrl, '_blank');
        } catch (err: any) {
            console.error('Error starting session:', err);
            enqueueSnackbar(err.response?.data?.message || 'Failed to start session', { variant: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleEndSession = async (sessionId: number) => {
        if (!window.confirm('Are you sure you want to end this live session?')) {
            return;
        }

        try {
            setActionLoading(sessionId);
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth_token');
            await axios.post(`${apiUrl}/api/live-selling/${sessionId}/end`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
            enqueueSnackbar('Session ended successfully', { variant: 'success' });
            fetchSessions();
        } catch (err: any) {
            console.error('Error ending session:', err);
            enqueueSnackbar(err.response?.data?.message || 'Failed to end session', { variant: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDialogClose = (refresh = false) => {
        setDialogOpen(false);
        setSelectedSession(null);
        if (refresh) {
            fetchSessions();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live':
                return 'error';
            case 'scheduled':
                return 'info';
            case 'ended':
                return 'default';
            case 'cancelled':
                return 'warning';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <Box className="flex items-center justify-center min-h-screen">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="flex flex-col flex-auto p-24 sm:p-32">
            <LiveSellingHeader onCreateSession={handleCreateSession} />

            {error && (
                <Alert severity="error" className="mb-24" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {sessions.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-48">
                        <FuseSvgIcon className="text-48 text-gray-400 mb-16">
                            heroicons-outline:video-camera
                        </FuseSvgIcon>
                        <Typography variant="h6" className="mb-8">
                            No Live Selling Sessions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" className="mb-24">
                            Create your first live selling session to start broadcasting to customers
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
                            onClick={handleCreateSession}
                        >
                            Create Session
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {sessions.map((session) => (
                        <Grid item xs={12} sm={6} md={4} key={session.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="flex flex-col h-full">
                                    <Box className="relative h-200 bg-gradient-to-br from-blue-400 to-purple-500">
                                        {session.thumbnail ? (
                                            <img
                                                src={session.thumbnail}
                                                alt={session.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Box className="flex items-center justify-center h-full">
                                                <FuseSvgIcon className="text-64 text-white opacity-50">
                                                    heroicons-outline:video-camera
                                                </FuseSvgIcon>
                                            </Box>
                                        )}
                                        <Chip
                                            label={session.status.toUpperCase()}
                                            color={getStatusColor(session.status)}
                                            size="small"
                                            className="absolute top-8 right-8"
                                        />
                                        {session.status === 'live' && (
                                            <Chip
                                                label={`${session.viewer_count} viewers`}
                                                color="error"
                                                size="small"
                                                className="absolute top-8 left-8"
                                            />
                                        )}
                                    </Box>
                                    <CardContent className="flex flex-col flex-auto">
                                        <Typography variant="h6" className="mb-8 line-clamp-2">
                                            {session.title}
                                        </Typography>
                                        {session.description && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                className="mb-16 line-clamp-2"
                                            >
                                                {session.description}
                                            </Typography>
                                        )}
                                        <Stack spacing={1} className="mb-16">
                                            {session.scheduled_at && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Scheduled: {formatDate(session.scheduled_at)}
                                                </Typography>
                                            )}
                                            {session.started_at && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Started: {formatDate(session.started_at)}
                                                </Typography>
                                            )}
                                            {session.ended_at && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Ended: {formatDate(session.ended_at)}
                                                </Typography>
                                            )}
                                        </Stack>
                                        <Stack direction="row" spacing={1} className="mt-auto">
                                            {session.status === 'scheduled' && (
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    fullWidth
                                                    onClick={() => handleStartSession(session.id)}
                                                    disabled={actionLoading === session.id}
                                                    startIcon={
                                                        actionLoading === session.id ? (
                                                            <CircularProgress size={16} />
                                                        ) : (
                                                            <FuseSvgIcon>heroicons-outline:play</FuseSvgIcon>
                                                        )
                                                    }
                                                >
                                                    Start
                                                </Button>
                                            )}
                                            {session.status === 'live' && (
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    size="small"
                                                    fullWidth
                                                    onClick={() => handleEndSession(session.id)}
                                                    disabled={actionLoading === session.id}
                                                    startIcon={
                                                        actionLoading === session.id ? (
                                                            <CircularProgress size={16} />
                                                        ) : (
                                                            <FuseSvgIcon>heroicons-outline:stop</FuseSvgIcon>
                                                        )
                                                    }
                                                >
                                                    End
                                                </Button>
                                            )}
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleEditSession(session)}
                                                disabled={session.status === 'live' || session.status === 'ended'}
                                            >
                                                Edit
                                            </Button>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteSession(session.id)}
                                                disabled={actionLoading === session.id || session.status === 'live'}
                                            >
                                                <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
                                            </IconButton>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            )}

            <LiveSellingSessionDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                session={selectedSession}
            />
        </div>
    );
}

export default LiveSelling;

