'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/**
 * Hook to get unread message count for conversations
 */
export function useUnreadMessagesCount() {
	const [unreadCount, setUnreadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const isMountedRef = useRef(true);

	// Get auth token
	const getAuthToken = async () => {
		try {
			const session = await getSession();
			const token = 
				session?.accessAuthToken || 
				session?.accessToken || 
				(typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);
			return token;
		} catch (error) {
			// Only log in development
			if (process.env.NODE_ENV === 'development') {
				console.error('Error getting session:', error);
			}
			if (typeof window !== 'undefined') {
				return localStorage.getItem('token') || localStorage.getItem('auth_token');
			}
			return null;
		}
	};

	// Fetch unread count
	const fetchUnreadCount = async () => {
		if (!isMountedRef.current) return;
		
		try {
			const token = await getAuthToken();
			if (!token) {
				if (isMountedRef.current) {
					setUnreadCount(0);
					setIsLoading(false);
				}
				return;
			}

			const response = await fetch(`${API_URL}/api/chat/conversations`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				credentials: 'include',
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success && data.data && Array.isArray(data.data)) {
					// Calculate total unread messages across all conversations
					let totalUnread = data.data.reduce((sum: number, conv: any) => {
						return sum + (conv.unread_count || 0);
					}, 0);
					
					if (isMountedRef.current) {
						setUnreadCount(totalUnread);
					}
				} else {
					// If response format is unexpected, default to 0
					if (isMountedRef.current) {
						setUnreadCount(0);
					}
				}
			} else if (response.status === 401) {
				// Unauthorized - user not logged in, set to 0
				if (isMountedRef.current) {
					setUnreadCount(0);
				}
			} else {
				// Other errors, default to 0
				if (isMountedRef.current) {
					setUnreadCount(0);
				}
			}
		} catch (error) {
			// Only log non-network-suspension errors
			if (error instanceof TypeError && error.message === 'Failed to fetch') {
				// Network error (likely ERR_NETWORK_IO_SUSPENDED) - silently handle
				// Don't update state to preserve last known count
				return;
			}
			// Log other errors only in development
			if (process.env.NODE_ENV === 'development') {
				console.error('[Bell Icon] Error fetching unread message count:', error);
			}
			if (isMountedRef.current) {
				setUnreadCount(0);
			}
		} finally {
			if (isMountedRef.current) {
				setIsLoading(false);
			}
		}
	};

	// Initial fetch
	useEffect(() => {
		isMountedRef.current = true;
		fetchUnreadCount();
		
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Poll for updates every 5 seconds (reduced from 10s for better responsiveness)
	useEffect(() => {
		if (!isMountedRef.current) return;
		
		pollIntervalRef.current = setInterval(() => {
			if (isMountedRef.current) {
				fetchUnreadCount();
			}
		}, 5000); // Reduced from 10s to 5s for better responsiveness

		return () => {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
			}
		};
	}, []);

	// Listen for custom event to refresh unread count immediately (e.g., when messages are viewed)
	useEffect(() => {
		const handleRefresh = () => {
			if (isMountedRef.current) {
				fetchUnreadCount();
			}
		};

		window.addEventListener('refreshUnreadMessagesCount', handleRefresh);

		return () => {
			window.removeEventListener('refreshUnreadMessagesCount', handleRefresh);
		};
	}, []);

	// Expose a manual refresh function
	const refresh = useCallback(() => {
		if (isMountedRef.current) {
			fetchUnreadCount();
		}
	}, []);

	return { unreadCount, isLoading, refresh };
}

