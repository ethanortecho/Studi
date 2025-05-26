import { Modal, View, Text, Pressable } from 'react-native';

interface CategoryManagerProps {
    visible: boolean;
    onClose: () => void;
}

export default function CategoryManager({ visible, onClose }: CategoryManagerProps) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white w-[90%] rounded-xl p-6">
                    <Text className="text-xl font-bold mb-4">Manage Categories</Text>
                    <Pressable 
                        onPress={onClose}
                        className="bg-gray-200 py-2 px-4 rounded-full self-end"
                    >
                        <Text className="font-medium">Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
