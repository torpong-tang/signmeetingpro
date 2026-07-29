type SortableAttendance = {
  personNo: number;
  displayOrder: number;
  channel: { channelNo: number };
};

export function sortAttendanceByChannelAndOrder<T extends SortableAttendance>(
  attendances: T[],
) {
  return [...attendances].sort((left, right) => {
    const channelDifference = right.channel.channelNo - left.channel.channelNo;
    if (channelDifference !== 0) return channelDifference;

    const leftOrder =
      left.displayOrder > 0 ? left.displayOrder : left.personNo;
    const rightOrder =
      right.displayOrder > 0 ? right.displayOrder : right.personNo;
    return leftOrder - rightOrder || left.personNo - right.personNo;
  });
}
