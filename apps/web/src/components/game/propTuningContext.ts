'use client';

import { createContext, useContext } from 'react';
import { PROP_TUNING, PropTuning } from './propTuning';

/** Lets the figure studio preview refinements before they are saved. Everywhere else it is the saved tuning. */
export const PropTuningContext = createContext<PropTuning>(PROP_TUNING);

export const usePropTuning = () => useContext(PropTuningContext);
