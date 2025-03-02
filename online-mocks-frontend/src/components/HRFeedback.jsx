import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axios/axios';
import logo from '../assets/foresebluelogo.png';

function HRFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState({
    companyName: '',
    hrName: '',
    technicalKnowledge: '',
    serviceAndCoordination: '',
    communicationSkills: '',
    futureParticipation: '',
    punctualityAndInterest: '',
    suggestions: '',
    issuesFaced: '',
    improvementSuggestions: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/hr/feedback', feedback);
      console.log('Feedback submitted:', response.data);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setErrorMessage(error.response?.data?.message || 'Error submitting feedback. Please try again.');
      setShowErrorModal(true);
    }
  };

  const ratingOptions = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <img src={logo} alt="Logo" className="h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">HR Feedback Form</h2>
          <p className="text-base text-gray-600">Your feedback helps us enhance our services</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-6 space-y-6 border border-gray-100">
          {/* Company and HR Details */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                className="block w-full px-3 py-2 rounded-lg border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all duration-200"
                placeholder="Enter company name"
                value={feedback.companyName}
                onChange={(e) => setFeedback({...feedback, companyName: e.target.value})}
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-1">HR Name</label>
              <input
                type="text"
                required
                className="block w-full px-3 py-2 rounded-lg border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all duration-200"
                placeholder="Enter your name"
                value={feedback.hrName}
                onChange={(e) => setFeedback({...feedback, hrName: e.target.value})}
              />
            </div>
          </div>

          {/* Rating Questions */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Evaluation</h3>
            {[
              { key: 'technicalKnowledge', label: 'Rate the candidates based on their technical/subject knowledge' },
              { key: 'serviceAndCoordination', label: 'How would you rate our service and event coordination?' },
              { key: 'communicationSkills', label: "How would you rate our students' communication skills?" },
              { key: 'futureParticipation', label: 'How likely are you to attend the event in the upcoming years?' },
              { key: 'punctualityAndInterest', label: "How would you rate the students' punctuality and interest towards learning?" }
            ].map(({ key, label }) => (
              <div key={key} className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
                <div className="flex justify-between items-center max-w-md">
                  {ratingOptions.map((rating) => (
                    <label key={rating} className="flex flex-col items-center space-y-1 cursor-pointer group">
                      <input
                        type="radio"
                        required
                        name={key}
                        value={rating}
                        checked={feedback[key] === rating.toString()}
                        onChange={(e) => setFeedback({...feedback, [key]: e.target.value})}
                        className="sr-only"
                      />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium transition-all duration-200
                        ${feedback[key] === rating.toString()
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-600 border-2 border-gray-200 group-hover:border-purple-400'}`}>
                        {rating}
                      </div>
                      <span className="text-xs text-gray-500">
                        {rating === 1 ? 'Poor' : rating === 5 ? 'Excellent' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Text Questions */}
          <div className="space-y-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Feedback</h3>
            {[
              { key: 'suggestions', label: 'Please drop your suggestions to improve our events in the forthcoming years' },
              { key: 'issuesFaced', label: 'Mention any issues faced during the event' },
              { key: 'improvementSuggestions', label: "How can we improve the students' exposure and technical knowledge?" }
            ].map(({ key, label }) => (
              <div key={key} className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border-gray-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-all duration-200"
                  rows="3"
                  placeholder="Your feedback is valuable to us..."
                  value={feedback[key]}
                  onChange={(e) => setFeedback({...feedback, [key]: e.target.value})}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg
                       hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 
                       focus:ring-purple-500 focus:ring-offset-2 transform hover:-translate-y-0.5 
                       transition-all duration-200 font-medium text-base shadow-lg"
            >
              Submit Feedback
            </button>
          </div>
        </form>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-96 transform transition-all duration-200">
              <div className="flex items-center justify-center mb-4 text-green-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">Thank You!</h3>
              <p className="text-gray-600 text-center mb-6">Your feedback has been submitted successfully.</p>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/');
                  }}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-96 transform transition-all duration-200">
              <div className="flex items-center justify-center mb-4 text-red-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">Error</h3>
              <p className="text-gray-600 text-center mb-6">{errorMessage}</p>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HRFeedback;
