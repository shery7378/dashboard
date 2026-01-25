import { FuseSettingsConfigType } from '@fuse/core/FuseSettings/FuseSettings';
import { PartialDeep } from 'type-fest';

/**
 * The type definition for a user object.
 */
export type User = {
	id: string;
	store_id?: string | null;
	profile_id?: string | null;
	role: string[] | string | null;
	displayName: string;
	photoURL?: string;
	email?: string;
	shortcuts?: string[];
	settings?: PartialDeep<FuseSettingsConfigType>;
	loginRedirectUrl?: string; // The URL to redirect to after login.
};
