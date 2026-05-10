import type { BackgroundSettings } from "./sections/background";
import { BurstSettings } from "./sections/bursts";
import { ConnectionSettings } from "./sections/connections";
import { GeneralSettings } from "./sections/general";
import { MouseSettings } from "./sections/mouse";
import { UniverseSettings } from "./sections/universe";

export type { BackgroundSettings } from "./sections/background";

export {
    type ClickEffectMode
} from "./sections/general";

export type CosmosSettings =
    GeneralSettings &
    UniverseSettings &
    ConnectionSettings &
    MouseSettings &
    BurstSettings &
    BackgroundSettings;

export { DEFAULT_SETTINGS } from "./default";