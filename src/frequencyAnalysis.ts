export const EXPECTED_SAMPLERATE_HZ = 96000;

// Max (imposed by Web API) is 2^15. Higher == finer detail but more latency
// between sound and image.
export const EXPECTED_FFT_SIZE = Math.pow(2, 13);

// How many frequencies in each bucket
export const FFT_BUCKET_FREQ_SIZE = EXPECTED_SAMPLERATE_HZ / EXPECTED_FFT_SIZE;

// Ratio in equal-tempered tuning. See
// https://pages.mtu.edu/~suits/NoteFreqCalcs.html
const TWELFTH_ROOT_OF_2 = Math.pow(2, 1 / 12);

export const fftIndexToHz = (index: number): number => {
  return (index + 1) * FFT_BUCKET_FREQ_SIZE + FFT_BUCKET_FREQ_SIZE / 2;
};

export const hzToFftIndex = (frequencyHz: number): number => {
  return Math.floor(frequencyHz / FFT_BUCKET_FREQ_SIZE);
};

export const EXPECTED_FIRST_USEFUL_FFT_INDEX = hzToFftIndex(50);

const equalTempered = (halfStepsFromA4: number, A4Hz = 440) => {
  return A4Hz * Math.pow(TWELFTH_ROOT_OF_2, halfStepsFromA4);
};

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const OCTAVE_HALFSTEPS = NOTE_NAMES.length;
const HALFSTEPS_TO_C0_FROM_A4 =
  OCTAVE_HALFSTEPS * 4 + NOTE_NAMES.findIndex((name) => name === "A");

export type NoteInfo = {
  hz: number;
  octave: number;
  name: string;
  nameAndOctave: string;
};

const noteInfoA440 = [...Array(12 * 9)].map((_, i): NoteInfo => {
  const octave = Math.floor(i / OCTAVE_HALFSTEPS);
  const name = NOTE_NAMES[i % NOTE_NAMES.length];
  return {
    hz: equalTempered(i - HALFSTEPS_TO_C0_FROM_A4),
    octave,
    name,
    nameAndOctave: `${name}${octave}`,
  };
});

export const noteInfoFromFrequency = (noteHz: number): NoteInfo => {
  let stepUpIndex = noteInfoA440.findIndex(({ hz }) => hz > noteHz);
  if (stepUpIndex === 0) {
    return noteInfoA440[0];
  }
  if (stepUpIndex === -1) {
    stepUpIndex = noteInfoA440.length - 1;
  }
  const stepUp = noteInfoA440[stepUpIndex];
  const stepDown = noteInfoA440[stepUpIndex - 1];
  // Return the closest note
  return noteHz - stepDown.hz < (stepUp.hz - stepDown.hz) / 2
    ? stepDown
    : stepUp;
};
