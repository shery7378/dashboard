'use client';
import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import useFuseSettings from '@fuse/core/FuseSettings/hooks/useFuseSettings';
import i18n from './i18n';
import I18nContext from './I18nContext';
import { LanguageType } from './I18nContext';

type I18nProviderProps = {
	children: React.ReactNode;
};

const languages: LanguageType[] = [
	{ id: 'en', title: 'English', flag: 'GB' },
	{ id: 'tr', title: 'Turkish', flag: 'TR' },
	{ id: 'ar', title: 'Arabic', flag: 'SA' },
	{ id: 'es', title: 'Spanish', flag: 'ES' },
	{ id: 'fr', title: 'French', flag: 'FR' },
	{ id: 'de', title: 'German', flag: 'DE' },
	{ id: 'it', title: 'Italian', flag: 'IT' },
	{ id: 'pt', title: 'Portuguese', flag: 'PT' },
	{ id: 'zh', title: 'Chinese', flag: 'CN' }
];

// Helper function to get saved language from localStorage
const getSavedLanguage = (): string => {
	if (typeof window === 'undefined') {
		return i18n.options.lng as string;
	}

	try {
		const savedLanguage = localStorage.getItem('app-language');
		if (savedLanguage && languages.some(lang => lang.id === savedLanguage)) {
			return savedLanguage;
		}
	} catch (error) {
		console.warn('Failed to read language from localStorage:', error);
	}

	return i18n.options.lng as string;
};

export function I18nProvider(props: I18nProviderProps) {
	const { children } = props;
	const { data: settings, setSettings } = useFuseSettings();
	const settingsThemeDirection = useMemo(() => settings.direction, [settings]);
	const [languageId, setLanguageId] = useState(() => getSavedLanguage());

	const changeLanguage = async (languageId: string) => {
		setLanguageId(languageId);
		await i18n.changeLanguage(languageId);

		// Save language preference to localStorage
		try {
			localStorage.setItem('app-language', languageId);
		} catch (error) {
			console.warn('Failed to save language to localStorage:', error);
		}
	};

	useEffect(() => {
		if (languageId !== i18n.options.lng) {
			i18n.changeLanguage(languageId);
		}

		const langDirection = i18n.dir(languageId);

		if (settingsThemeDirection !== langDirection) {
			setSettings({ direction: langDirection });
		}
	}, [languageId, setSettings, settingsThemeDirection]);

	return (
		<I18nContext
			value={useMemo(
				() => ({
					language: _.find(languages, { id: languageId }),
					languageId,
					langDirection: i18n.dir(languageId),
					languages,
					changeLanguage
				}),
				[languageId]
			)}
		>
			{children}
		</I18nContext>
	);
}
