type GroupChannel = {
  mode: "GROUP" | "OPEN";
  groupId?: string | null;
};

export function hasDuplicateParticipantGroups(channels: readonly GroupChannel[]) {
  const groupIds = channels.flatMap((channel) =>
    channel.mode === "GROUP" && channel.groupId ? [channel.groupId] : [],
  );
  return new Set(groupIds).size !== groupIds.length;
}

export function isGroupAvailableForChannel(
  groupId: string,
  channels: readonly GroupChannel[],
  channelIndex: number,
) {
  return channels.every(
    (channel, index) =>
      index === channelIndex ||
      channel.mode !== "GROUP" ||
      channel.groupId !== groupId,
  );
}
