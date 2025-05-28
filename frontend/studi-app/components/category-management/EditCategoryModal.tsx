import { Modal, View } from 'react-native';
import { Category } from '@/utils/studySession';

interface EditCategoryModalProps {
    visible: boolean;
    onClose: () => void;
    category: Category;
}

export default function EditCategoryModal({ visible, onClose, category }: EditCategoryModalProps) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center">
                <View className="bg-white p-4 rounded-lg">
                </View>
            </View>
        </Modal>
    );
}