import {
    DEFAULT_BACKGROUND_SETTINGS,
    BackgroundSettings
} from "./sections/background";

import {
    GENERAL_DEFAULTS,
    GeneralSettings
} from "./sections/general";

import {
    UNIVERSE_DEFAULTS,
    UniverseSettings
} from "./sections/universe";

import {
    CONNECTION_DEFAULTS,
    ConnectionSettings
} from "./sections/connections";

import {
    MOUSE_DEFAULTS,
    MouseSettings
} from "./sections/mouse";

import {
    BURST_DEFAULTS,
    BurstSettings
} from "./sections/bursts";

export type CosmosSettings =
    GeneralSettings &
    UniverseSettings &
    ConnectionSettings &
    MouseSettings &
    BurstSettings &
    BackgroundSettings;

export const DEFAULT_SETTINGS: CosmosSettings = {
    ...GENERAL_DEFAULTS,
    ...UNIVERSE_DEFAULTS,
    ...CONNECTION_DEFAULTS,
    ...MOUSE_DEFAULTS,
    ...BURST_DEFAULTS,
    ...DEFAULT_BACKGROUND_SETTINGS

};