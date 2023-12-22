export enum ProtocolVersion {
    Version_0_75 = 3,
    Version_0_76 = 4,
}
export enum DisconnectReason {
    Banned = 1,
    IpLimitExceeded = 2,
    WrongProtocolVersion = 3,
    ServerFull = 4,
    Kicked = 10,
}
export enum PacketType {
    PositionData = 0,
    OrientationData = 1,
    WorldUpdate = 2,
    InputData = 3,
    WeaponInput = 4,
    HealthUpdate = 5,
    // HitPacket        = 5, // client
    // SetHp            = 5, // server
    GrenadePacket = 6,
    SetTool = 7,
    SetColor = 8,
    ExistingPlayer = 9,
    ShortPlayerDATA = 10,
    MoveObject = 11,
    CreatePlayer = 12,
    BlockAction = 13,
    BlockLine = 14,
    StateData = 15,
    KillAction = 16,
    ChatMessage = 17,
    MapStart = 18,
    MapChunk = 19,
    PlayerLeft = 20,
    TerritoryCapture = 21,
    ProgressBar = 22,
    IntelCapture = 23,
    IntelPickup = 24,
    IntelDrop = 25,
    Restock = 26,
    FogColor = 27,
    WeaponReload = 28,
    ChangeTeam = 29,
    ChangeWeapon = 30,
    MapCached = 31,
    VersionRequest = 33,
    VersionResponse = 34,
}

export enum TeamId {
    A = 0,
    B = 1,
    Spectator = 255,
}
export enum GamemodeType {
    CTF = 0,
    TC = 1,
}
export enum IntelFlag {
    None = 0b00,
    TeamA = 0b01,
    TeamB = 0b10,
    BothTeams = 0b11,
}
