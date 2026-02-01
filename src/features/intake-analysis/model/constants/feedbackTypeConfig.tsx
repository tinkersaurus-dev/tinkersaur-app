import {
  FiArchive,
  FiAlertTriangle,
  FiAlertCircle,
  FiThumbsUp,
  FiHelpCircle,
} from 'react-icons/fi';
import type { FeedbackType } from '@/entities/feedback';

// Icon mapping for feedback types
export const FEEDBACK_ICONS: Record<FeedbackType, React.ReactNode> = {
  suggestion: <FiArchive className="w-5 h-5" />,
  problem: <FiAlertTriangle className="w-5 h-5" />,
  concern: <FiAlertCircle className="w-5 h-5" />,
  praise: <FiThumbsUp className="w-5 h-5" />,
  question: <FiHelpCircle className="w-5 h-5" />,
};

// Background/text color mapping for feedback type icons
export const FEEDBACK_ICON_COLORS: Record<FeedbackType, string> = {
  suggestion: 'bg-blue-500/10 text-blue-500',
  problem: 'bg-red-500/10 text-red-500',
  concern: 'bg-orange-500/10 text-orange-500',
  praise: 'bg-green-500/10 text-green-500',
  question: 'bg-purple-500/10 text-purple-500',
};

// Tag color mapping for feedback types
export const FEEDBACK_TAG_COLORS: Record<FeedbackType, 'blue' | 'red' | 'orange' | 'green' | 'purple'> = {
  suggestion: 'blue',
  problem: 'red',
  concern: 'orange',
  praise: 'green',
  question: 'purple',
};
