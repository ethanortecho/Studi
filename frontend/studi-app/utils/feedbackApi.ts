import { apiClient } from './apiClient';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface FeedbackType {
  value: string;
  label: string;
}

export interface FeedbackData {
  feedback_type: string;
  description: string;
  user_email: string;
  device_info?: {
    platform: string;
    app_version: string;
    device_model?: string;
    expo_version?: string;
  };
}

export interface FeedbackResponse {
  message: string;
  feedback_id: number;
  type: string;
}

export interface ApiError {
  error: string;
}

/**
 * Get available feedback types from backend
 */
export async function getFeedbackTypes(): Promise<FeedbackType[]> {
  try {
    const response = await apiClient.get<{ feedback_types: FeedbackType[] }>('/feedback/types/');

    if (response.error) {
      console.error('Error fetching feedback types:', response.error);
      // Return default types if API fails
      return getDefaultFeedbackTypes();
    }

    return response.data?.feedback_types || getDefaultFeedbackTypes();
  } catch (error) {
    console.error('Failed to fetch feedback types:', error);
    return getDefaultFeedbackTypes();
  }
}

/**
 * Submit user feedback to backend
 */
export async function submitFeedback(
  feedbackType: string,
  description: string,
  userEmail: string
): Promise<{ success: boolean; error?: string; data?: FeedbackResponse }> {
  try {
    // Collect device info
    const deviceInfo = {
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version || '1.0.0',
      device_model: Platform.OS === 'ios' ?
        Constants.platform?.ios?.model :
        Constants.platform?.android?.model,
      expo_version: Constants.expoVersion,
    };

    const feedbackData: FeedbackData = {
      feedback_type: feedbackType,
      description: description.trim(),
      user_email: userEmail,
      device_info: deviceInfo,
    };

    const response = await apiClient.post<FeedbackResponse>('/feedback/', feedbackData);

    if (response.error) {
      return {
        success: false,
        error: response.error.message || 'Failed to submit feedback'
      };
    }

    if (!response.data) {
      return {
        success: false,
        error: 'Invalid response from server'
      };
    }

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Default feedback types (fallback if API fails)
 */
function getDefaultFeedbackTypes(): FeedbackType[] {
  return [
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'improvement', label: 'Improvement Suggestion' },
    { value: 'general', label: 'General Feedback' },
    { value: 'other', label: 'Other' },
  ];
}