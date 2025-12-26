import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * resources is an object that contains all the translations for the different languages.
 */
const resources = {
	en: {
		translation: {
			'Welcome to React': 'Welcome to React and react-i18next'
		}
	},
	tr: {
		translation: {
			'Welcome to React': 'React ve react-i18next\'e hoş geldiniz'
		}
	},
	ar: {
		translation: {
			'Welcome to React': 'مرحباً بك في React و react-i18next'
		}
	},
	es: {
		translation: {
			'Welcome to React': 'Bienvenido a React y react-i18next'
		}
	},
	fr: {
		translation: {
			'Welcome to React': 'Bienvenue dans React et react-i18next'
		}
	},
	de: {
		translation: {
			'Welcome to React': 'Willkommen bei React und react-i18next'
		}
	},
	it: {
		translation: {
			'Welcome to React': 'Benvenuto in React e react-i18next'
		}
	},
	pt: {
		translation: {
			'Welcome to React': 'Bem-vindo ao React e react-i18next'
		}
	},
	zh: {
		translation: {
			'Welcome to React': '欢迎使用 React 和 react-i18next'
		}
	}
};

/**
 * i18n is initialized with the resources object and the language to use.
 * The keySeparator option is set to false because we do not use keys in form messages.welcome.
 * The interpolation option is set to false because we do not use interpolation in form messages.welcome.
 */
i18n.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		resources,
		lng: 'en',
		fallbackLng: 'en',
		supportedLngs: ['en', 'tr', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'zh'],

		keySeparator: false, // we do not use keys in form messages.welcome

		interpolation: {
			escapeValue: false, // react already safes from xss
			formatSeparator: ','
		}
	});

export default i18n;
