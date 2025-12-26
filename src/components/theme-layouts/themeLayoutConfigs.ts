import ThemeFormConfigTypes from '@fuse/core/FuseSettings/ThemeFormConfigTypes';
import layout1, { Layout1ConfigDefaultsType } from './layout1/Layout1Config';
import layout2, { Layout2ConfigDefaultsType } from './layout2/Layout2Config';
import layout3, { Layout3ConfigDefaultsType } from './layout3/Layout3Config';
import layout4, { Layout4ConfigDefaultsType } from './layout4/Layout4Config';

/**
 * The type definition for the theme layout defaults.
 */
export type themeLayoutDefaultsProps =
	| Layout1ConfigDefaultsType
	| Layout3ConfigDefaultsType
	| Layout2ConfigDefaultsType
	| Layout4ConfigDefaultsType;

/**
 * The type definition for the theme layout.
 */
export type themeLayoutProps = {
	title: string;
	defaults: themeLayoutDefaultsProps;
	form?: ThemeFormConfigTypes;
};

/**
 * The type definition for the theme layout configs.
 */
export type themeLayoutConfigsProps = Record<string, themeLayoutProps>;

/**
 * The theme layout configs.
 */
const themeLayoutConfigs: themeLayoutConfigsProps = {
	layout1: layout1 as themeLayoutProps,
	layout2: layout2 as themeLayoutProps,
	layout3: layout3 as themeLayoutProps,
	layout4: layout4 as themeLayoutProps
};

export default themeLayoutConfigs;
