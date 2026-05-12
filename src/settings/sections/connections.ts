export interface ConnectionSettings {
    enableConnections: boolean;
    connectionDistance: number;
    connectionLineWidth: number;
    connectionColor: string;
    connectionBaseOpacity: number;
}

export const CONNECTION_DEFAULTS: ConnectionSettings = {
    enableConnections: true,
    connectionDistance: 115,
    connectionLineWidth: 0.35,
    connectionColor: "120, 195, 255",
    connectionBaseOpacity: 0.06
};