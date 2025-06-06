import { Text, View, Pressable } from 'react-native';
import { useStopwatch } from '@/hooks/timer';
import { useEffect } from 'react';
import { useState } from 'react';
import { CancelSessionModal } from '@/components/modals/CancelSessionModal';

export function Timer() {
    const { startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer, elapsed, status, formatTime } = useStopwatch();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        console.log("Timer component: status changed to", status);
    }, [status]);
    
    const handlePlayPause = async () => {
        console.log("Timer component: handlePlayPause called, current status:", status);
        if (status === 'running') {
            pauseTimer();
        } else if (status === 'paused') {
            resumeTimer();
        } else {
            try {
                await startTimer();
                console.log("Timer component: startTimer completed");
            } catch (error) {
                console.error("Timer component: startTimer error:", error);
            }
        }
    };
    
    const handleCancel = async () => {
        setIsLoading(true);
        try {
            await cancelTimer();
            setShowCancelModal(false);
        } catch (error) {
            console.error("Timer component: cancelTimer error:", error);
            // Could show error toast here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="items-center p-6 bg-white rounded-xl">
            {(status === 'running' || status === 'paused') && (
                <Pressable 
                    onPress={() => setShowCancelModal(true)}
                    className="absolute top-2 right-2 p-2"
                >
                    <Text className="text-red-500 text-lg font-bold">✕</Text>
                </Pressable>
            )}
            
            <View className="mb-4">
                <Text className="text-4xl font-bold text-gray-800">{formatTime()}</Text>
            </View>
            
            <View className="w-full">
                <Pressable 
                    onPress={handlePlayPause}
                    className="bg-green-500 py-3 px-6 rounded-full items-center"
                >
                    <Text className="text-white font-medium text-lg">
                        {status === 'running' ? 'Pause' : (status === 'paused' ? 'Resume' : 'Start')}
                    </Text>
                </Pressable>
            </View>
            
            {(status === 'running' || status === 'paused') && (
                <View className="w-full mt-4">
                    <Pressable 
                        onPress={stopTimer}
                        className="bg-red-500 py-3 px-6 rounded-full items-center mt-2"
                    >
                        <Text className="text-white font-medium text-lg">
                            End Session
                        </Text>
                    </Pressable>
                </View>
            )}
            
            <CancelSessionModal
                visible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancel}
                isLoading={isLoading}
            />
        </View>
    );
}