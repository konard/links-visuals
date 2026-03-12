// Constants — immutable fractions of gridSpacing that define the layout.
// These are set once and never changed.

export const paddingFraction       = 0.215;  // side padding as fraction of half-viewport width
export const snapFraction          = 0.142;  // snap threshold as fraction of gridSpacing
export const radiusFraction        = 0.170;  // control circle radius as fraction of gridSpacing
export const strokeFraction        = 0.085;  // path stroke-width as fraction of gridSpacing
export const sideTolFraction       = 0.001;  // IK side-memory tolerance as fraction of gridSpacing

export const IK_SEG_COUNT          = 4;
export const IK_FIRST_INIT_ANGLE   = 0;
export const IK_FIRST_MAX_DELTA    = Math.PI / 2;
export const IK_SWEEP_STEPS        = 300;

export const MIN_SCALE             = 0.1;
export const MAX_SCALE             = 20;
