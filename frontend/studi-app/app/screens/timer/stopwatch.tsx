import React from 'react';
import { useStopwatch, StopwatchConfig } from '../../../hooks/timer';
import TimerScreen from '../../../components/timer/shared/TimerScreen';
import StopwatchDisplay from '../../../components/timer/displays/StopwatchDisplay';

export default function RecordSessionScreen() {
    // Create config with category info
    const stopwatchConfig: StopwatchConfig = {};
    
    const timerHook = useStopwatch(stopwatchConfig);
    
    return (
        <TimerScreen
            timerType="stopwatch"
            timerDisplayComponent={<StopwatchDisplay formatTime={timerHook.formatTime} />}
            timerHook={timerHook}
        />
    );
}