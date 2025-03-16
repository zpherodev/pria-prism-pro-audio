
import { SnapValue } from '@/types/pianoRoll';

export const getSnapValueInSeconds = (snapValue: SnapValue): number => {
  switch (snapValue) {
    case '1/32': return 0.125;
    case '1/16': return 0.25;
    case '1/8': return 0.5;
    case '1/4': return 1;
    case '1/2': return 2;
    case '1': return 4;
    default: return 0.5;
  }
};

export const snapTimeToGrid = (time: number, snapValue: SnapValue): number => {
  const snapInSeconds = getSnapValueInSeconds(snapValue);
  return Math.round(time / snapInSeconds) * snapInSeconds;
};
